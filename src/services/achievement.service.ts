import { prisma } from "@/lib/prisma";
import { EXAM_PASS_SCORE } from "@/lib/gamification";
import {
  ACHIEVEMENT_BY_KEY,
  ACHIEVEMENT_DEFINITIONS,
  type AchievementStats,
} from "@/lib/achievements";
import { recordSocialActivity } from "@/services/social.service";

export async function collectAchievementStats(userId: string): Promise<AchievementStats> {
  const [
    user,
    xp,
    lessonsCompleted,
    coursesCompleted,
    examsFinished,
    examsPassed,
    longExamAttempts,
    shopPurchases,
    followingCount,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { coins: true } }),
    prisma.userXP.findUnique({ where: { userId }, select: { level: true, totalXp: true } }),
    prisma.lessonProgress.count({ where: { userId, completed: true } }),
    prisma.courseEnrollment.count({ where: { userId, progress: { gte: 100 } } }),
    prisma.examAttempt.count({ where: { userId, finishedAt: { not: null } } }),
    prisma.examAttempt.count({
      where: { userId, finishedAt: { not: null }, score: { gte: EXAM_PASS_SCORE } },
    }),
    prisma.examAttempt.findMany({
      where: {
        userId,
        finishedAt: { not: null },
        studyMode: "FULL",
        totalQuestions: { gte: 100 },
      },
      select: { totalQuestions: true, _count: { select: { answers: true } } },
    }),
    prisma.userInventory.count({ where: { userId } }),
    prisma.userFollow.count({ where: { followerId: userId } }),
  ]);

  return {
    lessonsCompleted,
    coursesCompleted,
    level: xp?.level ?? 1,
    examsFinished,
    examsPassed,
    completedLongExam: longExamAttempts.some(
      (attempt) => attempt._count.answers >= attempt.totalQuestions,
    ),
    coins: user?.coins ?? 0,
    shopPurchases,
    followingCount,
    totalXp: xp?.totalXp ?? 0,
  };
}

export async function syncUserAchievements(userId: string): Promise<string[]> {
  const stats = await collectAchievementStats(userId);
  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementKey: true },
  });
  const existingKeys = new Set(existing.map((e) => e.achievementKey));

  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (existingKeys.has(def.key)) continue;
    if (!def.check(stats)) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementKey: def.key },
    });

    newlyUnlocked.push(def.key);

    try {
      await recordSocialActivity(
        userId,
        "ACHIEVEMENT",
        { achievement: def.title },
        `achievement:${def.key}`,
      );
    } catch {
      // Atividade já registrada ou perfil privado — ignora.
    }
  }

  return newlyUnlocked;
}

export type UserAchievementView = {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  unlocked: boolean;
  unlockedAt: Date | null;
};

export async function getUserAchievements(userId: string): Promise<UserAchievementView[]> {
  await syncUserAchievements(userId);

  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "desc" },
  });
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementKey, u.unlockedAt]));

  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    key: def.key,
    title: def.title,
    description: def.description,
    icon: def.icon,
    tier: def.tier,
    unlocked: unlockedMap.has(def.key),
    unlockedAt: unlockedMap.get(def.key) ?? null,
  }));
}

export async function getUnlockedAchievementCount(userId: string): Promise<number> {
  return prisma.userAchievement.count({ where: { userId } });
}

export function getAchievementDefinition(key: string) {
  return ACHIEVEMENT_BY_KEY[key] ?? null;
}

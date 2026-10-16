import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements";
import { EXAM_PASS_SCORE } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getUnlockedAchievementCount } from "@/services/achievement.service";
import type { UserXpProfile } from "@/services/xp.service";
import type { RankingLeague } from "@prisma/client";

export type ProfileShowcase = {
  level: number;
  currentXp: number;
  totalXp: number;
  progressPercent: number;
  xpToNextLevel: number;
  rank: number | null;
  league: RankingLeague;
  studyMinutes: number;
  studyStreakDays: number;
  activeDays: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  examsPassed: number;
  certificatesCount: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
};

function countConsecutiveDays(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates.map((d) => d.toISOString().slice(0, 10)))].sort().reverse();

  let streak = 1;
  const today = new Date().toISOString().slice(0, 10);
  if (uniqueDays[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (uniqueDays[0] !== yesterday.toISOString().slice(0, 10)) return 0;
  }

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }

  return streak;
}

async function getStudyMinutes(userId: string): Promise<number> {
  const [lessonRows, examAttempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { lesson: { select: { duration: true } } },
    }),
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { exam: { select: { timeLimit: true } } },
    }),
  ]);

  const defaultLessonMinutes = 10;
  const defaultExamMinutes = 20;

  const lessonMinutes = lessonRows.reduce(
    (sum, row) => sum + (row.lesson.duration ?? defaultLessonMinutes),
    0,
  );
  const examMinutes = examAttempts.reduce(
    (sum, row) => sum + (row.exam.timeLimit ?? defaultExamMinutes),
    0,
  );

  return lessonMinutes + examMinutes;
}

export async function getProfileShowcase(
  userId: string,
  xp: UserXpProfile | null,
  rank: number | null,
): Promise<ProfileShowcase> {
  const [
    userXp,
    userMeta,
    coursesCompleted,
    lessonsCompleted,
    examsPassed,
    certificatesCount,
    achievementsUnlocked,
    activityDates,
    studyMinutes,
  ] = await Promise.all([
    prisma.userXP.findUnique({
      where: { userId },
      select: { league: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { lastStudyAt: true },
    }),
    prisma.courseEnrollment.count({
      where: { userId, progress: { gte: 100 } },
    }),
    prisma.lessonProgress.count({ where: { userId, completed: true } }),
    prisma.examAttempt.count({
      where: { userId, finishedAt: { not: null }, score: { gte: EXAM_PASS_SCORE } },
    }),
    prisma.certificate.count({ where: { userId } }),
    getUnlockedAchievementCount(userId),
    prisma.xpTransaction.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 90,
    }),
    getStudyMinutes(userId),
  ]);

  const dates = activityDates.map((t) => t.createdAt);
  if (userMeta?.lastStudyAt) dates.push(userMeta.lastStudyAt);

  return {
    level: xp?.level ?? 1,
    currentXp: xp?.currentXp ?? 0,
    totalXp: xp?.totalXp ?? 0,
    progressPercent: xp?.progressPercent ?? 0,
    xpToNextLevel: xp?.xpToNextLevel ?? 100,
    rank,
    league: userXp?.league ?? "BRONZE",
    studyMinutes,
    studyStreakDays: countConsecutiveDays(dates),
    activeDays: new Set(dates.map((d) => d.toISOString().slice(0, 10))).size,
    coursesCompleted,
    lessonsCompleted,
    examsPassed,
    certificatesCount,
    achievementsUnlocked,
    achievementsTotal: ACHIEVEMENT_DEFINITIONS.length,
  };
}

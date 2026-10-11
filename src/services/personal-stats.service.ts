import { prisma } from "@/lib/prisma";
import { EXAM_PASS_SCORE } from "@/lib/gamification";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements";
import { getUserRank, getUserXpProfile } from "@/services/xp.service";
import { getUnlockedAchievementCount } from "@/services/achievement.service";

export type PersonalStats = {
  level: number;
  totalXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  rank: number | null;
  coins: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  examsTaken: number;
  examsPassed: number;
  averageExamScore: number | null;
  certificatesCount: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  xpThisWeek: number;
  activeDays: number;
  studyStreakDays: number;
};

export type ExamScoreBucket = {
  category: string;
  value: number;
  color: string;
  label: string;
};

export type PersonalStatsCharts = {
  xpTimeline: { date: string; xp: number; cumulativeXp: number }[];
  weeklyProgress: { week: string; xp: number; lessons: number; exams: number; streak: number }[];
  categoryDistribution: { category: string; value: number; color: string; label: string }[];
  skillRadar: { skill: string; value: number; maxValue: number; color: string }[];
  activityHeatmap: Record<string, number>;
  studyTimeEstimate: number; // total minutes
  examScoreDistribution: ExamScoreBucket[];
};

function countConsecutiveDays(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [
    ...new Set(dates.map((d) => d.toISOString().slice(0, 10))),
  ].sort()
    .reverse();

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

function getWeekLabel(date: Date): string {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

async function fetchXpTimeline(userId: string): Promise<{ date: string; xp: number; cumulativeXp: number }[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const transactions = await prisma.xpTransaction.findMany({
    where: { userId, createdAt: { gte: ninetyDaysAgo } },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, number>();
  for (const t of transactions) {
    if (!t.createdAt) continue;
    const amount = t.amount ?? 0;
    if (!Number.isFinite(amount)) continue;
    const dateStr = t.createdAt.toISOString().slice(0, 10);
    dailyMap.set(dateStr, (dailyMap.get(dateStr) ?? 0) + amount);
  }

  // Fill missing days with 0
  const result: { date: string; xp: number; cumulativeXp: number }[] = [];
  let cumulative = 0;
  const currentDate = new Date(ninetyDaysAgo);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const xp = dailyMap.get(dateStr) ?? 0;
    cumulative += xp;
    result.push({ date: dateStr, xp, cumulativeXp: cumulative });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

async function fetchWeeklyProgress(userId: string): Promise<{ week: string; xp: number; lessons: number; exams: number; streak: number }[]> {
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks

  const [xpTransactions, lessonProgresses, examAttempts] = await Promise.all([
    prisma.xpTransaction.findMany({
      where: { userId, createdAt: { gte: twelveWeeksAgo } },
      select: { amount: true, createdAt: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completed: true, completedAt: { gte: twelveWeeksAgo } },
      select: { completedAt: true },
    }),
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { gte: twelveWeeksAgo, not: null } },
      select: { finishedAt: true },
    }),
  ]);

  // Group by week
  const weeklyMap = new Map<string, { xp: number; lessons: number; exams: number; dates: Set<string> }>();

  for (const t of xpTransactions) {
    if (!t.createdAt) continue;
    const amount = t.amount ?? 0;
    if (!Number.isFinite(amount)) continue;
    const weekStart = new Date(t.createdAt);
    weekStart.setDate(t.createdAt.getDate() - t.createdAt.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    const entry = weeklyMap.get(key) ?? { xp: 0, lessons: 0, exams: 0, dates: new Set() };
    entry.xp += amount;
    weeklyMap.set(key, entry);
  }

  for (const lp of lessonProgresses) {
    if (!lp.completedAt) continue;
    const weekStart = new Date(lp.completedAt);
    weekStart.setDate(lp.completedAt.getDate() - lp.completedAt.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    const entry = weeklyMap.get(key) ?? { xp: 0, lessons: 0, exams: 0, dates: new Set() };
    entry.lessons += 1;
    entry.dates.add(lp.completedAt.toISOString().slice(0, 10));
    weeklyMap.set(key, entry);
  }

  for (const ea of examAttempts) {
    if (!ea.finishedAt) continue;
    const weekStart = new Date(ea.finishedAt);
    weekStart.setDate(ea.finishedAt.getDate() - ea.finishedAt.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    const entry = weeklyMap.get(key) ?? { xp: 0, lessons: 0, exams: 0, dates: new Set() };
    entry.exams += 1;
    entry.dates.add(ea.finishedAt.toISOString().slice(0, 10));
    weeklyMap.set(key, entry);
  }

  // Calculate streak per week (consecutive days with activity)
  const result: { week: string; xp: number; lessons: number; exams: number; streak: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - i * 7);
    const key = weekStart.toISOString().slice(0, 10);
    const entry = weeklyMap.get(key) ?? { xp: 0, lessons: 0, exams: 0, dates: new Set() };

    // Calculate streak for this week
    const sortedDates = Array.from(entry.dates).sort();
    let streak = 0;
    if (sortedDates.length > 0) {
      streak = 1;
      for (let j = 1; j < sortedDates.length; j++) {
        const prev = new Date(sortedDates[j - 1]);
        const curr = new Date(sortedDates[j]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) streak++;
        else streak = 1;
      }
    }

    result.push({
      week: getWeekLabel(weekStart),
      xp: entry.xp,
      lessons: entry.lessons,
      exams: entry.exams,
      streak,
    });
  }

  return result;
}

async function fetchCategoryDistribution(userId: string): Promise<{ category: string; value: number; color: string; label: string }[]> {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          category: { select: { name: true } },
          modules: { select: { lessons: { select: { id: true } } } },
        },
      },
      lessonProgresses: { where: { completed: true }, select: { lessonId: true } },
    },
  });

  const categoryMap = new Map<string, { lessons: number; completed: number }>();

  for (const e of enrollments) {
    // Relações podem estar ausentes em dados legados — nunca quebrar por isso.
    const catName = e.course?.category?.name ?? "Outros";
    const modules = e.course?.modules ?? [];
    const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
    const completedLessons = e.lessonProgresses?.length ?? 0;

    const existing = categoryMap.get(catName) ?? { lessons: 0, completed: 0 };
    existing.lessons += totalLessons;
    existing.completed += completedLessons;
    categoryMap.set(catName, existing);
  }

  const colors = [
    "hsl(var(--sidebar-highlight))",
    "#22d3ee",
    "#f97316",
    "#a78bfa",
    "#4ade80",
    "#fb7185",
    "#fcd34d",
    "#60a5fa",
  ];

  return Array.from(categoryMap.entries())
    .map(([category, data], i) => ({
      category,
      value: data.completed,
      color: colors[i % colors.length],
      label: `${data.completed}/${data.lessons} aulas`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

async function fetchSkillRadar(userId: string): Promise<{ skill: string; value: number; maxValue: number; color: string }[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: { select: { level: true, totalXp: true } },
      enrollments: {
        where: { progress: { gte: 100 } },
        include: { course: { select: { level: true, modules: { select: { lessons: { select: { id: true } } } } } } },
      },
      lessonProgresses: { where: { completed: true }, select: { lessonId: true } },
      examAttempts: { where: { finishedAt: { not: null } }, select: { score: true } },
      certificates: { select: { id: true } },
    },
  });

  if (!user) return [];

  const completedCourses = user.enrollments?.length ?? 0;
  const totalLessons = user.lessonProgresses?.length ?? 0;
  // Linhas antigas podem ter score null — trata como 0 e ignora não-finitos.
  const validScores = (user.examAttempts ?? [])
    .map((e) => e.score ?? 0)
    .filter((s) => Number.isFinite(s));
  const avgExamScore = validScores.length > 0
    ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
    : 0;
  const certificates = user.certificates?.length ?? 0;
  const level = user.xp?.level ?? 1;

  // Define skills with max values for normalization
  return [
    { skill: "Progresso", value: completedCourses, maxValue: Math.max(completedCourses, 20), color: "hsl(var(--sidebar-highlight))" },
    { skill: "Aulas", value: totalLessons, maxValue: Math.max(totalLessons, 200), color: "#22d3ee" },
    { skill: "Simulados", value: validScores.length, maxValue: Math.max(validScores.length, 50), color: "#f97316" },
    { skill: "Precisão", value: Math.round(avgExamScore), maxValue: 100, color: "#a78bfa" },
    { skill: "Certificados", value: certificates, maxValue: Math.max(certificates, 10), color: "#4ade80" },
    { skill: "Nível", value: level, maxValue: Math.max(level, 50), color: "#fcd34d" },
  ];
}

/**
 * Agrupa notas de simulados em faixas para o gráfico de distribuição.
 * Função pura (sem I/O) para facilitar testes. Nulos de linhas antigas
 * contam como 0; NaN/Infinity são descartados para nunca gerar NaN no gráfico.
 */
export function buildExamScoreDistribution(
  scores: Array<number | null | undefined>,
): ExamScoreBucket[] {
  const buckets: ExamScoreBucket[] = [
    { category: "90-100%", value: 0, color: "#4ade80", label: "Excelente" },
    { category: "70-89%", value: 0, color: "#22d3ee", label: "Bom" },
    { category: "50-69%", value: 0, color: "#fcd34d", label: "Regular" },
    { category: "<50%", value: 0, color: "#f97316", label: "Precisa melhorar" },
  ];

  for (const raw of scores) {
    const score = raw ?? 0;
    if (!Number.isFinite(score)) continue;
    if (score >= 90) buckets[0].value += 1;
    else if (score >= 70) buckets[1].value += 1;
    else if (score >= 50) buckets[2].value += 1;
    else buckets[3].value += 1;
  }

  return buckets;
}

async function fetchExamScoreDistribution(userId: string): Promise<ExamScoreBucket[]> {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId, finishedAt: { not: null } },
    select: { score: true },
  });

  return buildExamScoreDistribution(attempts.map((a) => a.score));
}

async function fetchActivityHeatmap(userId: string): Promise<Record<string, number>> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [xpTransactions, lessonProgresses, examAttempts] = await Promise.all([
    prisma.xpTransaction.findMany({
      where: { userId, createdAt: { gte: ninetyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completed: true, completedAt: { gte: ninetyDaysAgo } },
      select: { completedAt: true },
    }),
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { gte: ninetyDaysAgo, not: null } },
      select: { finishedAt: true },
    }),
  ]);

  const activityMap: Record<string, number> = {};

  for (const t of xpTransactions) {
    if (!t.createdAt) continue;
    const dateStr = t.createdAt.toISOString().slice(0, 10);
    activityMap[dateStr] = (activityMap[dateStr] ?? 0) + 1;
  }

  for (const lp of lessonProgresses) {
    if (!lp.completedAt) continue;
    const dateStr = lp.completedAt.toISOString().slice(0, 10);
    activityMap[dateStr] = (activityMap[dateStr] ?? 0) + 1;
  }

  for (const ea of examAttempts) {
    if (!ea.finishedAt) continue;
    const dateStr = ea.finishedAt.toISOString().slice(0, 10);
    activityMap[dateStr] = (activityMap[dateStr] ?? 0) + 1;
  }

  return activityMap;
}

export async function getPersonalStats(userId: string): Promise<PersonalStats> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    xpProfile,
    rank,
    user,
    coursesEnrolled,
    coursesCompleted,
    lessonsCompleted,
    examsTaken,
    examsPassed,
    examScores,
    certificatesCount,
    achievementsUnlocked,
    xpThisWeek,
    activityDates,
  ] = await Promise.all([
    getUserXpProfile(userId),
    getUserRank(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { coins: true, lastStudyAt: true } }),
    prisma.courseEnrollment.count({ where: { userId } }),
    prisma.courseEnrollment.count({ where: { userId, progress: { gte: 100 } } }),
    prisma.lessonProgress.count({ where: { userId, completed: true } }),
    prisma.examAttempt.count({ where: { userId, finishedAt: { not: null } } }),
    prisma.examAttempt.count({
      where: { userId, finishedAt: { not: null }, score: { gte: EXAM_PASS_SCORE } },
    }),
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { score: true },
    }),
    prisma.certificate.count({ where: { userId } }),
    getUnlockedAchievementCount(userId),
    prisma.xpTransaction.aggregate({
      where: { userId, createdAt: { gte: weekAgo } },
      _sum: { amount: true },
    }),
    prisma.xpTransaction.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 90,
    }),
  ]);

  // Linhas antigas podem ter score null — trata como 0 e ignora não-finitos.
  const validScores = examScores
    .map((e) => e.score ?? 0)
    .filter((s) => Number.isFinite(s));
  const averageExamScore =
    validScores.length > 0
      ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
      : null;

  const dates = activityDates
    .map((t) => t.createdAt)
    .filter((d): d is Date => d instanceof Date);
  if (user?.lastStudyAt instanceof Date) dates.push(user.lastStudyAt);

  const activeDays = new Set(dates.map((d) => d.toISOString().slice(0, 10))).size;

  return {
    level: xpProfile?.level ?? 1,
    totalXp: xpProfile?.totalXp ?? 0,
    xpToNextLevel: xpProfile?.xpToNextLevel ?? 100,
    progressPercent: xpProfile?.progressPercent ?? 0,
    rank,
    coins: user?.coins ?? 0,
    coursesEnrolled,
    coursesCompleted,
    lessonsCompleted,
    examsTaken,
    examsPassed,
    averageExamScore,
    certificatesCount,
    achievementsUnlocked,
    achievementsTotal: ACHIEVEMENT_DEFINITIONS.length,
    xpThisWeek: xpThisWeek._sum.amount ?? 0,
    activeDays,
    studyStreakDays: countConsecutiveDays(dates),
  };
}

export async function getPersonalStatsCharts(userId: string): Promise<PersonalStatsCharts> {
  const [xpTimeline, weeklyProgress, categoryDistribution, skillRadar, activityHeatmap, examScoreDistribution] = await Promise.all([
    fetchXpTimeline(userId),
    fetchWeeklyProgress(userId),
    fetchCategoryDistribution(userId),
    fetchSkillRadar(userId),
    fetchActivityHeatmap(userId),
    fetchExamScoreDistribution(userId),
  ]);

  // Estimate study time: 15 min per lesson + 30 min per exam
  const lessonsCompleted = await prisma.lessonProgress.count({ where: { userId, completed: true } });
  const examsTaken = await prisma.examAttempt.count({ where: { userId, finishedAt: { not: null } } });
  const studyTimeEstimate = lessonsCompleted * 15 + examsTaken * 30;

  return {
    xpTimeline,
    weeklyProgress,
    categoryDistribution,
    skillRadar,
    activityHeatmap,
    studyTimeEstimate,
    examScoreDistribution,
  };
}
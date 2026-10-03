import { prisma } from "@/lib/prisma";
import { getUserXpProfile, getXpHistory } from "@/services/xp.service";
import { getStudyContinuation } from "@/services/study-continuation.service";
import { getRecommendedCourses } from "@/services/recommendation.service";
import { getPersonalStats } from "@/services/personal-stats.service";
import { getUserAchievements } from "@/services/achievement.service";
import { shouldShowOnboardingTour } from "@/services/onboarding.service";
import { getDashboardHighlights } from "@/services/dashboard-goals.service";
import { getDashboardPendingItems } from "@/services/dashboard-pending.service";

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      bio: true,
      phone: true,
      city: true,
      state: true,
      profileVisibility: true,
      avatarUrl: true,
      bannerUrl: true,
    },
  });
}

export async function listUserEnrollments(userId: string) {
  return prisma.courseEnrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          level: true,
          category: { select: { name: true } },
        },
      },
    },
  });
}

/** Histórico de cursos do estudante, com matrícula, conclusão e progresso. */
export async function listUserCourseHistory(userId: string) {
  return prisma.courseEnrollment.findMany({
    where: { userId },
    orderBy: [{ completedAt: "desc" }, { enrolledAt: "desc" }],
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          level: true,
          category: { select: { name: true } },
          modules: { select: { _count: { select: { lessons: true } } } },
        },
      },
      lessonProgresses: {
        where: { completed: true },
        select: { id: true },
      },
    },
  });
}

export async function getStudentDashboard(userId: string) {
  const [xpProfile, enrollments, recentXp, examAttempts] = await Promise.all([
    getUserXpProfile(userId),
    listUserEnrollments(userId),
    getXpHistory(userId, 3),
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      take: 1,
      select: {
        score: true,
        finishedAt: true,
        exam: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const inProgress = enrollments.filter((e) => e.progress < 100).slice(0, 4);
  const completedCount = enrollments.filter((e) => e.progress >= 100).length;

  return {
    xpProfile,
    enrollments,
    inProgress,
    completedCount,
    recentXp,
    lastExam: examAttempts[0] ?? null,
  };
}

export async function getStudentHomeData(userId: string) {
  const [dashboard, continuation, recommendations, stats, achievements, showOnboardingTour, highlights, pendingItems] =
    await Promise.all([
      getStudentDashboard(userId),
      getStudyContinuation(userId),
      getRecommendedCourses(userId),
      getPersonalStats(userId),
      getUserAchievements(userId),
      shouldShowOnboardingTour(userId),
      getDashboardHighlights(userId),
      getDashboardPendingItems(userId),
    ]);

  return {
    ...dashboard,
    continuation,
    recommendations,
    stats,
    achievements,
    showOnboardingTour,
    highlights,
    pendingItems,
  };
}

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStudyContinuation } from "@/services/study-continuation.service";
import { getRecommendedCourses } from "@/services/recommendation.service";
import { listUserEnrollments } from "@/services/student.service";

type Enrollment = Awaited<ReturnType<typeof listUserEnrollments>>[number];

export type DailyPlanTask = {
  id: string;
  type: "lesson" | "exam" | "review" | "live" | "streak" | "social";
  title: string;
  description: string;
  href: string;
  icon: string;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  priority: "high" | "medium" | "low";
  completed: boolean;
  metadata?: Record<string, unknown>;
};

export type DailyPlan = {
  date: string;
  tasks: DailyPlanTask[];
  completedCount: number;
  totalCount: number;
  totalXpReward: number;
  totalCoinReward: number;
  streakBonus: number;
};

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function generateTaskId(type: string, referenceId: string): string {
  return `${type}-${referenceId}-${Date.now().toString(36)}`.slice(0, 50);
}

export async function getOrCreateDailyPlan(userId: string): Promise<DailyPlan> {
  const today = getTodayDateString();

  let plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: new Date(today) } },
  });

  if (!plan) {
    const tasks = await generateDailyTasks(userId);
    plan = await prisma.dailyPlan.create({
      data: {
        userId,
        date: new Date(today),
        tasks: tasks as unknown as Prisma.InputJsonValue,
        completedTasks: [],
      },
    });
  }

  const completedSet = new Set((plan.completedTasks as string[]) || []);
  const tasksWithCompletion = (plan.tasks as DailyPlanTask[]).map((task) => ({
    ...task,
    completed: completedSet.has(task.id),
  }));

  const completedTasks = tasksWithCompletion.filter((t) => t.completed);
  const totalXpReward = tasksWithCompletion.reduce((sum, t) => sum + t.xpReward, 0);
  const totalCoinReward = tasksWithCompletion.reduce((sum, t) => sum + t.coinReward, 0);

  return {
    date: plan.date.toISOString().slice(0, 10),
    tasks: tasksWithCompletion,
    completedCount: completedTasks.length,
    totalCount: tasksWithCompletion.length,
    totalXpReward,
    totalCoinReward,
    streakBonus: calculateStreakBonus(completedTasks.length),
  };
}

async function generateDailyTasks(userId: string): Promise<DailyPlanTask[]> {
  const tasks: DailyPlanTask[] = [];
  const [continuation, enrollments, recommendations] = await Promise.all([
    getStudyContinuation(userId),
    listUserEnrollments(userId),
    getRecommendedCourses(userId),
  ]);

  const inProgressCourses = enrollments.filter((e) => e.progress < 100 && e.progress > 0);

  // 1. Continuar aula atual (prioridade alta)
  if (continuation) {
    tasks.push({
      id: generateTaskId("continue", continuation.lessonTitle),
      type: "lesson",
      title: "Continuar estudando",
      description: `${continuation.courseTitle} — ${continuation.lessonTitle}`,
      href: continuation.href,
      icon: "BookOpen",
      estimatedMinutes: 15,
      xpReward: 50,
      coinReward: 10,
      priority: "high",
      completed: false,
      metadata: { courseSlug: continuation.courseTitle },
    });
  }

  // 2. Próxima aula do curso mais avançado
  if (inProgressCourses.length > 0) {
    const topCourse = inProgressCourses[0];
    const nextLesson = await getNextLessonForCourse(userId, topCourse.course.slug);
    if (nextLesson) {
      tasks.push({
        id: generateTaskId("next-lesson", nextLesson.id),
        type: "lesson",
        title: "Próxima aula",
        description: `${topCourse.course.title} — ${nextLesson.title}`,
        href: `/courses/${topCourse.course.slug}/learn/${nextLesson.id}`,
        icon: "Play",
        estimatedMinutes: 20,
        xpReward: 40,
        coinReward: 8,
        priority: "high",
        completed: false,
        metadata: { courseId: topCourse.course.id, lessonId: nextLesson.id },
      });
    }
  }

  // 3. Simulado do dia (se não fez hoje)
  const todayExam = await getTodaysExamSuggestion(userId);
  if (todayExam) {
    tasks.push({
      id: generateTaskId("exam", todayExam.exam.slug),
      type: "exam",
      title: "Simulado do dia",
      description: todayExam.exam.title,
      href: `/simulados/${todayExam.exam.slug}`,
      icon: "Target",
      estimatedMinutes: 30,
      xpReward: 100,
      coinReward: 25,
      priority: "medium",
      completed: false,
      metadata: { examId: todayExam.exam.id },
    });
  }

  // 4. Revisão espaçada (se tem cursos concluídos)
  const reviewTask = await generateReviewTask(userId, inProgressCourses);
  if (reviewTask) {
    tasks.push(reviewTask);
  }

  // 5. Aula ao vivo hoje/amanhã
  const liveTask = await getTodaysLiveSession(userId);
  if (liveTask) {
    tasks.push(liveTask);
  }

  // 6. Manter streak (se streak > 0)
  const streakTask = await generateStreakTask(userId);
  if (streakTask) {
    tasks.push(streakTask);
  }

  // 7. Curso recomendado (baixa prioridade)
  if (recommendations.length > 0 && tasks.length < 6) {
    const rec = recommendations[0];
    tasks.push({
      id: generateTaskId("recommend", rec.slug),
      type: "lesson",
      title: "Novo curso recomendado",
      description: rec.title,
      href: `/courses/${rec.slug}`,
      icon: "Sparkles",
      estimatedMinutes: 25,
      xpReward: 30,
      coinReward: 5,
      priority: "low",
      completed: false,
      metadata: { courseId: rec.id },
    });
  }

  // 8. Interação social (seguir alguém, comentar)
  if (tasks.length < 7) {
    tasks.push({
      id: generateTaskId("social", "daily"),
      type: "social",
      title: "Interagir na comunidade",
      description: "Comente em uma discussão ou siga um colega",
      href: "/social",
      icon: "Users",
      estimatedMinutes: 5,
      xpReward: 15,
      coinReward: 5,
      priority: "low",
      completed: false,
    });
  }

  // Limitar a 6 tarefas e ordenar por prioridade
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6);
}

async function getNextLessonForCourse(userId: string, courseSlug: string) {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { userId, course: { slug: courseSlug } },
    include: {
      course: {
        select: {
          modules: {
            orderBy: { orderNumber: "asc" },
            select: { lessons: { orderBy: { orderNumber: "asc" }, select: { id: true, title: true } } },
          },
        },
      },
      lessonProgresses: { where: { completed: true }, select: { lessonId: true } },
    },
  });

  if (!enrollment) return null;

  const completedIds = new Set(enrollment.lessonProgresses.map((p) => p.lessonId));
  const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
  return allLessons.find((l) => !completedIds.has(l.id)) ?? null;
}

async function getTodaysExamSuggestion(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentAttempt = await prisma.examAttempt.findFirst({
    where: {
      userId,
      finishedAt: { gte: today },
    },
    select: { examId: true },
  });

  if (recentAttempt) return null;

  const exam = await prisma.exam.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true },
  });

  return exam ? { exam } : null;
}

async function generateReviewTask(userId: string, inProgressCourses: Enrollment[]) {
  if (inProgressCourses.length === 0) return null;

  const completedCourse = await prisma.courseEnrollment.findFirst({
    where: { userId, progress: { gte: 100 } },
    orderBy: { completedAt: "desc" },
    include: { course: { select: { id: true, title: true, slug: true } } },
  });

  if (!completedCourse) return null;

  return {
    id: generateTaskId("review", completedCourse.course.id),
    type: "review" as const,
    title: "Revisão espaçada",
    description: `Revise conceitos de ${completedCourse.course.title}`,
    href: `/courses/${completedCourse.course.slug}`,
    icon: "RefreshCw",
    estimatedMinutes: 10,
    xpReward: 25,
    coinReward: 5,
    priority: "medium" as const,
    completed: false,
    metadata: { courseId: completedCourse.course.id },
  };
}

async function getTodaysLiveSession(_userId: string) {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const liveRoom = await prisma.liveRoom.findFirst({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: now, lte: todayEnd },
    },
    orderBy: { scheduledAt: "asc" },
    select: { id: true, title: true, scheduledAt: true, instructor: { select: { fullName: true } } },
  });

  if (!liveRoom) return null;

  return {
    id: generateTaskId("live", liveRoom.id),
    type: "live" as const,
    title: "Aula ao vivo hoje",
    description: `${liveRoom.title} com ${liveRoom.instructor.fullName}`,
    href: `/live-rooms/${liveRoom.id}`,
    icon: "Radio",
    estimatedMinutes: 60,
    xpReward: 80,
    coinReward: 20,
    priority: "high" as const,
    completed: false,
    metadata: { liveRoomId: liveRoom.id, scheduledAt: liveRoom.scheduledAt.toISOString() },
  };
}

async function generateStreakTask(userId: string) {
  const { getPersonalStats } = await import("@/services/personal-stats.service");
  const stats = await getPersonalStats(userId);

  if (stats.studyStreakDays === 0) return null;

  return {
    id: generateTaskId("streak", "maintain"),
    type: "streak" as const,
    title: `Manter sequência de ${stats.studyStreakDays} ${stats.studyStreakDays === 1 ? "dia" : "dias"}`,
    description: "Estude hoje para não quebrar a sequência",
    href: "/courses",
    icon: "Flame",
    estimatedMinutes: 10,
    xpReward: stats.studyStreakDays * 5,
    coinReward: Math.min(stats.studyStreakDays, 10),
    priority: "high" as const,
    completed: false,
    metadata: { streakDays: stats.studyStreakDays },
  };
}

function calculateStreakBonus(completedCount: number): number {
  if (completedCount >= 5) return 50;
  if (completedCount >= 3) return 25;
  return 0;
}

export async function completeDailyTask(userId: string, taskId: string): Promise<DailyPlan | null> {
  const today = getTodayDateString();

  const plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: new Date(today) } },
  });

  if (!plan) return null;

  const tasks = plan.tasks as DailyPlanTask[];
  const completedTasks = (plan.completedTasks as string[]) || [];

  if (completedTasks.includes(taskId)) return getOrCreateDailyPlan(userId);

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  await prisma.dailyPlan.update({
    where: { id: plan.id },
    data: { completedTasks: [...completedTasks, taskId] },
  });

  return getOrCreateDailyPlan(userId);
}

export async function getDailyPlanPreview(userId: string): Promise<DailyPlanTask[]> {
  const plan = await getOrCreateDailyPlan(userId);
  return plan.tasks;
}

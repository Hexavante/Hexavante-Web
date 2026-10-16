import { prisma } from "@/lib/prisma";
import { EXAM_PASS_SCORE } from "@/lib/gamification";

export async function recordStudyVisit(
  userId: string,
  courseSlug: string,
  lessonId: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastStudyCourseSlug: courseSlug,
      lastStudyLessonId: lessonId,
      lastStudyAt: new Date(),
    },
  });
}

export type StudyContinuation = {
  href: string;
  courseTitle: string;
  lessonTitle: string;
  progress: number;
  lastStudyAt: Date;
  type: "lesson" | "exam";
  examTitle?: string;
  examScore?: number;
};

export async function getStudyContinuation(userId: string): Promise<StudyContinuation | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastStudyCourseSlug: true,
      lastStudyLessonId: true,
      lastStudyAt: true,
    },
  });

  if (user?.lastStudyCourseSlug && user.lastStudyLessonId && user.lastStudyAt) {
    const course = await prisma.course.findFirst({
      where: { slug: user.lastStudyCourseSlug, status: "APPROVED" },
      select: {
        title: true,
        slug: true,
        modules: {
          orderBy: { orderNumber: "asc" },
          select: {
            lessons: {
              orderBy: { orderNumber: "asc" },
              select: { id: true, title: true },
            },
          },
        },
        enrollments: {
          where: { userId },
          take: 1,
          select: { progress: true },
        },
      },
    });

    const lesson = course?.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === user.lastStudyLessonId);

    const enrollment = course?.enrollments[0];

    if (course && lesson && enrollment && enrollment.progress < 100) {
      return {
        href: `/courses/${course.slug}/learn/${lesson.id}`,
        courseTitle: course.title,
        lessonTitle: lesson.title,
        progress: enrollment.progress,
        lastStudyAt: user.lastStudyAt,
        type: "lesson",
      };
    }
  }

  const inProgress = await prisma.courseEnrollment.findFirst({
    where: { userId, progress: { lt: 100 } },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          title: true,
          slug: true,
          modules: {
            orderBy: { orderNumber: "asc" },
            select: {
              lessons: { orderBy: { orderNumber: "asc" }, select: { id: true, title: true } },
            },
          },
        },
      },
      lessonProgresses: { where: { completed: true }, select: { lessonId: true } },
    },
  });

  if (inProgress) {
    const completedIds = new Set(inProgress.lessonProgresses.map((p) => p.lessonId));
    const allLessons = inProgress.course.modules.flatMap((m) => m.lessons);
    const nextLesson =
      allLessons.find((l) => !completedIds.has(l.id)) ?? allLessons[allLessons.length - 1];

    if (nextLesson) {
      return {
        href: `/courses/${inProgress.course.slug}/learn/${nextLesson.id}`,
        courseTitle: inProgress.course.title,
        lessonTitle: nextLesson.title,
        progress: inProgress.progress,
        lastStudyAt: inProgress.enrolledAt,
        type: "lesson",
      };
    }
  }

  const lastExam = await prisma.examAttempt.findFirst({
    where: { userId, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    select: {
      score: true,
      finishedAt: true,
      exam: { select: { title: true, slug: true } },
    },
  });

  if (lastExam?.finishedAt && lastExam.score < EXAM_PASS_SCORE) {
    return {
      href: `/simulados/${lastExam.exam.slug}`,
      courseTitle: lastExam.exam.title,
      lessonTitle: "Retomar simulado",
      progress: lastExam.score,
      lastStudyAt: lastExam.finishedAt,
      type: "exam",
      examTitle: lastExam.exam.title,
      examScore: lastExam.score,
    };
  }

  return null;
}

export async function getResumeLessonId(
  userId: string,
  courseSlug: string,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastStudyCourseSlug: true, lastStudyLessonId: true },
  });

  if (user?.lastStudyCourseSlug === courseSlug && user.lastStudyLessonId) {
    return user.lastStudyLessonId;
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userId,
      course: { slug: courseSlug },
    },
    include: {
      course: {
        select: {
          modules: {
            orderBy: { orderNumber: "asc" },
            select: {
              lessons: { orderBy: { orderNumber: "asc" }, select: { id: true } },
            },
          },
        },
      },
      lessonProgresses: { where: { completed: true }, select: { lessonId: true } },
    },
  });

  if (!enrollment) return null;

  const completedIds = new Set(enrollment.lessonProgresses.map((p) => p.lessonId));
  const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
  const next = allLessons.find((l) => !completedIds.has(l.id));
  return next?.id ?? allLessons[0]?.id ?? null;
}

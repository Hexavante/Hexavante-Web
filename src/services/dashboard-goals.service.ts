import { prisma } from "@/lib/prisma";

export type DashboardNextGoal = {
  courseTitle: string;
  courseSlug: string;
  progress: number;
  lessonsRemaining: number;
  label: string;
};

export type DashboardLastCertificate = {
  id: string;
  code: string;
  courseTitle: string;
  courseSlug: string;
  issuedAt: Date;
};

export type DashboardNextLiveEvent = {
  id: string;
  title: string;
  status: "LIVE" | "SCHEDULED";
  scheduledAt: Date;
  instructorName: string;
  courseTitle: string | null;
  href: string;
};

export type DashboardHighlights = {
  lastCertificate: DashboardLastCertificate | null;
  nextGoal: DashboardNextGoal | null;
  nextLiveEvent: DashboardNextLiveEvent | null;
};

export async function getDashboardHighlights(userId: string): Promise<DashboardHighlights> {
  const [lastCertificate, inProgressEnrollment, liveNow, nextScheduled] = await Promise.all([
    prisma.certificate.findFirst({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      include: {
        course: { select: { title: true, slug: true } },
      },
    }),
    prisma.courseEnrollment.findFirst({
      where: { userId, progress: { lt: 100, gt: 0 } },
      orderBy: { progress: "desc" },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
            modules: {
              select: {
                lessons: { select: { id: true } },
              },
            },
          },
        },
        lessonProgresses: {
          where: { completed: true },
          select: { lessonId: true },
        },
      },
    }),
    prisma.liveRoom.findFirst({
      where: { status: "LIVE" },
      orderBy: { scheduledAt: "asc" },
      include: {
        instructor: { select: { fullName: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.liveRoom.findFirst({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        instructor: { select: { fullName: true } },
        course: { select: { title: true } },
      },
    }),
  ]);

  let nextGoal: DashboardNextGoal | null = null;
  if (inProgressEnrollment) {
    const totalLessons = inProgressEnrollment.course.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0,
    );
    const completed = inProgressEnrollment.lessonProgresses.length;
    const lessonsRemaining = Math.max(0, totalLessons - completed);
    const progress = Math.round(inProgressEnrollment.progress);

    nextGoal = {
      courseTitle: inProgressEnrollment.course.title,
      courseSlug: inProgressEnrollment.course.slug,
      progress,
      lessonsRemaining,
      label:
        progress >= 80
          ? `Faltam ${100 - progress}% para o certificado`
          : lessonsRemaining > 0
            ? `${lessonsRemaining} aulas restantes`
            : "Quase lá — finalize o curso",
    };
  }

  const liveRoom = liveNow ?? nextScheduled;
  const nextLiveEvent: DashboardNextLiveEvent | null = liveRoom
    ? {
        id: liveRoom.id,
        title: liveRoom.title,
        status: liveRoom.status === "LIVE" ? "LIVE" : "SCHEDULED",
        scheduledAt: liveRoom.scheduledAt,
        instructorName: liveRoom.instructor.fullName,
        courseTitle: liveRoom.course?.title ?? null,
        href: `/live-rooms/${liveRoom.id}`,
      }
    : null;

  return {
    lastCertificate: lastCertificate
      ? {
          id: lastCertificate.id,
          code: lastCertificate.code,
          courseTitle: lastCertificate.course.title,
          courseSlug: lastCertificate.course.slug,
          issuedAt: lastCertificate.issuedAt,
        }
      : null,
    nextGoal,
    nextLiveEvent,
  };
}

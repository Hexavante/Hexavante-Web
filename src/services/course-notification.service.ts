import { prisma } from "@/lib/prisma";
import { createNotification } from "@/services/notification.service";

export async function notifyEnrolledUsersOfCourseUpdate(params: {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  updateLabel: string;
  excludeUserId?: string;
}) {
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { status: true },
  });

  if (!course || course.status !== "APPROVED") return;

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: params.courseId },
    select: { userId: true },
  });

  const recipients = enrollments
    .map((row) => row.userId)
    .filter((userId) => userId !== params.excludeUserId);

  if (recipients.length === 0) return;

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        type: "COURSE_UPDATED",
        title: "Curso atualizado",
        message: `${params.courseTitle}: ${params.updateLabel}`,
        link: `/courses/${params.courseSlug}/learn`,
      }),
    ),
  );
}

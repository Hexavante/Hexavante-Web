import type { CourseStatus } from "@prisma/client";

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  PENDING_REVIEW: "Pendente",
  APPROVED: "Publicado",
  REJECTED: "Rejeitado",
  REVISION_REQUIRED: "Em revisão",
};

export function isCoursePublished(status: CourseStatus): boolean {
  return status === "APPROVED";
}

import { prisma } from "@/lib/prisma";
import {
  notebookPageInput,
  type NotebookPageData,
  type NotebookData,
} from "@/lib/notebook";

const pageSelect = {
  id: true,
  courseId: true,
  title: true,
  content: true,
  version: true,
  updatedAt: true,
} as const;
export class NotebookError extends Error {}

export async function getNotebook(userId: string): Promise<NotebookData> {
  const [courses, pages] = await Promise.all([
    prisma.course.findMany({
      where: {
        OR: [
          { enrollments: { some: { userId } } },
          { notebookPages: { some: { userId } } },
        ],
      },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
    prisma.notebookPage.findMany({
      where: { userId },
      select: pageSelect,
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  return {
    courses,
    pages: pages.map((page) => ({
      ...page,
      updatedAt: page.updatedAt.toISOString(),
    })),
  };
}

export async function saveNotebookPage(
  userId: string,
  raw: unknown,
): Promise<NotebookPageData> {
  const parsed = notebookPageInput.safeParse(raw);
  if (!parsed.success) throw new NotebookError(parsed.error.issues[0].message);
  const input = parsed.data;
  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: input.courseId } },
      select: { id: true },
    });
    if (!enrollment)
      throw new NotebookError(
        "Você precisa estar matriculado neste curso para escrever no caderno.",
      );
    if (input.version === null) {
      await tx.notebookPage.create({
        data: {
          id: input.id,
          userId,
          courseId: input.courseId,
          title: input.title,
          content: input.content,
        },
        select: { id: true },
      });
    } else {
      const result = await tx.notebookPage.updateMany({
        where: {
          id: input.id,
          userId,
          courseId: input.courseId,
          version: input.version,
        },
        data: {
          title: input.title,
          content: input.content,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new NotebookError(
          "Esta página mudou em outra aba ou não está disponível. Copie seu texto e atualize o caderno antes de tentar novamente.",
        );
    }
    const page = await tx.notebookPage.findFirstOrThrow({
      where: { id: input.id, userId },
      select: pageSelect,
    });
    return { ...page, updatedAt: page.updatedAt.toISOString() };
  });
}

import { prisma } from "@/lib/prisma";
import {
  linksTo,
  normalizeTitle,
  notebookPageInput,
  renameLinks,
  type NotebookData,
  type NotebookPageData,
  type NotebookSaveData,
} from "@/lib/notebook";

const pageSelect = {
  id: true,
  courseId: true,
  title: true,
  content: true,
  version: true,
  updatedAt: true,
} as const;

type PageRow = {
  id: string;
  courseId: string | null;
  title: string;
  content: string;
  version: number;
  updatedAt: Date;
};

const toData = (page: PageRow): NotebookPageData => ({
  ...page,
  updatedAt: page.updatedAt.toISOString(),
});

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
  return { courses, pages: pages.map(toData) };
}

export async function saveNotebookPage(userId: string, raw: unknown): Promise<NotebookSaveData> {
  const parsed = notebookPageInput.safeParse(raw);
  if (!parsed.success) throw new NotebookError(parsed.error.issues[0].message);
  const input = parsed.data;

  return prisma.$transaction(async (tx) => {
    // Anotação livre (courseId null) não depende de matrícula.
    if (input.courseId !== null) {
      const enrollment = await tx.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId: input.courseId } },
        select: { id: true },
      });
      if (!enrollment)
        throw new NotebookError("Você precisa estar matriculado neste curso para escrever no caderno.");
    }

    let previousTitle: string | null = null;

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
      const current = await tx.notebookPage.findFirst({
        where: { id: input.id, userId },
        select: { title: true },
      });
      previousTitle = current?.title ?? null;

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

    const relinked: NotebookPageData[] = [];
    if (previousTitle !== null && normalizeTitle(previousTitle) !== normalizeTitle(input.title)) {
      relinked.push(...(await relinkAfterRename(tx, userId, input.id, previousTitle, input.title)));
    }

    const page = await tx.notebookPage.findFirstOrThrow({
      where: { id: input.id, userId },
      select: pageSelect,
    });
    return { page: toData(page), relinked };
  });
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Página renomeada: as outras notas do usuário que apontavam para o título
 * antigo passam a apontar para o novo. Se ainda existir OUTRA página com o
 * título antigo, os links continuam valendo para ela e nada muda.
 */
async function relinkAfterRename(
  tx: Tx,
  userId: string,
  pageId: string,
  oldTitle: string,
  newTitle: string,
): Promise<NotebookPageData[]> {
  const candidates = await tx.notebookPage.findMany({
    where: { userId, id: { not: pageId } },
    select: pageSelect,
  });

  const oldKey = normalizeTitle(oldTitle);
  if (candidates.some((p) => normalizeTitle(p.title) === oldKey)) return [];

  const updated: NotebookPageData[] = [];
  for (const page of candidates) {
    if (!linksTo(page.content, oldTitle)) continue;
    const row = await tx.notebookPage.update({
      where: { id: page.id },
      data: { content: renameLinks(page.content, oldTitle, newTitle), version: { increment: 1 } },
      select: pageSelect,
    });
    updated.push(toData(row));
  }
  return updated;
}

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InstructorExamEditInput } from "@/lib/instructor-exam-edit";

const include = {
  questions: {
    orderBy: { orderNumber: "asc" as const },
    include: {
      alternatives: { orderBy: { id: "asc" as const } },
      _count: { select: { favorites: true } },
    },
  },
  _count: { select: { attempts: true } },
};
export async function getInstructorExamForEdit(id: string, authorId: string) {
  return prisma.exam.findFirst({
    where: { id, submission: { authorId } },
    include,
  });
}
type EditableExam = NonNullable<
  Awaited<ReturnType<typeof getInstructorExamForEdit>>
>;
export function examEditRevision(exam: EditableExam) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        timeLimit: exam.timeLimit,
        coverImage: exam.coverImage,
        isPublished: exam.isPublished,
        questions: exam.questions.map(
          ({ _count: _ignored, ...question }) => question,
        ),
      }),
    )
    .digest("hex");
}
export function requiresExamRevision(exam: EditableExam) {
  return (
    exam.isPublished ||
    exam._count.attempts > 0 ||
    exam.questions.some((q) => q._count.favorites > 0)
  );
}

export async function saveInstructorExamEdit(
  id: string,
  authorId: string,
  revision: string,
  requestId: string,
  input: InstructorExamEditInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const exam = await tx.exam.findFirst({
        where: { id, submission: { authorId } },
        include,
      });
      if (!exam) throw new Error("Simulado não encontrado ou sem permissão.");
      const slug = "revisao-" + id + "-" + requestId;
      const previous = await tx.exam.findFirst({
        where: { slug, submission: { authorId } },
        select: { id: true },
      });
      if (previous) return { id: previous.id, newVersion: true };
      if (examEditRevision(exam) !== revision)
        throw new Error(
          "Este simulado mudou desde que você abriu a tela. Recarregue antes de editar novamente.",
        );
      const seen = new Set<string>();
      const questions = input.questions.map((item, index) => {
        const existing = item.id
          ? exam.questions.find((q) => q.id === item.id)
          : undefined;
        if (item.id && (!existing || seen.has(item.id)))
          throw new Error("Questão inválida para este simulado.");
        if (item.id) seen.add(item.id);
        const essay = existing?.type === "ESSAY";
        if (
          !essay &&
          (item.alternatives.length < 2 ||
            item.correct < 0 ||
            item.correct >= item.alternatives.length)
        )
          throw new Error(
            "Preencha as alternativas e selecione uma resposta correta em cada questão.",
          );
        return {
          statement: item.statement,
          orderNumber: index + 1,
          type: existing?.type ?? ("MULTIPLE_CHOICE" as const),
          points: existing?.points ?? 1,
          subject: existing?.subject,
          explanation: existing?.explanation,
          difficulty: existing?.difficulty ?? 2,
          imageUrl: existing?.imageUrl,
          imageWidth: existing?.imageWidth,
          imageHeight: existing?.imageHeight,
          imageDisplaySize: existing?.imageDisplaySize,
          expectedAnswer: essay
            ? item.expectedAnswer || null
            : existing?.expectedAnswer,
          alternatives: {
            create: essay
              ? []
              : item.alternatives.map((text, i) => ({
                  text,
                  isCorrect: i === item.correct,
                })),
          },
        };
      });
      const data = {
        title: input.title,
        examType: input.examType,
        description: input.description || null,
        timeLimit: input.timeLimit,
        isPublished: false,
      };
      if (requiresExamRevision(exam)) {
        const created = await tx.exam.create({
          data: {
            ...data,
            slug,
            coverImage: exam.coverImage,
            isPremiumOnly: exam.isPremiumOnly,
            submission: { create: { authorId } },
            questions: { create: questions },
          },
          select: { id: true },
        });
        return { id: created.id, newVersion: true };
      }
      await tx.exam.update({
        where: { id },
        data: {
          ...data,
          submission: { update: { submittedAt: new Date() } },
          questions: { deleteMany: {}, create: questions },
        },
      });
      return { id, newVersion: false };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

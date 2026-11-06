import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { EssayGradeInput } from "@/lib/validations/exam";

export async function listPendingEssayAnswers(instructorId?: string) {
  return prisma.examAnswer.findMany({
    where: {
      essayStatus: "PENDING",
      essayAnswer: { not: null },
      ...(instructorId
        ? { attempt: { exam: { submission: { authorId: instructorId } } } }
        : {}),
    },
    include: {
      attempt: {
        include: {
          user: { select: { id: true, fullName: true, username: true, email: true } },
          exam: { select: { id: true, title: true, slug: true } },
        },
      },
      question: {
        select: {
          id: true,
          statement: true,
          imageUrl: true,
          imageWidth: true,
          imageHeight: true,
          imageDisplaySize: true,
          orderNumber: true,
          expectedAnswer: true,
        },
      },
    },
    orderBy: { attempt: { finishedAt: "desc" } },
  });
}

export async function gradeEssayAnswer(
  data: EssayGradeInput,
  graderId: string,
  scope?: { instructorId: string },
) {
  const answer = await prisma.examAnswer.findUnique({
    where: { id: data.answerId },
    include: {
      attempt: {
        include: {
          answers: true,
          exam: {
            include: {
              questions: true,
              submission: { select: { authorId: true } },
            },
          },
        },
      },
    },
  });

  if (!answer || answer.essayStatus !== "PENDING") {
    throw new Error("Resposta dissertativa não encontrada ou já corrigida.");
  }
  if (scope && answer.attempt.exam.submission?.authorId !== scope.instructorId) {
    throw new Error("Sem permissão para corrigir respostas deste simulado.");
  }

  const isCorrect = data.status === "CORRECT";
  const isPartial = data.status === "PARTIAL";

  await prisma.examAnswer.update({
    where: { id: data.answerId },
    data: {
      essayStatus: data.status,
      essayComment: data.comment || null,
      isCorrect,
    },
  });

  const attempt = answer.attempt;
  const mcAnswers = attempt.answers.filter((item) => item.id !== answer.id && item.alternativeId);
  const gradedEssays = attempt.answers.filter(
    (item) => item.id !== answer.id && item.essayAnswer && item.essayStatus !== "PENDING",
  );

  const mcCorrect = mcAnswers.filter((item) => item.isCorrect).length;
  const essayCorrect = gradedEssays.filter((item) => item.isCorrect).length + (isCorrect ? 1 : 0);
  const essayPartial =
    gradedEssays.filter((item) => item.essayStatus === "PARTIAL").length + (isPartial ? 1 : 0);

  const mcTotal = attempt.exam.questions.filter((q) => q.type !== "ESSAY").length;
  const essayTotal = attempt.exam.questions.filter((q) => q.type === "ESSAY").length;
  const gradedMc = mcTotal;
  const gradedEssayCount = gradedEssays.length + 1;
  const pendingEssays = essayTotal - gradedEssayCount;

  const weightedCorrect = mcCorrect + essayCorrect + essayPartial * 0.5;
  const weightedTotal = gradedMc + gradedEssayCount;
  const provisionalScore =
    weightedTotal > 0 ? Math.round((weightedCorrect / weightedTotal) * 100) : attempt.score;

  if (pendingEssays === 0) {
    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        score: provisionalScore,
        correctAnswers: mcCorrect + essayCorrect,
      },
    });
  }

  logger.info("Dissertativa corrigida", {
    answerId: data.answerId,
    graderId,
    status: data.status,
    attemptId: attempt.id,
  });

  return { pendingEssays, provisionalScore };
}

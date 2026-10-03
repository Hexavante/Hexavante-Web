// Importações necessárias para o serviço de simulados
import type { Prisma } from "@prisma/client";
import { applyDailyRewardAmount } from "@/lib/exam-daily-rewards";
import { COIN_REWARDS, EXAM_PASS_SCORE } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { resolveNextDailyAttemptIndex } from "@/services/exam-daily-rewards.service";
import {
  countQuestionsForMode,
  filterQuestionsByIds,
  resolveAttemptQuestionIds,
} from "@/services/exam-learning.service";
import type { ExamStudyMode } from "@/lib/exam-learning";
import { canAccessPremiumExam } from "@/services/premium.service";
import { awardCoins } from "@/services/wallet.service";
import { awardXp, XP_REWARDS } from "@/services/xp.service";

export type ExamSearchParams = {
  examType?: string;
  q?: string;
  sort?: "recent" | "popular";
};

export async function searchPublishedExams(
  { examType, q, sort = "recent" }: ExamSearchParams = {},
  userId?: string,
) {
  let includePremiumOnly = false;
  if (userId) {
    const { isPremiumActive } = await import("@/lib/premium");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumExpiresAt: true },
    });
    includePremiumOnly = user ? isPremiumActive(user) : false;
  }
  const query = q?.trim();
  const type =
    examType === "ENEM" || examType === "VESTIBULAR" || examType === "TECNOLOGIA"
      ? examType
      : undefined;

  return prisma.exam.findMany({
    where: {
      isPublished: true,
      ...(!includePremiumOnly ? { isPremiumOnly: false } : {}),
      ...(type ? { examType: type } : {}),
      ...(query
        ? {
            OR: [{ title: { contains: query } }, { description: { contains: query } }],
          }
        : {}),
    },
    include: {
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: sort === "popular" ? { attempts: { _count: "desc" } } : { createdAt: "desc" },
  });
}

export async function getUserFinishedAttemptCounts(userId: string) {
  const rows = await prisma.examAttempt.groupBy({
    by: ["examId"],
    where: { userId, finishedAt: { not: null } },
    _count: { _all: true },
  });

  return Object.fromEntries(rows.map((row) => [row.examId, row._count._all]));
}

export async function getUserExamPerformance(userId: string, examId: string) {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId, examId, finishedAt: { not: null } },
    select: { id: true, score: true, finishedAt: true },
    orderBy: { finishedAt: "desc" },
  });

  if (attempts.length === 0) {
    return {
      attemptCount: 0,
      bestScore: 0,
      averageScore: 0,
      recentAttempts: [] as typeof attempts,
    };
  }

  const scores = attempts.map((a) => a.score);
  return {
    attemptCount: attempts.length,
    bestScore: Math.max(...scores),
    averageScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
    recentAttempts: attempts.slice(0, 5),
  };
}

// Função para obter simulado pelo slug
// Retorna simulado com questões, alternativas e contagem
export async function getExamBySlug(slug: string) {
  return prisma.exam.findUnique({
    where: { slug },
    include: {
      questions: {
        orderBy: { orderNumber: "asc" }, // Ordena questões por número
        include: { alternatives: { orderBy: { id: "asc" } } }, // Ordena alternativas por ID
      },
      _count: { select: { questions: true } }, // Conta questões
    },
  });
}

// Função para obter simulado para realização
// Retorna simulado publicado com questões e alternativas (sem indicar resposta correta)
export async function getExamForTaking(slug: string) {
  const exam = await prisma.exam.findUnique({
    where: { slug, isPublished: true },
    include: {
      questions: {
        orderBy: { orderNumber: "asc" },
        include: {
          alternatives: {
            select: { id: true, text: true }, // Não inclui isCorrect para não revelar resposta
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });
  return exam;
}

// Função para iniciar tentativa de simulado
// Cria nova tentativa se simulado estiver disponível
export async function startAttempt(
  userId: string,
  examId: string,
  mode: ExamStudyMode = "FULL",
) {
  return prisma.$transaction(async (tx) => {
    const active = await tx.examAttempt.findFirst({
      where: { userId, examId, finishedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (active) return active;

    const exam = await tx.exam.findFirst({
      where: { id: examId, isPublished: true },
      include: {
        questions: {
          select: { id: true, type: true, subject: true, difficulty: true },
          orderBy: { orderNumber: "asc" },
        },
      },
    });

    if (exam && !(await canAccessPremiumExam(userId, exam))) {
      throw new Error("Este simulado é exclusivo para assinantes Premium.");
    }

    if (!exam || exam.questions.length === 0) {
      throw new Error("Simulado não disponível.");
    }

    if (mode === "FAVORITES") {
      const favoriteCount = await countQuestionsForMode(
        userId,
        examId,
        "FAVORITES",
        exam.questions,
      );
      if (favoriteCount === 0) {
        throw new Error("Marque questões como favoritas antes de usar este modo.");
      }
    }

    const totalQuestions =
      mode === "FULL"
        ? exam.questions.length
        : await countQuestionsForMode(userId, examId, mode, exam.questions);

    if (totalQuestions === 0) {
      throw new Error("Não há questões disponíveis para este modo de estudo.");
    }

    return tx.examAttempt.create({
      data: {
        examId,
        userId,
        totalQuestions,
        studyMode: mode,
      },
    });
  });
}

// Função para obter tentativa ativa do usuário
// Retorna a tentativa mais recente que não foi finalizada
export async function getActiveAttempt(userId: string, examId: string) {
  return prisma.examAttempt.findFirst({
    where: {
      userId,
      examId,
      finishedAt: null, // Apenas tentativas não finalizadas
    },
    orderBy: { startedAt: "desc" }, // Mais recente primeiro
  });
}

// Função para submeter tentativa de simulado
// Corrige respostas, calcula pontuação e concede XP
export type SubmitAttemptPayload = {
  answers: Record<string, string>;
  essays: Record<string, string>;
};

export async function submitAttempt(
  userId: string,
  attemptId: string,
  payload: SubmitAttemptPayload,
  options?: { allowPartial?: boolean },
) {
  const { answers, essays } = payload;
  // Busca tentativa com simulado e questões
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            include: { alternatives: true },
          },
        },
      },
    },
  });

  // Verifica se tentativa existe e pertence ao usuário
  if (!attempt || attempt.userId !== userId) {
    throw new Error("Tentativa não encontrada.");
  }

  // Verifica se tentativa já foi finalizada
  if (attempt.finishedAt) {
    throw new Error("Este simulado já foi finalizado.");
  }

  if (attempt.exam.timeLimit) {
    const elapsedMs = Date.now() - attempt.startedAt.getTime();
    const limitMs = attempt.exam.timeLimit * 60 * 1000;
    if (elapsedMs > limitMs) {
      throw new Error("Tempo esgotado para este simulado.");
    }
  }

  const questionIds = await resolveAttemptQuestionIds(
    userId,
    attempt.examId,
    attempt.studyMode,
    attempt.exam.questions.map((q) => ({
      id: q.id,
      type: q.type,
      subject: q.subject,
      difficulty: q.difficulty,
    })),
  );

  const questions = filterQuestionsByIds(attempt.exam.questions, questionIds);
  const mcQuestions = questions.filter((q) => q.type !== "ESSAY");
  const essayQuestions = questions.filter((q) => q.type === "ESSAY");

  if (!options?.allowPartial) {
    for (const question of mcQuestions) {
      if (!answers[question.id]) {
        throw new Error("Responda todas as questões de múltipla escolha antes de enviar.");
      }
    }
    for (const question of essayQuestions) {
      const text = essays[question.id]?.trim();
      if (!text) {
        throw new Error("Responda todas as questões dissertativas antes de enviar.");
      }
    }
  }

  let correct = 0;
  const answerRecords: {
    questionId: string;
    alternativeId?: string;
    essayAnswer?: string;
    essayStatus?: "PENDING" | "CORRECT" | "PARTIAL" | "INCORRECT";
    isCorrect: boolean;
  }[] = [];

  for (const question of mcQuestions) {
    const selectedId = answers[question.id];
    if (!selectedId) {
      if (options?.allowPartial) continue;
      throw new Error("Responda todas as questões antes de enviar.");
    }

    const selected = question.alternatives.find((a) => a.id === selectedId);

    if (!selected) {
      throw new Error("Resposta inválida detectada.");
    }

    const isCorrect = selected.isCorrect;
    if (isCorrect) correct++;

    answerRecords.push({
      questionId: question.id,
      alternativeId: selected.id,
      isCorrect,
    });
  }

  for (const question of essayQuestions) {
    const essayText = essays[question.id]?.trim();
    if (!essayText) {
      if (options?.allowPartial) continue;
      throw new Error("Responda todas as questões dissertativas antes de enviar.");
    }

    answerRecords.push({
      questionId: question.id,
      essayAnswer: essayText.slice(0, 4000),
      essayStatus: "PENDING",
      isCorrect: false,
    });
  }

  const total = questions.length;
  const mcTotal = mcQuestions.length;
  const score = mcTotal > 0 ? Math.round((correct / mcTotal) * 100) : 0;

  const { dailyAttemptIndex, dailyRewardMultiplier } = await resolveNextDailyAttemptIndex(userId);
  const xpBaseAmount = applyDailyRewardAmount(XP_REWARDS.EXAM, dailyRewardMultiplier);
  const xpPassBonusAmount = applyDailyRewardAmount(
    XP_REWARDS.EXAM_PASS_BONUS,
    dailyRewardMultiplier,
  );
  const coinPerCorrectAmount = applyDailyRewardAmount(
    COIN_REWARDS.EXAM_CORRECT,
    dailyRewardMultiplier,
  );

  const submitResult = await prisma.$transaction(async (tx) => {
    const current = await tx.examAttempt.findUnique({
      where: { id: attemptId },
      select: { finishedAt: true, exam: { select: { title: true, slug: true } } },
    });

    if (!current || current.finishedAt) {
      throw new Error("Este simulado já foi finalizado.");
    }

    if (answerRecords.length > 0) {
      await tx.examAnswer.createMany({
        data: answerRecords.map((a) => ({
          attemptId,
          questionId: a.questionId,
          alternativeId: a.alternativeId ?? null,
          essayAnswer: a.essayAnswer ?? null,
          essayStatus: a.essayStatus ?? null,
          isCorrect: a.isCorrect,
        })),
      });
    }

    await tx.examAttempt.update({
      where: { id: attemptId },
      data: {
        correctAnswers: correct,
        score,
        finishedAt: new Date(),
        dailyAttemptIndex,
        dailyRewardMultiplier,
      },
    });

    return { examTitle: current.exam.title, examSlug: current.exam.slug };
  });

  let xpEarned = 0;
  let coinsEarned = 0;
  const examTitle = submitResult.examTitle;
  const examSlug = submitResult.examSlug;

  for (const record of answerRecords) {
    if (!record.isCorrect || !record.alternativeId) continue;
    const coinAward = await awardCoins(
      userId,
      coinPerCorrectAmount,
      "EXAM_CORRECT",
      `${attemptId}-q-${record.questionId}`,
      `Questão correta: ${examTitle}`,
    );
    if (coinAward) coinsEarned += coinAward.amount;
  }

  const baseAward = await awardXp(
    userId,
    xpBaseAmount,
    "EXAM",
    attemptId,
    `Simulado finalizado: ${examTitle}`,
  );
  if (baseAward) xpEarned += baseAward.amount;

  if (score >= EXAM_PASS_SCORE) {
    const passAward = await awardXp(
      userId,
      xpPassBonusAmount,
      "EXAM",
      `${attemptId}-pass`,
      `Aprovado no simulado: ${examTitle}`,
    );
    if (passAward) xpEarned += passAward.amount;

    try {
      const { recordSocialActivity } = await import("@/services/social.service");
      await recordSocialActivity(
        userId,
        "SIMULADO_PASSED",
        { simulado: examTitle, simuladoSlug: examSlug, score },
        `exam:${attemptId}`,
      );
    } catch {
      // feed opcional
    }
  }

  const { syncUserAchievements } = await import("@/services/achievement.service");
  const newAchievements = await syncUserAchievements(userId);

  return {
    attemptId,
    score,
    correct,
    total,
    mcTotal,
    pendingEssays: essayQuestions.length,
    xpEarned,
    coinsEarned,
    dailyAttemptIndex,
    dailyRewardMultiplier,
    newAchievements,
  };
}

// Função para obter resultado da tentativa
// Retorna tentativa com respostas detalhadas
export async function getAttemptResult(userId: string, attemptId: string) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      exam: {
        include: {
          questions: { orderBy: { orderNumber: "asc" } },
        },
      },
      answers: {
        include: {
          question: {
            include: {
              alternatives: { orderBy: { id: "asc" } },
            },
          },
          alternative: true,
        },
      },
    },
  });
}

export type AttemptHistoryParams = {
  examType?: string;
  page?: number;
  pageSize?: number;
};

export async function listUserAttemptsFiltered(
  userId: string,
  { examType, page = 1, pageSize = 10 }: AttemptHistoryParams,
) {
  const type =
    examType === "ENEM" || examType === "VESTIBULAR" || examType === "TECNOLOGIA"
      ? examType
      : undefined;

  const where: Prisma.ExamAttemptWhereInput = {
    userId,
    finishedAt: { not: null },
    ...(type ? { exam: { examType: type } } : {}),
  };

  const [attempts, total] = await Promise.all([
    prisma.examAttempt.findMany({
      where,
      include: { exam: true },
      orderBy: { finishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.examAttempt.count({ where }),
  ]);

  return { attempts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getUserExamEvolution(userId: string, limit = 10) {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId, finishedAt: { not: null } },
    select: { score: true, finishedAt: true, exam: { select: { title: true } } },
    orderBy: { finishedAt: "desc" },
    take: limit,
  });

  return attempts.reverse();
}

// Função para obter estatísticas do usuário
// Retorna total de tentativas, média e melhor pontuação
export async function getUserExamStats(userId: string) {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId, finishedAt: { not: null } },
    select: { score: true, correctAnswers: true, totalQuestions: true },
  });

  // Retorna zeros se não houver tentativas
  if (attempts.length === 0) {
    return { totalAttempts: 0, averageScore: 0, bestScore: 0 };
  }

  // Calcula média e melhor pontuação
  const scores = attempts.map((a) => a.score);
  const averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  const bestScore = Math.max(...scores);

  return { totalAttempts: attempts.length, averageScore, bestScore };
}

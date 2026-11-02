import { Prisma } from "@prisma/client";
import { selectLightningIds } from "@/lib/lightning-selection";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { isPrismaMissingTable } from "@/lib/prisma-errors";
import { awardXp } from "@/services/xp.service";
import { awardCoins } from "@/services/wallet.service";

// ---- Tipos ----

export type LightningQuestion = {
  id: string;
  statement: string;
  imageUrl: string | null;
  subject: string | null;
  difficulty: number;
  alternatives: { id: string; text: string }[];
};

export type LightningAnswer = {
  questionId: string;
  alternativeId: string;
};

export type LightningResult = {
  score: number; // acertos
  totalQuestions: number;
  timeUsedSeconds: number;
  xpAwarded: number;
  coinsAwarded: number;
  answers: {
    questionId: string;
    correct: boolean;
    correctAlternativeId: string;
  }[];
};

export type DailyStatus = {
  played: boolean;
  attempt: {
    score: number;
    totalQuestions: number;
    xpAwarded: number;
    coinsAwarded: number;
    completedAt: Date;
  } | null;
  migrationPending?: boolean;
};

export type LightningHistoryEntry = {
  id: string;
  challengeDate: Date;
  score: number;
  totalQuestions: number;
  timeUsedSeconds: number;
  xpAwarded: number;
  coinsAwarded: number;
  completedAt: Date;
};

// ---- Constantes ----

export const LIGHTNING_QUESTION_COUNT = 5;
export const LIGHTNING_TIME_LIMIT_SECONDS = 60;
export const LIGHTNING_XP_PER_CORRECT = 15;
export const LIGHTNING_COINS_PER_CORRECT = 3;
export const LIGHTNING_BONUS_XP_ALL_CORRECT = 30; // bônus por acertar tudo

// ---- Helpers internos ----

/**
 * Retorna a data do desafio diário em UTC-3 (Brasil),
 * truncada para o início do dia (hora zero).
 *
 * Exemplo: 2026-10-10T22:00:00Z → 2026-10-10T00:00:00.000Z (como Date representando o dia BR)
 */
function getChallengeDate(): Date {
  // Instante atual ajustado para UTC-3
  const nowBR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  // Truncar para dia: manter só YYYY-MM-DD, zerar horas
  const dateStr = nowBR.toISOString().slice(0, 10); // "2026-10-10"
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Formata Date como string YYYY-MM-DD para uso em sourceId.
 */
function formatDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---- Funções públicas ----

/**
 * Verifica se o usuário já jogou o Desafio Relâmpago hoje.
 * Retorna o status com dados da tentativa, se houver.
 */
export async function getLightningDailyStatus(userId: string): Promise<DailyStatus> {
  try {
    const today = getChallengeDate();

    const attempt = await prisma.lightningChallengeAttempt.findUnique({
      where: {
        userId_challengeDate: {
          userId,
          challengeDate: today,
        },
      },
      select: {
        score: true,
        totalQuestions: true,
        xpAwarded: true,
        coinsAwarded: true,
        completedAt: true,
      },
    });

    if (!attempt) {
      return { played: false, attempt: null };
    }

    return {
      played: true,
      attempt: {
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        xpAwarded: attempt.xpAwarded,
        coinsAwarded: attempt.coinsAwarded,
        completedAt: attempt.completedAt,
      },
    };
  } catch (error) {
    if (isPrismaMissingTable(error)) {
      logger.error("LIGHTNING_TABLE_MISSING", error instanceof Error ? error : undefined, {
        userId,
      });
      return { played: false, attempt: null, migrationPending: true };
    }
    throw error;
  }
}

/**
 * Busca LIGHTNING_QUESTION_COUNT questões aleatórias de múltipla escolha
 * de simulados publicados. Retorna sem o campo isCorrect nas alternativas
 * (gabarito não é exposto ao cliente).
 */
export async function getLightningQuestions(userId?: string): Promise<LightningQuestion[]> {
  try {
    // Conta o total de questões elegíveis para montar o offset aleatório
    const total = await prisma.examQuestion.count({
      where: {
        type: "MULTIPLE_CHOICE",
        exam: { isPublished: true },
        alternatives: { some: { isCorrect: true } }, // garante que há gabarito
      },
    });

    if (total < LIGHTNING_QUESTION_COUNT) {
      logger.warn("Questões insuficientes para o Desafio Relâmpago", {
        total,
        required: LIGHTNING_QUESTION_COUNT,
      });
      return [];
    }

    const mistakes = userId ? await prisma.examAnswer.findMany({
      where: { isCorrect: false, alternativeId: { not: null }, attempt: { userId, finishedAt: { not: null } }, question: { type: "MULTIPLE_CHOICE" } },
      select: { questionId: true, question: { select: { subject: true } } },
      orderBy: { attempt: { finishedAt: "desc" } },
      take: 500,
    }) : [];
    const candidates = await prisma.examQuestion.findMany({
      where: { type: "MULTIPLE_CHOICE", exam: { isPublished: true }, alternatives: { some: { isCorrect: true } } },
      select: { id: true, subject: true },
    });
    const selectedIds = selectLightningIds(candidates, mistakes, LIGHTNING_QUESTION_COUNT);

    const rows = await prisma.examQuestion.findMany({
      where: {
        id: { in: selectedIds },
        type: "MULTIPLE_CHOICE",
        exam: { isPublished: true },
        alternatives: { some: { isCorrect: true } },
      },
      select: {
        id: true,
        statement: true,
        imageUrl: true,
        subject: true,
        difficulty: true,
        alternatives: {
          select: {
            id: true,
            text: true,
            // isCorrect não é selecionado — gabarito fica no servidor
          },
        },
      },
    });

    return selectedIds.flatMap((id) => rows.filter((row) => row.id === id));
  } catch (error) {
    if (isPrismaMissingTable(error)) {
      logger.error("LIGHTNING_TABLE_MISSING", error instanceof Error ? error : undefined);
      return [];
    }
    throw error;
  }
}

/**
 * Recebe as respostas do usuário, verifica o gabarito, grava a tentativa
 * e concede XP + moedas. Retorna null se o usuário já jogou hoje.
 *
 * O campo @@unique([userId, challengeDate]) no DB impede gravação dupla;
 * o catch de P2002 trata corridas concorrentes (ex.: clique duplo).
 */
export async function submitLightningChallenge(
  userId: string,
  answers: LightningAnswer[],
  timeUsedSeconds: number,
): Promise<LightningResult | null> {
  const today = getChallengeDate();
  const dateStr = formatDateStr(today);

  // --- Proteção idempotente: verificar antes de processar ---
  const alreadyPlayed = await prisma.lightningChallengeAttempt.findUnique({
    where: {
      userId_challengeDate: { userId, challengeDate: today },
    },
    select: { id: true },
  });

  if (alreadyPlayed) {
    return null;
  }

  // --- Buscar gabaritos das questões respondidas ---
  const questionIds = answers.map((a) => a.questionId);

  const questions = await prisma.examQuestion.findMany({
    where: {
      id: { in: questionIds },
      type: "MULTIPLE_CHOICE",
      exam: { isPublished: true },
    },
    select: {
      id: true,
      alternatives: {
        select: {
          id: true,
          isCorrect: true,
        },
      },
    },
  });

  // Mapa: questionId → alternativeId correta
  const correctMap = new Map<string, string>();
  for (const q of questions) {
    const correct = q.alternatives.find((alt) => alt.isCorrect);
    if (correct) {
      correctMap.set(q.id, correct.id);
    }
  }

  // --- Calcular resultado ---
  const answerResults = answers.map((a) => {
    const correctAlternativeId = correctMap.get(a.questionId) ?? "";
    const correct = correctAlternativeId !== "" && a.alternativeId === correctAlternativeId;
    return { questionId: a.questionId, correct, correctAlternativeId };
  });

  const score = answerResults.filter((r) => r.correct).length;
  const totalQuestions = answers.length;
  const allCorrect = score === totalQuestions && totalQuestions > 0;

  const baseXp =
    score * LIGHTNING_XP_PER_CORRECT + (allCorrect ? LIGHTNING_BONUS_XP_ALL_CORRECT : 0);
  const baseCoins = score * LIGHTNING_COINS_PER_CORRECT;

  // --- Gravar tentativa (único ponto de escrita, protegido por unique) ---
  let xpAwarded = 0;
  let coinsAwarded = 0;

  try {
    await prisma.lightningChallengeAttempt.create({
      data: {
        userId,
        challengeDate: today,
        score,
        totalQuestions,
        timeUsedSeconds,
        xpAwarded: baseXp,   // valor base; ajuste pós-booster se necessário
        coinsAwarded: baseCoins,
      },
    });
    xpAwarded = baseXp;
    coinsAwarded = baseCoins;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Corrida concorrente: outro request já gravou a tentativa
      return null;
    }
    logger.error("Erro ao gravar LightningChallengeAttempt", err instanceof Error ? err : undefined, {
      userId,
      dateStr,
    });
    throw err;
  }

  // --- Conceder XP e moedas (operações idempotentes pelo sourceId único) ---
  const sourceId = `lightning-challenge-${dateStr}`;

  if (baseXp > 0) {
    try {
      const awarded = await awardXp(userId, baseXp, "ADMIN", sourceId, "Desafio Relâmpago");
      // awardXp aplica booster; atualizar xpAwarded com o valor real se disponível
      if (awarded) {
        xpAwarded = awarded.amount;
        // Atualizar registro com xp real (booster pode ter multiplicado)
        await prisma.lightningChallengeAttempt.update({
          where: { userId_challengeDate: { userId, challengeDate: today } },
          data: { xpAwarded },
        });
      }
    } catch (err) {
      logger.error("Erro ao conceder XP do Desafio Relâmpago", err instanceof Error ? err : undefined, {
        userId,
        sourceId,
      });
    }
  }

  if (baseCoins > 0) {
    try {
      const awarded = await awardCoins(userId, baseCoins, "ADMIN", sourceId, "Desafio Relâmpago");
      if (awarded) {
        coinsAwarded = awarded.amount;
        // Atualizar registro com moedas reais (booster pode ter multiplicado)
        await prisma.lightningChallengeAttempt.update({
          where: { userId_challengeDate: { userId, challengeDate: today } },
          data: { coinsAwarded },
        });
      }
    } catch (err) {
      logger.error("Erro ao conceder moedas do Desafio Relâmpago", err instanceof Error ? err : undefined, {
        userId,
        sourceId,
      });
    }
  }

  return {
    score,
    totalQuestions,
    timeUsedSeconds,
    xpAwarded,
    coinsAwarded,
    answers: answerResults,
  };
}

/**
 * Lista as tentativas do Desafio Relâmpago do usuário, mais recentes primeiro.
 * Somente leitura — não concede XP/moedas nem altera regras de recompensa.
 */
export async function listLightningHistory(
  userId: string,
  limit = 10,
): Promise<LightningHistoryEntry[]> {
  try {
    return await prisma.lightningChallengeAttempt.findMany({
      where: { userId },
      orderBy: { challengeDate: "desc" },
      take: limit,
      select: {
        id: true,
        challengeDate: true,
        score: true,
        totalQuestions: true,
        timeUsedSeconds: true,
        xpAwarded: true,
        coinsAwarded: true,
        completedAt: true,
      },
    });
  } catch (error) {
    if (isPrismaMissingTable(error)) {
      logger.error("LIGHTNING_TABLE_MISSING", error instanceof Error ? error : undefined, {
        userId,
      });
      return [];
    }
    throw error;
  }
}

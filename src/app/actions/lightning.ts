"use server";

import { auth } from "@/auth";
import {
  getLightningDailyStatus,
  getLightningQuestions,
  submitLightningChallenge,
  type LightningAnswer,
  type LightningQuestion,
  type LightningResult,
} from "@/services/lightning-challenge.service";
import { syncUserAchievements } from "@/services/achievement.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isPrismaMissingTable } from "@/lib/prisma-errors";
import { logger } from "@/lib/logger";

export type LightningLoadResult = {
  questions: LightningQuestion[];
  played: boolean;
  migrationPending?: boolean;
};

export type LightningSubmitResult = {
  success: boolean;
  played?: boolean;
  error?: string;
  result?: LightningResult;
  /** Chaves de conquistas recém-desbloqueadas. O cliente dispara o toast global. */
  newAchievementKeys?: string[];
};

/**
 * Carrega o estado diário + questões do Desafio Relâmpago.
 * Exige login (redireciona para /login). Não expõe gabarito:
 * as questões vêm do service já sem `isCorrect`.
 */
export async function getLightningQuestionsAction(): Promise<LightningLoadResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/desafio-relampago");
  }

  try {
    const status = await getLightningDailyStatus(session.user.id);
    if (status.played) {
      return { questions: [], played: true };
    }
    if (status.migrationPending) {
      return { questions: [], played: false, migrationPending: true };
    }

    let questions: LightningQuestion[];
    try {
      questions = await getLightningQuestions();
    } catch (error) {
      if (isPrismaMissingTable(error)) {
        logger.error("LIGHTNING_TABLE_MISSING");
        return { questions: [], played: false, migrationPending: true };
      }
      throw error;
    }

    return { questions, played: false };
  } catch (error) {
    if (isPrismaMissingTable(error)) {
      logger.error("LIGHTNING_TABLE_MISSING", error instanceof Error ? error : undefined);
      return { questions: [], played: false, migrationPending: true };
    }
    throw error;
  }
}

/**
 * Envia as respostas do Desafio Relâmpago.
 * A proteção contra repetição vive no service (unique [userId, challengeDate]
 * + guard P2002 + sourceId idempotente em xp/coinTransaction): se o service
 * retornar null, o usuário já jogou — retornamos `played: true` sem erro.
 */
export async function submitLightningAction(
  answers: LightningAnswer[],
  timeUsedSeconds: number,
): Promise<LightningSubmitResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  const safeTime = Math.max(0, Math.min(Math.floor(timeUsedSeconds) || 0, 3600));
  if (!Array.isArray(answers) || answers.length === 0) {
    return { success: false, error: "Responda ao menos uma questão." };
  }

  let result: LightningResult | null;
  try {
    result = await submitLightningChallenge(session.user.id, answers, safeTime);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao enviar o desafio.",
    };
  }

  if (!result) {
    revalidatePath("/desafio-relampago");
    revalidatePath("/app");
    return { success: true, played: true };
  }

  // Sincroniza conquistas após a tentativa — falha silenciosa para não
  // bloquear o fluxo principal (mesmo padrão de enrollment.ts / exam.ts).
  let newAchievementKeys: string[] = [];
  try {
    newAchievementKeys = await syncUserAchievements(session.user.id);
  } catch {
    // Conquistas virão na próxima sincronização.
  }

  revalidatePath("/desafio-relampago");
  revalidatePath("/app");
  revalidatePath("/perfil");
  revalidatePath("/ranking");

  return { success: true, result, newAchievementKeys };
}

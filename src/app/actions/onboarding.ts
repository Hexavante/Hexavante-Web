"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaUniqueViolation } from "@/lib/prisma-errors";
import {
  TUTORIAL_REWARD_AMOUNT,
  TUTORIAL_REWARD_DESCRIPTION,
  TUTORIAL_REWARD_SOURCE_ID,
} from "@/lib/tutorial-reward";

export type OnboardingActionResult = { success: boolean; error?: string };

export type ClaimTutorialRewardResult = {
  success: boolean;
  error?: string;
  /** Recompensa já resgatada antes (unique userId+source+sourceId). */
  alreadyClaimed?: boolean;
  amount?: number;
};

export async function completeOnboardingTourAction(): Promise<OnboardingActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompletedAt: new Date() },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * Resgata as 100 moedas por ter assistido o tutorial em vídeo até o fim.
 *
 * Idempotente: a transação cria o CoinTransaction (unique
 * [userId, source, sourceId]) e só então incrementa `user.coins`. Se o registro
 * já existe, o banco aborta com P2002, a transação inteira é desfeita (nenhum
 * incremento) e devolvemos `alreadyClaimed: true`. Nunca lança exceção.
 */
export async function claimTutorialVideoRewardAction(): Promise<ClaimTutorialRewardResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.coinTransaction.create({
        data: {
          userId,
          amount: TUTORIAL_REWARD_AMOUNT,
          type: "EARN",
          source: "TUTORIAL_REWARD",
          sourceId: TUTORIAL_REWARD_SOURCE_ID,
          description: TUTORIAL_REWARD_DESCRIPTION,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: TUTORIAL_REWARD_AMOUNT } },
      });
    });

    revalidatePath("/");
    return { success: true, amount: TUTORIAL_REWARD_AMOUNT };
  } catch (err) {
    // Violação do unique: já resgatada — transação desfeita, sem novo incremento.
    if (isPrismaUniqueViolation(err)) {
      return { success: true, alreadyClaimed: true, amount: TUTORIAL_REWARD_AMOUNT };
    }
    return { success: false, error: "Não foi possível resgatar a recompensa." };
  }
}

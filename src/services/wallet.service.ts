import { COIN_SOURCE_LABELS } from "@/lib/gamification";
import { logger } from "@/lib/logger";
import { isPrismaUniqueViolation } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { getTotalRewardMultiplier } from "@/services/booster.service";
import { createNotification } from "@/services/notification.service";
import type { CoinSource, CoinTransactionType } from "@prisma/client";

export type CoinAward = {
  amount: number;
  description: string;
  multiplier: number;
};

export type UserCoinProfile = {
  coins: number;
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  coinMultiplier: number;
  activeBooster: boolean;
  boosterMultiplier: number;
  boosterExpiresAt: Date | null;
};

async function syncWalletCoins(userId: string, coins: number) {
  await prisma.userWallet.upsert({
    where: { userId },
    create: { userId, coins },
    update: { coins },
  });
}

export async function getUserCoinProfile(userId: string): Promise<UserCoinProfile> {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      coins: true,
      isPremium: true,
      premiumExpiresAt: true,
      wallet: { select: { coins: true } },
    },
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (user.coins === 0 && user.wallet && user.wallet.coins > 0) {
    user = await prisma.user.update({
      where: { id: userId },
      data: { coins: user.wallet.coins },
      select: {
        coins: true,
        isPremium: true,
        premiumExpiresAt: true,
        wallet: { select: { coins: true } },
      },
    });
  }

  const rewards = await getTotalRewardMultiplier(userId);

  return {
    coins: user.coins,
    isPremium: rewards.premium > 1,
    premiumExpiresAt: user.premiumExpiresAt,
    coinMultiplier: rewards.total,
    activeBooster: rewards.booster > 1,
    boosterMultiplier: rewards.booster,
    boosterExpiresAt: rewards.boosterExpiresAt,
  };
}

export async function getUserWallet(userId: string) {
  const profile = await getUserCoinProfile(userId);
  return { coins: profile.coins };
}

export async function getCoinMultiplier(userId: string): Promise<number> {
  const rewards = await getTotalRewardMultiplier(userId);
  return rewards.total;
}

export async function awardCoins(
  userId: string,
  baseAmount: number,
  source: CoinSource,
  sourceId: string,
  description?: string,
): Promise<CoinAward | null> {
  if (baseAmount <= 0) return null;

  const rewards = await getTotalRewardMultiplier(userId);
  const multiplier = rewards.total;
  const amount = Math.round(baseAmount * multiplier);
  const label = description ?? COIN_SOURCE_LABELS[source] ?? "Moedas ganhas";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.coinTransaction.findUnique({
        where: {
          userId_source_sourceId: { userId, source, sourceId },
        },
      });
      if (existing) return null;

      const user = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: amount } },
        select: { coins: true },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount,
          type: "EARN" satisfies CoinTransactionType,
          source,
          sourceId,
          description: multiplier > 1 ? `${label} (x${multiplier})` : label,
        },
      });

      return { amount, description: label, multiplier, balance: user.coins };
    });

    if (result) {
      await syncWalletCoins(userId, result.balance);
      try {
        await createNotification({
          userId,
          type: "COIN_EARNED",
          title: "Moedas ganhas",
          message: `+${result.amount} moedas — ${result.description}`,
          link: "/shop",
        });
      } catch (err) {
        logger.warn("Falha ao notificar moedas", { userId, err });
      }
    }

    return result;
  } catch (err) {
    if (isPrismaUniqueViolation(err)) return null;
    throw err;
  }
}

export async function spendCoins(
  userId: string,
  amount: number,
  source: CoinSource,
  sourceId: string,
  description?: string,
): Promise<boolean> {
  if (amount <= 0) return false;

  const label = description ?? COIN_SOURCE_LABELS[source] ?? "Gasto de moedas";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.coinTransaction.findUnique({
        where: {
          userId_source_sourceId: { userId, source, sourceId },
        },
      });
      if (existing) return null;

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coins: true },
      });
      if (!user || user.coins < amount) {
        throw new Error("Moedas insuficientes.");
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: amount } },
        select: { coins: true },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: "SPEND",
          source,
          sourceId,
          description: label,
        },
      });

      return updated.coins;
    });
    if (result === null) return true;
    await syncWalletCoins(userId, result);
    return true;
  } catch (err) {
    if (err instanceof Error && err.message === "Moedas insuficientes.") {
      return false;
    }
    if (isPrismaUniqueViolation(err)) return true;
    throw err;
  }
}

export async function getCoinHistory(userId: string, limit = 20) {
  return prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getCoinsForSource(userId: string, source: CoinSource, sourceId: string) {
  return prisma.coinTransaction.findUnique({
    where: {
      userId_source_sourceId: { userId, source, sourceId },
    },
  });
}

export async function sumCoinsForSources(userId: string, source: CoinSource, sourceIds: string[]) {
  if (sourceIds.length === 0) return 0;
  const result = await prisma.coinTransaction.aggregate({
    where: { userId, source, sourceId: { in: sourceIds } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

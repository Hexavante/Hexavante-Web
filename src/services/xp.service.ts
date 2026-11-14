import {
  XP_REWARDS,
  xpProgressPercent,
  xpRequiredForLevel,
} from "@/lib/gamification";
import { internalApiPost } from "@/lib/internal-api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { XpSource } from "@prisma/client";

// Tipo para prêmio de XP
export type XpAward = {
  amount: number; // Quantidade de XP ganho
  description: string; // Descrição do ganho
  leveledUp: boolean; // Se subiu de nível
  newLevel?: number; // Novo nível (se subiu)
};

// Tipo para perfil de XP do usuário
export type UserXpProfile = {
  level: number; // Nível atual
  currentXp: number; // XP atual no nível
  totalXp: number; // XP total acumulado
  xpToNextLevel: number; // XP necessário para próximo nível
  progressPercent: number; // Porcentagem de progresso para próximo nível
};

// Função para obter perfil de XP do usuário
// Retorna perfil completo com nível, XP e progresso
export async function getUserXpProfile(userId: string): Promise<UserXpProfile | null> {
  const xp = await prisma.userXP.findUnique({ where: { userId } });
  if (!xp) return null;

  return {
    level: xp.level,
    currentXp: xp.currentXp,
    totalXp: xp.totalXp,
    xpToNextLevel: xpRequiredForLevel(xp.level),
    progressPercent: xpProgressPercent(xp.level, xp.currentXp),
  };
}

/**
 * Concede XP ao usuário.
 *
 * A regra (booster pessoal × global, nível, idempotência por sourceId,
 * notificação de nível e feed social) vive na API — motor único usado também
 * pelo Desktop e pelo Mobile. `amount` é o valor BASE.
 *
 * Mesmo contrato de antes: `null` quando a recompensa daquela fonte já foi
 * dada ou quando algo falha (o erro é registrado, o fluxo do usuário segue).
 */
export async function awardXp(
  userId: string,
  amount: number,
  source: XpSource,
  sourceId: string,
  description?: string,
): Promise<XpAward | null> {
  if (amount <= 0) return null;

  try {
    const { award } = await internalApiPost<{ award: XpAward | null }>(
      "/internal/v1/gamification/xp",
      { userId, amount, source, sourceId, description },
    );
    return award;
  } catch (error) {
    logger.error("Erro ao conceder XP", error instanceof Error ? error : undefined, {
      userId,
      source,
      sourceId,
    });
    return null;
  }
}

// Função para obter histórico de XP
// Retorna transações de XP mais recentes
export async function getXpHistory(userId: string, limit = 20) {
  return prisma.xpTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }, // Mais recentes primeiro
    take: limit,
  });
}

// Função para obter XP de uma fonte específica
// Retorna transação de XP para uma fonte específica
export async function getXpForSource(userId: string, source: XpSource, sourceId: string) {
  return prisma.xpTransaction.findUnique({
    where: {
      userId_source_sourceId: { userId, source, sourceId },
    },
  });
}

export type RankingPeriod = "week" | "month" | "all";

export type RankingEntry = {
  id: string;
  userId: string;
  level: number;
  league?: import("@prisma/client").RankingLeague;
  periodXp: number;
  totalXp: number;
  badgeLabel?: string | null;
  frameId?: string | null;
  borderId?: string | null;
  user: {
    id: string;
    username: string | null;
    fullName: string;
    avatarUrl: string | null;
  };
};

function getPeriodStart(period: Exclude<RankingPeriod, "all">): Date {
  const now = new Date();
  if (period === "week") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Função para obter ranking
// Retorna usuários ordenados por XP total ou por período
export async function getRanking(
  limit = 50,
  period: RankingPeriod = "all",
): Promise<RankingEntry[]> {
  if (period === "all") {
    const rows = await prisma.userXP.findMany({
      orderBy: [{ totalXp: "desc" }, { level: "desc" }],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      level: row.level,
      league: row.league,
      periodXp: row.totalXp,
      totalXp: row.totalXp,
      user: row.user,
    }));
  }

  const start = getPeriodStart(period);
  const grouped = await prisma.xpTransaction.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: start } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const userIds = grouped.map((row) => row.userId);
  const profiles = await prisma.userXP.findMany({
    where: { userId: { in: userIds } },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });

  const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));

  const entries: RankingEntry[] = [];

  for (const row of grouped) {
    const profile = profileByUser.get(row.userId);
    if (!profile) continue;
    entries.push({
      id: profile.id,
      userId: profile.userId,
      level: profile.level,
      league: profile.league,
      periodXp: row._sum.amount ?? 0,
      totalXp: profile.totalXp,
      user: profile.user,
    });
  }

  const rankUserIds = entries.map((e) => e.userId);
  if (rankUserIds.length > 0) {
    const now = new Date();

    const badges = await prisma.userInventory.findMany({
      where: {
        userId: { in: rankUserIds },
        storeItem: { category: "BADGE", isActive: true },
        isEquipped: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { userId: true, storeItem: { select: { name: true } } },
    });
    const badgeMap = new Map(badges.map((b) => [b.userId, b.storeItem.name]));

    const frames = await prisma.userInventory.findMany({
      where: {
        userId: { in: rankUserIds },
        storeItem: { category: "FRAME", isActive: true },
        isEquipped: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { userId: true, storeItem: { select: { metadata: true } } },
    });
    const frameMap = new Map(frames.map((f) => [f.userId, f.storeItem.metadata as Record<string, unknown> | null]));

    const borders = await prisma.userInventory.findMany({
      where: {
        userId: { in: rankUserIds },
        storeItem: { category: "AVATAR_BORDER", isActive: true },
        isEquipped: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { userId: true, storeItem: { select: { metadata: true } } },
    });
    const borderMap = new Map(borders.map((b) => [b.userId, b.storeItem.metadata as Record<string, unknown> | null]));

    for (const entry of entries) {
      entry.badgeLabel = badgeMap.get(entry.userId) ?? null;
      const frameMeta = frameMap.get(entry.userId);
      entry.frameId = (frameMeta?.frameId as string) ?? null;
      const borderMeta = borderMap.get(entry.userId);
      entry.borderId = (borderMeta?.borderId as string) ?? null;
    }
  }

  return entries;
}

// Função para obter posição do usuário no ranking
// Retorna posição do usuário baseada em XP total
export async function getUserRank(userId: string): Promise<number | null> {
  const profile = await getUserXpProfile(userId);
  if (!profile) return null;

  // Conta usuários com mais XP que o usuário
  const ahead = await prisma.userXP.count({
    where: { totalXp: { gt: profile.totalXp } },
  });

  // Posição é número de usuários à frente + 1
  return ahead + 1;
}

// Exporta constantes de recompensas de XP
export { XP_REWARDS };

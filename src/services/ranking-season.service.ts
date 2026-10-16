import type { RankingLeague } from "@prisma/client";
import {
  DEMOTION_SLOTS,
  formatSeasonLabel,
  getCurrentSeasonKey,
  getNextLeague,
  getPreviousLeague,
  getPreviousSeasonKey,
  getSeasonBounds,
  getSeasonDaysRemaining,
  getSeasonRewardCoins,
  MIN_LEAGUE_SIZE_FOR_DEMOTION,
  PROMOTION_SLOTS,
} from "@/lib/ranking-leagues";
import { prisma } from "@/lib/prisma";
import { awardCoins } from "@/services/wallet.service";
import { createNotification } from "@/services/notification.service";
import type { RankingEntry } from "@/services/xp.service";

export type UserSeasonStanding = {
  seasonKey: string;
  seasonLabel: string;
  league: RankingLeague;
  seasonXp: number;
  leagueRank: number | null;
  leagueSize: number;
  daysRemaining: number;
  inPromotionZone: boolean;
  inDemotionZone: boolean;
  nextLeague: RankingLeague | null;
};

export type PendingSeasonReward = {
  seasonKey: string;
  seasonLabel: string;
  league: RankingLeague;
  finalRank: number;
  seasonXp: number;
  rewardCoins: number;
  promoted: boolean;
  demoted: boolean;
};

async function getSeasonXpByUser(
  userIds: string[],
  seasonKey: string,
): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  const { startsAt, endsAt } = getSeasonBounds(seasonKey);
  const grouped = await prisma.xpTransaction.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      createdAt: { gte: startsAt, lte: endsAt },
    },
    _sum: { amount: true },
  });

  return new Map(grouped.map((row) => [row.userId, row._sum.amount ?? 0]));
}

async function ensureCurrentSeasonRecord(seasonKey: string) {
  const bounds = getSeasonBounds(seasonKey);
  await prisma.rankingSeason.upsert({
    where: { seasonKey },
    create: {
      seasonKey,
      startsAt: bounds.startsAt,
      endsAt: bounds.endsAt,
    },
    update: {},
  });
}

export async function processPreviousSeasonIfNeeded(): Promise<void> {
  const previousKey = getPreviousSeasonKey();
  const currentKey = getCurrentSeasonKey();
  if (previousKey >= currentKey) return;

  const season = await prisma.rankingSeason.findUnique({
    where: { seasonKey: previousKey },
  });
  if (season?.processedAt) return;

  const leagues: RankingLeague[] = ["BRONZE", "SILVER", "GOLD"];

  await prisma.$transaction(async (tx) => {
    const locked = await tx.rankingSeason.findUnique({ where: { seasonKey: previousKey } });
    if (locked?.processedAt) return;

    const bounds = getSeasonBounds(previousKey);
    await tx.rankingSeason.upsert({
      where: { seasonKey: previousKey },
      create: {
        seasonKey: previousKey,
        startsAt: bounds.startsAt,
        endsAt: bounds.endsAt,
        processedAt: new Date(),
      },
      update: { processedAt: new Date() },
    });

    for (const league of leagues) {
      const members = await tx.userXP.findMany({
        where: { league },
        select: { userId: true, league: true },
      });
      if (members.length === 0) continue;

      const xpMap = await getSeasonXpByUser(
        members.map((m) => m.userId),
        previousKey,
      );

      const ranked = members
        .map((member) => ({
          userId: member.userId,
          league: member.league,
          seasonXp: xpMap.get(member.userId) ?? 0,
        }))
        .filter((entry) => entry.seasonXp > 0)
        .sort((a, b) => b.seasonXp - a.seasonXp);

      if (ranked.length === 0) continue;

      const promoteIds = new Set(ranked.slice(0, PROMOTION_SLOTS).map((entry) => entry.userId));
      const demoteIds =
        ranked.length >= MIN_LEAGUE_SIZE_FOR_DEMOTION
          ? new Set(ranked.slice(-DEMOTION_SLOTS).map((entry) => entry.userId))
          : new Set<string>();

      for (let index = 0; index < ranked.length; index++) {
        const entry = ranked[index];
        const finalRank = index + 1;
        const promoted = promoteIds.has(entry.userId) && getNextLeague(league) !== null;
        const demoted = demoteIds.has(entry.userId) && getPreviousLeague(league) !== null;
        const rewardCoins = getSeasonRewardCoins(league, finalRank, entry.seasonXp);

        await tx.rankingSeasonResult.upsert({
          where: {
            userId_seasonKey: { userId: entry.userId, seasonKey: previousKey },
          },
          create: {
            userId: entry.userId,
            seasonKey: previousKey,
            league,
            seasonXp: entry.seasonXp,
            finalRank,
            promoted,
            demoted,
            rewardCoins,
          },
          update: {
            league,
            seasonXp: entry.seasonXp,
            finalRank,
            promoted,
            demoted,
            rewardCoins,
          },
        });

        if (promoted) {
          const nextLeague = getNextLeague(league);
          if (nextLeague) {
            await tx.userXP.update({
              where: { userId: entry.userId },
              data: { league: nextLeague },
            });
          }
        } else if (demoted) {
          const prevLeague = getPreviousLeague(league);
          if (prevLeague) {
            await tx.userXP.update({
              where: { userId: entry.userId },
              data: { league: prevLeague },
            });
          }
        }
      }
    }
  });

  const results = await prisma.rankingSeasonResult.findMany({
    where: { seasonKey: previousKey, rewardCoins: { gt: 0 } },
  });

  for (const result of results) {
    const label = formatSeasonLabel(previousKey);
    let message = `Você ficou em ${result.finalRank}º na Liga ${result.league} de ${label}.`;
    if (result.promoted) message += " Você foi promovido!";
    if (result.demoted) message += " Você foi rebaixado nesta temporada.";
    if (result.rewardCoins > 0) {
      message += ` Resgate ${result.rewardCoins} moedas no ranking.`;
    }

    await createNotification({
      userId: result.userId,
      type: "XP_EARNED",
      title: "Temporada encerrada",
      message,
      link: "/ranking",
    });
  }
}

export async function getUserSeasonStanding(userId: string): Promise<UserSeasonStanding | null> {
  const profile = await prisma.userXP.findUnique({ where: { userId } });
  if (!profile) return null;

  const seasonKey = getCurrentSeasonKey();
  await ensureCurrentSeasonRecord(seasonKey);

  const leagueMembers = await prisma.userXP.findMany({
    where: { league: profile.league },
    select: { userId: true },
  });

  const xpMap = await getSeasonXpByUser(
    leagueMembers.map((m) => m.userId),
    seasonKey,
  );

  const ranked = leagueMembers
    .map((member) => ({
      userId: member.userId,
      seasonXp: xpMap.get(member.userId) ?? 0,
    }))
    .sort((a, b) => b.seasonXp - a.seasonXp);

  const seasonXp = xpMap.get(userId) ?? 0;
  const leagueRankIndex = ranked.findIndex((entry) => entry.userId === userId);
  const leagueRank = leagueRankIndex >= 0 ? leagueRankIndex + 1 : null;
  const leagueSize = ranked.length;

  return {
    seasonKey,
    seasonLabel: formatSeasonLabel(seasonKey),
    league: profile.league,
    seasonXp,
    leagueRank,
    leagueSize,
    daysRemaining: getSeasonDaysRemaining(),
    inPromotionZone: leagueRank != null && leagueRank <= PROMOTION_SLOTS && seasonXp > 0,
    inDemotionZone:
      leagueRank != null &&
      leagueSize >= MIN_LEAGUE_SIZE_FOR_DEMOTION &&
      leagueRank > leagueSize - DEMOTION_SLOTS &&
      seasonXp > 0,
    nextLeague: getNextLeague(profile.league),
  };
}

export async function getLeagueRanking(
  league: RankingLeague,
  seasonKey: string,
  limit = 50,
): Promise<RankingEntry[]> {
  const members = await prisma.userXP.findMany({
    where: { league },
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

  if (members.length === 0) return [];

  const xpMap = await getSeasonXpByUser(
    members.map((m) => m.userId),
    seasonKey,
  );

  return members
    .map((member) => ({
      id: member.id,
      userId: member.userId,
      level: member.level,
      league: member.league,
      periodXp: xpMap.get(member.userId) ?? 0,
      totalXp: member.totalXp,
      user: member.user,
    }))
    .sort((a, b) => b.periodXp - a.periodXp || b.totalXp - a.totalXp)
    .slice(0, limit);
}

export async function getPendingSeasonRewards(userId: string): Promise<PendingSeasonReward[]> {
  const rows = await prisma.rankingSeasonResult.findMany({
    where: {
      userId,
      rewardCoins: { gt: 0 },
      rewardClaimedAt: null,
    },
    orderBy: { seasonKey: "desc" },
  });

  return rows.map((row) => ({
    seasonKey: row.seasonKey,
    seasonLabel: formatSeasonLabel(row.seasonKey),
    league: row.league,
    finalRank: row.finalRank,
    seasonXp: row.seasonXp,
    rewardCoins: row.rewardCoins,
    promoted: row.promoted,
    demoted: row.demoted,
  }));
}

export async function claimSeasonReward(
  userId: string,
  seasonKey: string,
): Promise<{ coins: number } | null> {
  const result = await prisma.rankingSeasonResult.findUnique({
    where: { userId_seasonKey: { userId, seasonKey } },
  });

  if (!result || result.rewardClaimedAt || result.rewardCoins <= 0) {
    return null;
  }

  const award = await awardCoins(
    userId,
    result.rewardCoins,
    "LEAGUE_REWARD",
    `season-${seasonKey}`,
    `Recompensa da temporada ${formatSeasonLabel(seasonKey)}`,
  );

  if (!award) return null;

  await prisma.rankingSeasonResult.update({
    where: { id: result.id },
    data: { rewardClaimedAt: new Date() },
  });

  return { coins: award.amount };
}

export async function getUserSeasonHistory(userId: string, limit = 6) {
  return prisma.rankingSeasonResult.findMany({
    where: { userId },
    orderBy: { seasonKey: "desc" },
    take: limit,
  });
}

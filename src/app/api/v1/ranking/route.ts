import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api-error";
import { getOptionalBearerAuth } from "@/lib/api-auth";
import { getCurrentSeasonKey, parseLeagueFilter } from "@/lib/ranking-leagues";
import {
  getLeagueRanking,
  getUserSeasonStanding,
} from "@/services/ranking-season.service";
import { getRanking, type RankingPeriod } from "@/services/xp.service";
import { prisma } from "@/lib/prisma";

function parsePeriod(value: string | null): RankingPeriod {
  if (value === "week" || value === "month" || value === "all") return value;
  return "month";
}

export const GET = withApiErrorHandling(async (req) => {
  const userId = await getOptionalBearerAuth(req);
  const { searchParams } = new URL(req.url);
  const period = parsePeriod(searchParams.get("period"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50") || 50));

  let leagueFilter = parseLeagueFilter(searchParams.get("league") ?? undefined);
  if (period === "month" && leagueFilter === "ALL" && userId) {
    const profile = await prisma.userXP.findUnique({
      where: { userId },
      select: { league: true },
    });
    if (profile) leagueFilter = profile.league;
  }

  let ranking: Awaited<ReturnType<typeof getRanking>> = [];
  if (period === "month" && leagueFilter !== "ALL") {
    ranking = await getLeagueRanking(leagueFilter, getCurrentSeasonKey(), limit);
  } else {
    ranking = await getRanking(limit, period);
  }

  const standing = userId ? await getUserSeasonStanding(userId) : null;

  return NextResponse.json({
    period,
    league: leagueFilter,
    ranking: ranking.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      level: entry.level,
      league: entry.league,
      periodXp: entry.periodXp,
      totalXp: entry.totalXp,
      user: entry.user,
    })),
    seasonStanding: standing,
  });
});

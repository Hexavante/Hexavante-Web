export const dynamic = 'force-dynamic';

import { Trophy } from "lucide-react";
import { auth } from "@/auth";
import { RankingFilters } from "@/components/ranking/ranking-filters";
import { RankingLeagueFilters } from "@/components/ranking/ranking-league-filters";
import { RankingPodium } from "@/components/ranking/ranking-podium";
import { RankingRow } from "@/components/ranking/ranking-row";
import { RankingSeasonHistory } from "@/components/ranking/ranking-season-history";
import { RankingSeasonPanel } from "@/components/ranking/ranking-season-panel";
import { AppLink } from "@/components/ui/app-link";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { getCurrentSeasonKey, parseLeagueFilter } from "@/lib/ranking-leagues";
import {
  getLeagueRanking,
  getPendingSeasonRewards,
  getUserSeasonHistory,
  getUserSeasonStanding,
} from "@/services/ranking-season.service";
import { getRanking, type RankingPeriod } from "@/services/xp.service";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ period?: string; league?: string }>;
};

const PERIOD_LABELS: Record<RankingPeriod, string> = {
  week: "semanal",
  month: "da temporada",
  all: "geral",
};

function parsePeriod(value?: string): RankingPeriod {
  if (value === "week" || value === "month" || value === "all") return value;
  return "month";
}

export default async function RankingPage({ searchParams }: Props) {
  const session = await auth();
  const { period: periodParam, league: leagueParam } = await searchParams;
  const period = parsePeriod(periodParam);

  let leagueFilter = parseLeagueFilter(leagueParam);
  if (period === "month" && leagueFilter === "ALL" && session?.user?.id) {
    const profile = await prisma.userXP.findUnique({
      where: { userId: session.user.id },
      select: { league: true },
    });
    if (profile) leagueFilter = profile.league;
  }

  let ranking: Awaited<ReturnType<typeof getRanking>> = [];
  let error: string | null = null;

  const [standing, pendingRewards, seasonHistory] = session?.user?.id
    ? await Promise.all([
        getUserSeasonStanding(session.user.id),
        getPendingSeasonRewards(session.user.id),
        getUserSeasonHistory(session.user.id),
      ])
    : [null, [], []];

  try {
    if (period === "month" && leagueFilter !== "ALL") {
      ranking = await getLeagueRanking(leagueFilter, getCurrentSeasonKey(), 50);
    } else {
      ranking = await getRanking(50, period);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Erro ao carregar ranking";
    console.error("Erro ao carregar ranking:", error);
  }

  const showPodium = ranking.length >= 3;
  const listStartIndex = showPodium ? 3 : 0;
  const rest = ranking.slice(listStartIndex);

  return (
    <PageShell size="md">
      <AppLink href="/perfil" muted className="mb-4 inline-flex items-center gap-1 anim-enter-fade anim-d1">
        ← Meu perfil
      </AppLink>

      <div className="anim-enter anim-d1">
        <PageHeader
          badge="Ligas"
          icon={Trophy}
          title="Ranking por ligas"
          description="Compita em temporadas mensais nas ligas Bronze, Prata e Ouro. Os melhores sobem e ganham moedas."
        />
      </div>

      {session?.user && standing && (
        <div className="mt-4 anim-enter anim-d2">
          <RankingSeasonPanel standing={standing} pendingRewards={pendingRewards} />
        </div>
      )}

      <div className="mt-6 space-y-3 anim-enter-fade anim-d2">
        <RankingFilters current={period} />
        {period === "month" && (
          <RankingLeagueFilters current={leagueFilter} period={period} />
        )}
      </div>

      <div className="anim-enter anim-d3">
        {error ? (
          <Alert variant="danger" className="mt-6 p-6 text-center">
            Erro ao carregar ranking. Tente novamente mais tarde.
          </Alert>
        ) : ranking.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Ninguém no ranking ainda."
            description="Ganhe XP nesta temporada para aparecer na sua liga!"
            className="mt-6"
          />
        ) : (
          <>
            {showPodium && (
              <RankingPodium
                entries={ranking}
                currentUserId={session?.user?.id}
                periodLabel={PERIOD_LABELS[period]}
              />
            )}

            {rest.length > 0 && (
              <ol className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
                {rest.map((entry, index) => (
                  <RankingRow
                    key={entry.id}
                    entry={entry}
                    position={listStartIndex + index + 1}
                    isCurrentUser={session?.user?.id === entry.userId}
                    showTotalXp={period !== "all"}
                    showLeague={period !== "month"}
                  />
                ))}
              </ol>
            )}
          </>
        )}
      </div>

      {session?.user && <RankingSeasonHistory history={seasonHistory} />}
    </PageShell>
  );
}

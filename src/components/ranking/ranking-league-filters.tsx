import Link from "next/link";
import type { RankingLeague } from "@prisma/client";
import { LEAGUE_LABELS } from "@/lib/ranking-leagues";
import { cn } from "@/lib/cn";
import { themeUi } from "@/lib/theme-ui";

type Props = {
  current: RankingLeague | "ALL";
  period: string;
};

const LEAGUES: Array<{ value: RankingLeague | "ALL"; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "BRONZE", label: LEAGUE_LABELS.BRONZE },
  { value: "SILVER", label: LEAGUE_LABELS.SILVER },
  { value: "GOLD", label: LEAGUE_LABELS.GOLD },
];

export function RankingLeagueFilters({ current, period }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {LEAGUES.map((league) => {
        const params = new URLSearchParams({ period });
        if (league.value !== "ALL") params.set("league", league.value);

        return (
          <Link
            key={league.value}
            href={`/ranking?${params.toString()}`}
            className={cn(
              "hx-filter-pill",
              current === league.value ? themeUi.filterActive : themeUi.filterInactive,
            )}
          >
            {league.label}
          </Link>
        );
      })}
    </div>
  );
}

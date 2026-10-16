import { LEAGUE_LABELS, formatSeasonLabel } from "@/lib/ranking-leagues";
import { Card } from "@/components/ui/card";
import { LeagueBadge } from "@/components/ranking/league-badge";
import type { RankingSeasonResult } from "@prisma/client";

type Props = {
  history: RankingSeasonResult[];
};

export function RankingSeasonHistory({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <Card padding="md" className="mt-6">
      <h3 className="font-semibold text-white">Histórico de temporadas</h3>
      <ul className="mt-4 space-y-2">
        {history.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <LeagueBadge league={item.league} />
              <span className="text-slate-300">{formatSeasonLabel(item.seasonKey)}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>{item.finalRank}º</span>
              <span>{item.seasonXp} XP</span>
              {item.rewardCoins > 0 && (
                <span className="text-amber-200">+{item.rewardCoins} moedas</span>
              )}
              {item.promoted && (
                <span className="font-semibold text-emerald-300">↑ {LEAGUE_LABELS[item.league]}</span>
              )}
              {item.demoted && <span className="font-semibold text-red-300">↓</span>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

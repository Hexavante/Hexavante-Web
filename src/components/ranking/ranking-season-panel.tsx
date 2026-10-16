"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp, Coins, Trophy } from "lucide-react";
import { claimSeasonRewardAction } from "@/app/actions/ranking-season";
import { LeagueBadge } from "@/components/ranking/league-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { LEAGUE_DESCRIPTIONS } from "@/lib/ranking-leagues";
import type { PendingSeasonReward, UserSeasonStanding } from "@/services/ranking-season.service";

type Props = {
  standing: UserSeasonStanding;
  pendingRewards: PendingSeasonReward[];
};

export function RankingSeasonPanel({ standing, pendingRewards }: Props) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <Card padding="md" className="border-[hsl(var(--sidebar-highlight)/0.22)] bg-gradient-to-br from-[hsl(var(--sidebar-highlight)/0.1)] to-transparent">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide hx-accent-text">Temporada atual</p>
            <h2 className="mt-1 text-xl font-bold text-white">{standing.seasonLabel}</h2>
            <p className="mt-2 text-sm text-slate-400">{LEAGUE_DESCRIPTIONS[standing.league]}</p>
          </div>
          <LeagueBadge league={standing.league} size="md" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] p-3">
            <p className="text-xs text-slate-400">Seu XP na temporada</p>
            <p className="mt-1 text-2xl font-bold hx-accent-text">
              {standing.seasonXp.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] p-3">
            <p className="text-xs text-slate-400">Posição na liga</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {standing.leagueRank != null ? `${standing.leagueRank}º` : "—"}
              <span className="ml-1 text-sm font-normal text-slate-500">
                / {standing.leagueSize}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] p-3">
            <p className="text-xs text-slate-400">Dias restantes</p>
            <p className="mt-1 text-2xl font-bold text-amber-200">{standing.daysRemaining}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {standing.inPromotionZone && standing.nextLeague && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              <ArrowUp className="h-4 w-4" />
              Zona de promoção para {standing.nextLeague === "SILVER" ? "Prata" : "Ouro"}
            </span>
          )}
          {standing.inDemotionZone && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-red-200">
              <ArrowDown className="h-4 w-4" />
              Atenção: zona de rebaixamento
            </span>
          )}
          {!standing.inPromotionZone && !standing.inDemotionZone && standing.seasonXp > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-slate-300">
              <Trophy className="h-4 w-4 text-amber-300" />
              Continue ganhando XP para subir na liga
            </span>
          )}
        </div>
      </Card>

      {pendingRewards.length > 0 && (
        <Card padding="md" className="border-amber-400/25 bg-amber-400/5">
          <h3 className="font-semibold text-white">Recompensas pendentes</h3>
          <ul className="mt-3 space-y-3">
            {pendingRewards.map((reward) => (
              <li
                key={reward.seasonKey}
                className="flex flex-col gap-3 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{reward.seasonLabel}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {reward.finalRank}º na Liga {reward.league} · {reward.seasonXp} XP
                  </p>
                  {reward.promoted && (
                    <p className="mt-1 text-xs font-semibold text-emerald-300">Promovido!</p>
                  )}
                  {reward.demoted && (
                    <p className="mt-1 text-xs font-semibold text-red-300">Rebaixado</p>
                  )}
                </div>
                <Button
                  type="button"
                  disabled={pending}
                  className="gap-2"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await claimSeasonRewardAction(reward.seasonKey);
                      if (result.success && result.coins) {
                        toast(`+${result.coins} moedas resgatadas!`, "success");
                      } else if (result.error) {
                        toast(result.error, "error");
                      }
                    });
                  }}
                >
                  <Coins className="h-4 w-4" />
                  Resgatar {reward.rewardCoins} moedas
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

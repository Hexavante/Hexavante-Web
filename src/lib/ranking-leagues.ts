import type { RankingLeague } from "@prisma/client";

export const LEAGUE_ORDER: RankingLeague[] = ["BRONZE", "SILVER", "GOLD"];

export const LEAGUE_LABELS: Record<RankingLeague, string> = {
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
};

export const LEAGUE_DESCRIPTIONS: Record<RankingLeague, string> = {
  BRONZE: "Liga inicial — suba de posição para conquistar a Prata.",
  SILVER: "Liga intermediária — os melhores avançam para o Ouro.",
  GOLD: "Liga elite — dispute o topo e as maiores recompensas.",
};

export const LEAGUE_STYLES: Record<
  RankingLeague,
  { badge: string; text: string; border: string; glow: string }
> = {
  BRONZE: {
    badge: "bg-orange-400/15 text-orange-200 border-orange-400/30",
    text: "text-orange-200",
    border: "border-orange-400/25",
    glow: "shadow-orange-950/20",
  },
  SILVER: {
    badge: "bg-slate-300/15 text-slate-100 border-slate-300/30",
    text: "text-slate-100",
    border: "border-slate-300/25",
    glow: "shadow-slate-950/20",
  },
  GOLD: {
    badge: "bg-amber-400/15 text-amber-100 border-amber-400/40",
    text: "text-amber-100",
    border: "border-amber-400/35",
    glow: "shadow-amber-950/25",
  },
};

export const PROMOTION_SLOTS = 5;
export const DEMOTION_SLOTS = 5;
export const MIN_LEAGUE_SIZE_FOR_DEMOTION = 10;
export const PARTICIPATION_XP_MIN = 50;
export const PARTICIPATION_REWARD_COINS = 5;

const TOP_REWARDS: Record<RankingLeague, Record<number, number>> = {
  BRONZE: { 1: 50, 2: 35, 3: 25, 4: 15, 5: 15, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10 },
  SILVER: { 1: 75, 2: 50, 3: 40, 4: 20, 5: 20, 6: 15, 7: 15, 8: 15, 9: 15, 10: 15 },
  GOLD: { 1: 100, 2: 75, 3: 50, 4: 25, 5: 25, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 },
};

export function getSeasonRewardCoins(league: RankingLeague, rank: number, seasonXp: number): number {
  if (rank <= 10) return TOP_REWARDS[league][rank] ?? 0;
  if (seasonXp >= PARTICIPATION_XP_MIN) return PARTICIPATION_REWARD_COINS;
  return 0;
}

export function getNextLeague(league: RankingLeague): RankingLeague | null {
  const index = LEAGUE_ORDER.indexOf(league);
  if (index < 0 || index >= LEAGUE_ORDER.length - 1) return null;
  return LEAGUE_ORDER[index + 1];
}

export function getPreviousLeague(league: RankingLeague): RankingLeague | null {
  const index = LEAGUE_ORDER.indexOf(league);
  if (index <= 0) return null;
  return LEAGUE_ORDER[index - 1];
}

export function formatSeasonLabel(seasonKey: string): string {
  const [year, month] = seasonKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getCurrentSeasonKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPreviousSeasonKey(date = new Date()): string {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getCurrentSeasonKey(prev);
}

export function getSeasonBounds(seasonKey: string): { startsAt: Date; endsAt: Date } {
  const [year, month] = seasonKey.split("-").map(Number);
  const startsAt = new Date(year, month - 1, 1);
  const endsAt = new Date(year, month, 0, 23, 59, 59, 999);
  return { startsAt, endsAt };
}

export function getSeasonDaysRemaining(date = new Date()): number {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  const diff = end.getTime() - date.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function parseLeagueFilter(value?: string): RankingLeague | "ALL" {
  if (value === "BRONZE" || value === "SILVER" || value === "GOLD") return value;
  return "ALL";
}

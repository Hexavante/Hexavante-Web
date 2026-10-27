import Link from "next/link";
import { Crown, Medal, Sparkles } from "lucide-react";
import type { RankingEntry } from "@/services/xp.service";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LeagueBadge } from "@/components/ranking/league-badge";
import { cn } from "@/lib/cn";

type Props = {
  entries: RankingEntry[];
  currentUserId?: string;
  periodLabel: string;
};

const podiumStyles = [
  {
    order: "order-2 md:order-1",
    height: "h-28",
    medal: "bg-slate-300/20 text-slate-100 border-slate-300/30",
    icon: Medal,
    label: "2º",
  },
  {
    order: "order-1 md:order-2",
    height: "h-36",
    medal: "bg-amber-400/20 text-amber-100 border-amber-400/40",
    icon: Crown,
    label: "1º",
  },
  {
    order: "order-3",
    height: "h-24",
    medal: "bg-orange-400/20 text-orange-100 border-orange-400/30",
    icon: Medal,
    label: "3º",
  },
];

export function RankingPodium({ entries, currentUserId, periodLabel }: Props) {
  const topThree = [entries[1], entries[0], entries[2]].filter(Boolean);

  if (topThree.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-[hsl(var(--sidebar-border))] bg-gradient-to-b from-[hsl(var(--sidebar-highlight)/0.1)] to-transparent p-6">
      <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wide hx-accent-text">
        Pódio {periodLabel}
      </p>

      <div className="flex w-full items-end justify-center gap-2 sm:gap-4 md:gap-6">
        {topThree.map((entry, index) => {
          if (!entry) return <div key={index} className="w-1/3 max-w-36" />;
          const style = podiumStyles[index];
          const Icon = style.icon;
          const isCurrentUser = currentUserId === entry.userId;

          return (
            <Link
              key={entry.id}
              href={`/perfil/${entry.user.username}`}
              className={cn(
                "flex w-1/3 min-w-0 max-w-36 flex-col items-center text-center transition hover:opacity-90",
                style.order,
              )}
            >
              <Avatar src={entry.user.avatarUrl} alt={entry.user.username ?? ""} size="sm" />
              <p className="mt-2 w-full min-w-0 truncate text-sm font-bold text-white">
                {entry.user.fullName}
              </p>
              <p className="w-full min-w-0 truncate text-xs text-slate-400">
                @{entry.user.username}
              </p>
              <div className="mt-1 flex min-h-[3.5rem] w-full flex-col items-center gap-1">
                {isCurrentUser && <Badge variant="sky">Você</Badge>}
                {entry.league && <LeagueBadge league={entry.league} />}
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 hx-accent-text" />
                  Nv. {entry.level}
                </div>
                <p className="text-sm font-semibold hx-accent-text">
                  {entry.periodXp.toLocaleString("pt-BR")} XP
                </p>
              </div>
              <div
                className={cn(
                  "mt-3 flex w-full items-end justify-center rounded-t-xl border border-white/10 bg-white/[0.06]",
                  style.height,
                )}
              >
                <span className="flex items-center gap-1 pb-2 text-lg font-black text-white">
                  <Icon className="h-4 w-4" />
                  {style.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

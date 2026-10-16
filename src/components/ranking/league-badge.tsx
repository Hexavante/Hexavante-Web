import type { RankingLeague } from "@prisma/client";
import { LEAGUE_LABELS, LEAGUE_STYLES } from "@/lib/ranking-leagues";
import { cn } from "@/lib/cn";

type Props = {
  league: RankingLeague;
  className?: string;
  size?: "sm" | "md";
};

export function LeagueBadge({ league, className, size = "sm" }: Props) {
  const styles = LEAGUE_STYLES[league];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        styles.badge,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className,
      )}
    >
      Liga {LEAGUE_LABELS[league]}
    </span>
  );
}

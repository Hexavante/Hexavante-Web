import { Skeleton } from "@/components/ui/skeleton";

export function HeaderGamificationHudSkeleton() {
  return (
    <div className="hx-header-hud" aria-hidden>
      <div className="hx-header-hud-coins-skeleton">
        <Skeleton className="h-3.5 w-12" />
      </div>
      <div className="hx-header-hud-xp-skeleton">
        <div className="hx-header-hud-xp-skeleton-row hx-header-hud-xp-skeleton-row--top">
          <Skeleton className="hx-header-hud-xp-skeleton-level" />
          <Skeleton className="hx-header-hud-xp-skeleton-percent" />
        </div>
        <div className="hx-header-hud-xp-skeleton-count-row">
          <Skeleton className="hx-header-hud-xp-skeleton-count" />
        </div>
        <Skeleton className="hx-header-hud-xp-skeleton-track" />
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function HeaderXpSkeleton() {
  return (
    <div className="hx-header-xp" aria-hidden>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

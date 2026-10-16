import { Skeleton } from "@/components/ui/skeleton";

export function HeaderWalletSkeleton() {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Skeleton className="h-11 w-[5.5rem] rounded-lg" />
      <Skeleton className="hidden h-11 w-[9rem] rounded-lg md:block" />
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { LottieAnimation } from "@/components/ui/lottie-animation";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn("hx-empty", className)}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center">
        <LottieAnimation
          name="empty"
          loop
          className="h-20 w-20"
          fallback={<Icon className="h-8 w-8 text-slate-500" />}
        />
      </div>
      <p className="mt-1 font-semibold text-slate-200">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {children}
    </div>
  );
}

import { resolveAppTheme } from "@/lib/cosmetics";
import { cn } from "@/lib/cn";

type Props = {
  themeId?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function ThemeSwatch({ themeId, size = "md", className }: Props) {
  const theme = resolveAppTheme(themeId ?? "default");
  const [primary, accent, background] = theme.preview;

  const sizeClass =
    size === "sm" ? "h-11 w-11" : size === "lg" ? "h-16 w-full" : "h-12 w-12";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border shadow-inner",
        theme.mode === "light" ? "border-slate-200" : "border-white/15",
        sizeClass,
        className,
      )}
      style={{ background }}
      title={theme.label}
      aria-hidden
    >
      <div className="absolute inset-1.5 grid grid-cols-[18%_1fr] gap-1" aria-hidden>
        <div className="rounded-sm" style={{ backgroundColor: primary, opacity: 0.75 }} />
        <div className="flex flex-col justify-center gap-1">
          <div className="h-1 w-2/3 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-2 rounded-sm" style={{ background: `linear-gradient(110deg, ${primary}, ${accent})` }} />
          <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: primary }} />
        </div>
      </div>
    </div>
  );
}

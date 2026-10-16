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
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `linear-gradient(135deg, ${primary}55 0%, transparent 55%, ${accent}44 100%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 border-t border-white/10"
        style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }}
      />
    </div>
  );
}

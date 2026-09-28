import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  wordmarkClassName?: string;
  imageClassName?: string;
};

const SIZES = {
  sm: { image: 32, text: "text-sm" },
  md: { image: 40, text: "text-base" },
  lg: { image: 48, text: "text-lg" },
  xl: { image: 56, text: "text-xl" },
} as const;

export function HexavanteLogo({
  showWordmark = true,
  size = "sm",
  className,
  wordmarkClassName,
  imageClassName,
}: Props) {
  const dimensions = SIZES[size];

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/brand/hexavante-logo.webp"
        alt="Hexavante"
        width={dimensions.image}
        height={dimensions.image}
        className={cn(
          "hx-header-logo-glow shrink-0 object-contain",
          imageClassName,
        )}
        priority
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-black uppercase tracking-[0.2em]",
            dimensions.text,
            wordmarkClassName,
          )}
          style={{ textShadow: "0 0 16px hsl(var(--sidebar-highlight) / 0.3)" }}
        >
          HEXAVANTE
        </span>
      ) : null}
    </span>
  );
}

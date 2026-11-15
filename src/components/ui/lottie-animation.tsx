"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

/** Animações Lottie do Hexavante. Os arquivos ficam em `src/lottie/`. */
const LOADERS = {
  success: () => import("@/lottie/success.json"),
  confetti: () => import("@/lottie/confetti.json"),
  empty: () => import("@/lottie/empty.json"),
} as const;

export type LottieName = keyof typeof LOADERS;

type Props = {
  name: LottieName;
  loop?: boolean;
  className?: string;
  /** Mostrado enquanto carrega e para quem pediu "menos movimento" no sistema. */
  fallback?: ReactNode;
  onComplete?: () => void;
};

export function LottieAnimation({ name, loop = false, className, fallback = null, onComplete }: Props) {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    LOADERS[name]()
      .then((mod) => alive && setData(mod.default))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [name]);

  if (!data) return <>{fallback}</>;

  return (
    <Lottie
      animationData={data}
      loop={loop}
      onComplete={onComplete}
      className={cn("pointer-events-none", className)}
      aria-hidden
    />
  );
}

/** Confete por cima da área pai (que precisa ser `relative`). Toca uma vez e some. */
export function ConfettiBurst({ className }: { className?: string }) {
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden", className)} aria-hidden>
      <LottieAnimation name="confetti" className="h-full max-h-96 w-full max-w-96" onComplete={() => setDone(true)} />
    </div>
  );
}

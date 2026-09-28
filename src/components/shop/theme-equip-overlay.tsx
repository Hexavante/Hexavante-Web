"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Palette } from "lucide-react";
import { APP_THEMES } from "@/lib/cosmetics";
import { THEME_EQUIPPED_EVENT, type ThemeEquippedDetail } from "@/lib/theme-equip-event";

/**
 * Celebração global ao equipar um tema: flash nas cores do tema,
 * nome do tema e refresh para aplicar visualmente.
 */
export function ThemeEquipOverlay() {
  const [themeId, setThemeId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const hide = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setThemeId(null);
    setLeaving(false);
  }, []);

  useEffect(() => {
    const onEquipped = (event: Event) => {
      const { themeId: id } = (event as CustomEvent<ThemeEquippedDetail>).detail ?? {};
      if (!id) return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setLeaving(false);
      setThemeId(id);
      timers.current.push(setTimeout(() => router.refresh(), 1200));
      timers.current.push(setTimeout(() => setLeaving(true), 1500));
      timers.current.push(
        setTimeout(() => {
          setThemeId(null);
          setLeaving(false);
        }, 1900),
      );
    };

    window.addEventListener(THEME_EQUIPPED_EVENT, onEquipped);
    return () => {
      window.removeEventListener(THEME_EQUIPPED_EVENT, onEquipped);
      timers.current.forEach(clearTimeout);
    };
  }, [router, hide]);

  if (!themeId) return null;

  const theme = APP_THEMES[themeId] ?? APP_THEMES.default;
  const [c1, c2, c3] = theme.preview;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        leaving ? "opacity-0" : "animate-fade-in opacity-100"
      }`}
      aria-live="polite"
    >
      <div
        className="hx-dark-surface animate-scale-in relative overflow-hidden rounded-2xl border border-white/15 bg-[#0b0e1a] px-10 py-8 text-center shadow-2xl"
        style={{ boxShadow: `0 0 80px ${c1}55, 0 25px 60px rgb(0 0 0 / 0.6)` }}
      >
        <div
          className="animate-bg-breathe pointer-events-none absolute -top-16 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full blur-[3rem]"
          style={{ background: `linear-gradient(90deg, ${c1}66, ${c2}66)` }}
        />
        <div className="relative flex items-center justify-center gap-3">
          {[c1, c2, c3].map((c, i) => (
            <span
              key={i}
              className="animate-pulse-glow h-9 w-9 rounded-full border border-white/25"
              style={{ background: c, animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
        <p className="relative mt-5 flex items-center justify-center gap-2 text-lg font-black text-white">
          <Palette className="h-5 w-5" style={{ color: c2 }} />
          {theme.label}
        </p>
        <p className="relative mt-1 text-sm text-emerald-300">Tema equipado com sucesso!</p>
        <div className="relative mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="animate-shimmer h-full w-full" />
        </div>
      </div>
    </div>
  );
}

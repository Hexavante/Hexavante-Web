"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PanteraMascote, type EstadoPantera } from "@/components/pantera-mascote";

/** Mesma chave usada no script inline do layout. */
const SEEN_KEY = "hx-intro-seen";
/** Duração total antes de sair sozinho (ms). */
const TOTAL_MS = 2600;
/** Duração do fade de saída (ms) — igual a hx-intro-out no CSS. */
const LEAVE_MS = 450;

const WORD = "HEXAVANTE";

/**
 * Abertura da marca: mascote entra, o nome "sai" letra por letra e a tela
 * some. Roda uma vez por sessão. Quem decide se aparece é o script inline do
 * layout (html[data-intro="play"]), então não há flash para quem já viu.
 *
 * Cores 100% por variáveis do tema (--background, --sidebar-foreground,
 * --sidebar-highlight, --accent), então acompanha os 12 temas.
 */
export function BrandIntro() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [estado, setEstado] = useState<EstadoPantera>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = useCallback(() => {
    setLeaving(true);
    timers.current.push(
      setTimeout(() => {
        document.documentElement.dataset.intro = "done";
        setGone(true);
      }, LEAVE_MS),
    );
  }, []);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") {
      setGone(true);
      return;
    }
    try {
      // Marca como vista já no início: recarregar no meio não repete.
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // storage indisponível: roda a cada carga, sem quebrar nada
    }
    // a pantera ruge enquanto as letras saem e volta ao normal antes de sair
    timers.current.push(setTimeout(() => setEstado("rugir"), 500));
    timers.current.push(setTimeout(() => setEstado("idle"), 1700));
    timers.current.push(setTimeout(finish, TOTAL_MS));
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [finish]);

  if (gone) return null;

  return (
    <div
      className="hx-intro"
      data-leaving={leaving ? "true" : "false"}
      role="presentation"
    >
      <span className="sr-only">Hexavante</span>

      <PanteraMascote
        estado={estado}
        className="hx-intro-mascot h-48 w-48 sm:h-72 sm:w-72"
      />

      <div
        aria-hidden="true"
        className="text-2xl font-black uppercase tracking-[0.25em] text-[hsl(var(--sidebar-foreground))] sm:text-4xl"
      >
        {WORD.split("").map((letter, i) => (
          <span
            key={i}
            className="hx-intro-letter"
            style={{ ["--i" as string]: i }}
          >
            {letter}
          </span>
        ))}
      </div>

      <div aria-hidden="true" className="hx-intro-line" />

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-6 right-6 rounded-lg px-3 py-2 text-xs font-medium text-[hsl(var(--sidebar-foreground)/0.6)] transition hover:bg-white/[0.06] hover:text-[hsl(var(--sidebar-foreground))]"
      >
        Pular
      </button>
    </div>
  );
}

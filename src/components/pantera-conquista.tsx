"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, X } from "lucide-react";
import {
  PanteraMascote,
  type EstadoPantera,
} from "@/components/pantera-mascote";

/** Chave canônica da conquista no app. */
export const CHAVE_MARATONA = "maratona_100";

const EVENTO = "hx:conquista";

export type ConquistaDetalhe = {
  chave: string;
  titulo?: string;
  descricao?: string;
};

/** Chame onde a conquista for concedida (cliente). Ex.:
 *  anunciarConquista({ chave: CHAVE_MARATONA }) */
export function anunciarConquista(detalhe: ConquistaDetalhe) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: detalhe }));
}

type Fase = "entrando" | "rugindo" | "comemorando" | "saindo";

const ESTADO_POR_FASE: Record<Fase, EstadoPantera> = {
  entrando: "idle",
  rugindo: "rugir",
  comemorando: "feliz",
  saindo: "idle",
};

/** Confete determinístico (sem Math.random: evita diferença no SSR). */
const CONFETE = Array.from({ length: 14 }, (_, i) => ({
  x: (i - 6.5) * 22 + (i % 2 ? 10 : -10),
  y: -90 - (i % 3) * 40,
  r: (i * 67) % 360,
  d: (i % 5) * 60,
  c: i % 3,
}));

/**
 * A pantera grande sobe do canto inferior direito (olhando para dentro da
 * tela), ruge, comemora com confete e volta para o canto. ~4,7s no total.
 */
export function PanteraConquista({
  titulo,
  descricao,
  onFechar,
}: {
  titulo: string;
  descricao: string;
  onFechar: () => void;
}) {
  const [fase, setFase] = useState<Fase>("entrando");
  const fecharRef = useRef(onFechar);
  useEffect(() => {
    fecharRef.current = onFechar;
  });

  useEffect(() => {
    const t = [
      setTimeout(() => setFase("rugindo"), 800),
      setTimeout(() => setFase("comemorando"), 2000),
      setTimeout(() => setFase("saindo"), 4000),
      setTimeout(() => fecharRef.current(), 4700),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const cardVisivel = fase === "rugindo" || fase === "comemorando";

  return (
    <div className="hx-conquista" data-fase={fase}>
      {cardVisivel && (
        <div className="hx-conquista-card" role="status" aria-live="polite">
          <span className="hx-conquista-icone" aria-hidden="true">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.5)]">
              Conquista desbloqueada
            </p>
            <p className="truncate text-sm font-extrabold text-[hsl(var(--sidebar-foreground))]">
              {titulo}
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--sidebar-foreground)/0.6)]">
              {descricao}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="shrink-0 rounded-lg p-1.5 text-[hsl(var(--sidebar-foreground)/0.5)] transition hover:bg-white/[0.06] hover:text-[hsl(var(--sidebar-foreground))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="hx-conquista-palco">
        {fase === "comemorando" && (
          <div className="hx-conquista-confete" aria-hidden="true">
            {CONFETE.map((p, i) => (
              <span
                key={i}
                className={`hx-conf hx-conf-${p.c}`}
                style={
                  {
                    "--x": `${p.x}px`,
                    "--y": `${p.y}px`,
                    "--r": `${p.r}deg`,
                    "--d": `${p.d}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
        <PanteraMascote
          estado={ESTADO_POR_FASE[fase]}
          className="hx-conquista-pantera"
          titulo="Pantera comemorando sua conquista"
        />
      </div>
    </div>
  );
}

/**
 * Monte UMA vez no layout logado. Escuta o evento "hx:conquista" e só reage
 * à Maratona Hexavante (as outras conquistas seguem o fluxo normal).
 */
export function ConquistaPanteraHost() {
  const [atual, setAtual] = useState<ConquistaDetalhe | null>(null);

  useEffect(() => {
    function aoReceber(e: Event) {
      const d = (e as CustomEvent<ConquistaDetalhe>).detail;
      if (!d) return;
      if (d.chave !== CHAVE_MARATONA) return;
      setAtual((anterior) => anterior ?? d); // ignora se já está rodando
    }
    window.addEventListener(EVENTO, aoReceber);
    return () => window.removeEventListener(EVENTO, aoReceber);
  }, []);

  const fechar = useCallback(() => setAtual(null), []);

  if (!atual) return null;
  return (
    <PanteraConquista
      titulo={atual.titulo ?? "Maratona Hexavante"}
      descricao={
        atual.descricao ?? "Você manteve o ritmo e chegou lá. Continue assim!"
      }
      onFechar={fechar}
    />
  );
}

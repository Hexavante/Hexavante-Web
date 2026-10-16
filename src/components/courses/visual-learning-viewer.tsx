"use client";

import { useState, useMemo } from "react";
import { GitFork, Network, ListTree, Calendar, Maximize2, FileText, Settings2 } from "lucide-react";
import Link from "next/link";

export type DiagramFormat = "flowchart" | "mindmap" | "timeline" | "sequence";

type DiagramProps = {
  title?: string;
  defaultFormat?: DiagramFormat;
  data: {
    format: DiagramFormat;
    // Definição estruturada ou svg/mermaid simplificado
    steps?: { id: string; label: string; sub?: string }[];
    summaryText: string;
  };
};

export function VisualLearningViewer({ title = "Diagrama Explicativo", data }: DiagramProps) {
  const [format, setFormat] = useState<DiagramFormat>(data.format || "flowchart");
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Formatos disponíveis com ícones conforme o documento conceitual
  const formatOptions: { id: DiagramFormat; label: string; icon: any }[] = [
    { id: "flowchart", label: "Fluxograma", icon: GitFork },
    { id: "mindmap", label: "Mapa mental", icon: Network },
    { id: "sequence", label: "Sequência", icon: ListTree },
    { id: "timeline", label: "Linha do tempo", icon: Calendar },
  ];

  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition-all ${expanded ? "ring-2 ring-emerald-500/30" : ""}`}>
      {/* Topo do Card de Diagrama */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
            <GitFork className="h-3.5 w-3.5" />
          </span>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
        </div>

        {/* Alternador de formatos dinâmico (Fluxograma, Mapa mental, etc.) */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 p-1">
          {formatOptions.map((opt) => {
            const Icon = opt.icon;
            const active = format === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormat(opt.id)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title={opt.label}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Renderização do Diagrama Visual ou Fallback Textual Acessível */}
      {showTextFallback ? (
        <div className="rounded-lg border border-white/5 bg-black/30 p-4 text-sm leading-relaxed text-slate-300">
          <p className="font-semibold text-emerald-400 mb-2">Explicação Textual Acessível:</p>
          <p>{data.summaryText}</p>
        </div>
      ) : (
        <div className="relative flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 p-6 overflow-hidden">
          {/* Exemplo Interativo de Diagrama Adaptável */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg">
            {(data.steps || [
              { id: "1", label: "Início / Entrada", sub: "Disparo da lógica" },
              { id: "2", label: "Condição / Validação", sub: "Avalia regra de negócio" },
              { id: "3", label: "Execução do Fluxo", sub: "Processa resposta final" }
            ]).map((step, idx, arr) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2 text-center transition hover:border-emerald-400/60 shadow-lg">
                  <span className="text-xs font-bold text-emerald-300">{step.label}</span>
                  {step.sub && <span className="text-[10px] text-slate-400 mt-0.5">{step.sub}</span>}
                </div>
                {idx < arr.length - 1 && (
                  <span className="text-emerald-500 font-bold">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé e Controles */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => setShowTextFallback(!showTextFallback)}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-300 transition"
        >
          <FileText className="h-3.5 w-3.5" />
          {showTextFallback ? "Exibir representação visual" : "Abrir versão textual acessível"}
        </button>

        <div className="flex items-center gap-3">
          <Link
            href="/configuracoes/estudos"
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition"
            title="Personalizar preferências de estilo no seu perfil"
          >
            <Settings2 className="h-3 w-3" />
            Preferências
          </Link>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Maximize2 className="h-3 w-3" />
            {expanded ? "Recolher" : "Expandir"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

/** Ms até a próxima meia-noite de Brasília (UTC-3 fixo, sem horário de verão). */
export function msUntilMidnightBR(now: number = Date.now()): number {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 3, 0, 0, 0);
  return Math.max(0, next - now);
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Contagem regressiva até o próximo desafio (reseta à meia-noite BR). */
export function LightningCountdown() {
  const [ms, setMs] = useState(() => msUntilMidnightBR());

  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilMidnightBR()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      role="timer"
      aria-label={`Próximo desafio em ${formatCountdown(ms)}`}
      className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-200"
    >
      <Timer className="h-3.5 w-3.5" aria-hidden />
      <span aria-hidden>{formatCountdown(ms)}</span>
    </span>
  );
}

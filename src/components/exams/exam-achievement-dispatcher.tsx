"use client";

import { useEffect, useRef } from "react";
import { dispatchAchievementUnlocked } from "@/lib/achievement-events";

/**
 * Dispara o evento de conquistas desbloqueadas quando a página de resultado
 * do simulado é carregada com `?achievements=key1,key2,...`.
 *
 * Renderize uma única vez na página de resultado para garantir que o toast
 * aparece apenas ao entrar na página (não em visitas subsequentes — a
 * deduplicação via `sessionStorage` em `AchievementToast` também protege).
 *
 * Só despacha chaves reais vindas da query (que o servidor preencheu via
 * `syncUserAchievements` antes do redirect). Nunca inventa conquistas.
 */
export function ExamAchievementDispatcher({
  achievementKeys,
}: {
  achievementKeys: string[];
}) {
  const dispatchedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const clean = [
      ...new Set(
        achievementKeys
          .filter((key): key is string => typeof key === "string")
          .map((key) => key.trim())
          .filter((key) => key.length > 0),
      ),
    ];
    if (clean.length === 0) return;
    const signature = clean.join(",");
    // Evita re-dispatch em re-renders/StrictMode com a mesma lista.
    if (dispatchedSignatureRef.current === signature) return;
    dispatchedSignatureRef.current = signature;
    dispatchAchievementUnlocked(clean);
  }, [achievementKeys]);

  return null;
}

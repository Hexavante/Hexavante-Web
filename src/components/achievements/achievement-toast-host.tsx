"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENT_BY_KEY } from "@/lib/achievements";
import {
  ACHIEVEMENT_UNLOCKED_EVENT,
  type AchievementUnlockedPayload,
} from "@/lib/achievement-events";
import {
  AchievementToast,
  isAchievementToastShown,
  type AchievementToastItem,
} from "./achievement-toast";

const MAX_PENDING = 20;

function normalizeKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const key = value.trim();
    if (key.length === 0) continue;
    if (seen.has(key)) continue;
    seen.add(key);
  }
  return [...seen];
}

/**
 * Monte UMA vez no layout global (dentro do `ToastProvider`).
 *
 * Escuta o evento `hx:achievement-unlocked` na window e exibe os toasts
 * para cada conquista cujos dados existam em `ACHIEVEMENT_BY_KEY`.
 * Os dados são estáticos (sem fetch) — apenas os campos necessários para o card.
 *
 * - Acumula pendências (múltiplos dispatchs empilham, nunca substituem).
 * - Ignora chaves desconhecidas.
 * - Respeita o dedupe de sessão (mesma chave de `achievement-toast.tsx`).
 */
export function AchievementToastHost() {
  const [pending, setPending] = useState<AchievementToastItem[]>([]);

  useEffect(() => {
    function handleEvent(event: Event) {
      const payload = (event as CustomEvent<AchievementUnlockedPayload>).detail;
      const keys = normalizeKeys(payload?.keys);
      if (keys.length === 0) return;

      setPending((prev) => {
        const prevKeys = new Set(prev.map((item) => item.key));
        const items: AchievementToastItem[] = [];

        for (const key of keys) {
          // Já enfileirado nesta montagem.
          if (prevKeys.has(key)) continue;
          // Já exibido nesta sessão (dedupe global do toast).
          if (isAchievementToastShown(key)) continue;
          const def = ACHIEVEMENT_BY_KEY[key];
          if (!def) continue;

          prevKeys.add(key);
          items.push({
            key: def.key,
            title: def.title,
            description: def.description,
            icon: def.icon,
            tier: def.tier,
          });
        }

        if (items.length === 0) return prev;
        // Acumula (não substitui) para que dispatchs em sequência empilhem.
        // Teto generoso no host; o `AchievementToast` limita a 5 visíveis.
        return [...prev, ...items].slice(-MAX_PENDING);
      });
    }

    window.addEventListener(ACHIEVEMENT_UNLOCKED_EVENT, handleEvent);
    return () => window.removeEventListener(ACHIEVEMENT_UNLOCKED_EVENT, handleEvent);
  }, []);

  return <AchievementToast achievements={pending} />;
}

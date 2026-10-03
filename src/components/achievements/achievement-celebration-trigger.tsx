"use client";

import { useEffect } from "react";
import { anunciarConquista, CHAVE_MARATONA } from "@/components/pantera-conquista";

export function AchievementCelebrationTrigger({
  achievementKey,
  attemptId,
}: {
  achievementKey: string;
  attemptId: string;
}) {
  useEffect(() => {
    if (achievementKey !== CHAVE_MARATONA) return;

    const storageKey = `hx-achievement-shown:${attemptId}:${achievementKey}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Se o storage estiver bloqueado, a celebração ainda pode aparecer.
    }

    anunciarConquista({
      chave: achievementKey,
      titulo: "Maratona Hexavante",
      descricao: "Você concluiu o desafio de 100 questões. Parabéns!",
    });
  }, [achievementKey, attemptId]);

  return null;
}

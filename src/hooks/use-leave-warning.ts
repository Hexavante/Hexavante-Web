"use client";

import { useEffect } from "react";

/** Avisa antes de fechar ou recarregar a aba enquanto houver algo não salvo. */
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
}

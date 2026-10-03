"use client";

import { useEffect, useRef } from "react";
import { syncCurrentAccountAction } from "@/app/actions/security";

/**
 * Garante que a sessão atual esteja na lista multiconta `hx_accounts`.
 *
 * Só é montado pelo root layout quando `isAccountSyncPending()` diz que o token
 * de sessão atual ainda não está na lista (login OAuth recém-chegado ou token
 * rotacionado) — no caso comum nem é renderizado. Faz uma única tentativa,
 * é não-bloqueante e não renderiza nada (zero custo visual).
 */
export function AccountSyncTracker() {
  const startedRef = useRef(false);

  useEffect(() => {
    // StrictMode roda o effect duas vezes (mount → cleanup → mount)
    if (startedRef.current) return;
    startedRef.current = true;

    void syncCurrentAccountAction().catch((e) => {
      // Ex.: Server Action trocada após deploy — nunca derruba a página
      console.error("[account-sync] sincronização falhou (não bloqueante):", e);
    });
  }, []);

  return null;
}

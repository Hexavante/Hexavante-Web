"use client";

import { useCallback, useRef } from "react";
import { useToast } from "@/components/ui/toast";

const FAILURE_THRESHOLD = 2;

/**
 * Notifica o usuário uma única vez após falhas consecutivas de polling,
 * evitando toasts repetidos a cada intervalo.
 */
export function usePollFeedback(label = "conexão") {
  const { toast } = useToast();
  const failuresRef = useRef(0);
  const notifiedRef = useRef(false);

  const onSuccess = useCallback(() => {
    if (failuresRef.current > 0) {
      failuresRef.current = 0;
      notifiedRef.current = false;
    }
  }, []);

  const onFailure = useCallback(() => {
    failuresRef.current += 1;
    if (failuresRef.current >= FAILURE_THRESHOLD && !notifiedRef.current) {
      notifiedRef.current = true;
      toast(`Problema de ${label}. Tentando reconectar…`, "error");
    }
  }, [label, toast]);

  return { onSuccess, onFailure };
}

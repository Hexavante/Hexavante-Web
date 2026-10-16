"use client";

import { useSyncExternalStore, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Renders children only after mount — avoids SSR/client HTML mismatches. */
export function ClientOnly({ children, fallback = null }: Props) {
  const hydrated = useHydrated();
  if (!hydrated) return fallback;
  return children;
}

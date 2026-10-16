import { PRODUCTION_APP_URL, isLocalDevUrl } from "@/lib/auth-env";

/** URL pública embutida no cliente (build web). */
export const APP_URL = PRODUCTION_APP_URL;

/** Origem pública — no shell nativo sempre produção; na web usa a origem real. */
export function getPublicAppUrl(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    if (origin && !isLocalDevUrl(origin)) {
      return origin;
    }
    if (isNativeShell()) {
      return PRODUCTION_APP_URL;
    }
  }

  return PRODUCTION_APP_URL;
}

export function isTauriDesktop() {
  if (typeof window === "undefined") return false;
  const w = window as Window & { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown };
  return Boolean(w.__TAURI_INTERNALS__ || w.__TAURI__);
}

export function isCapacitorMobile() {
  if (typeof window === "undefined") return false;
  const w = window as Window & { Capacitor?: { isNativePlatform?: () => boolean } };
  return Boolean(w.Capacitor?.isNativePlatform?.());
}

/** Tauri (desktop) ou Capacitor (Android). */
export function isNativeShell() {
  return isTauriDesktop() || isCapacitorMobile();
}

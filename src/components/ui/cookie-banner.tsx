"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const CONSENT_COOKIE = "hx_cookie_consent";
const CONSENT_DURATION_DAYS = 365;

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)hx_cookie_consent=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function writeConsentCookie(value: "accepted" | "declined") {
  const expires = new Date();
  expires.setDate(expires.getDate() + CONSENT_DURATION_DAYS);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = [
    `${CONSENT_COOKIE}=${encodeURIComponent(value)}`,
    `expires=${expires.toUTCString()}`,
    "path=/",
    "SameSite=Lax",
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}

function getConsentVisible(): boolean {
  return !readConsentCookie();
}

function subscribeConsent(callback: () => void) {
  window.addEventListener("hx-cookie-consent-change", callback);
  return () => window.removeEventListener("hx-cookie-consent-change", callback);
}

function notifyConsentChange() {
  window.dispatchEvent(new Event("hx-cookie-consent-change"));
}

export function CookieBanner() {
  const visible = useSyncExternalStore(subscribeConsent, getConsentVisible, () => false);

  if (!visible) return null;

  function handleAccept() {
    writeConsentCookie("accepted");
    notifyConsentChange();
  }

  function handleDecline() {
    writeConsentCookie("declined");
    notifyConsentChange();
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className={cn(
        "hx-cookie-banner",
        "hx-cookie-banner-visible",
        "hx-dark-surface border-t border-white/10 bg-zinc-900/98 shadow-2xl backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
          Usamos cookies essenciais para manter sua sessão e cookies analíticos para melhorar a
          plataforma.{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-2 transition-colors hover:text-white"
          >
            Política de Privacidade
          </Link>
          .
        </p>

        <div className="flex shrink-0 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="min-h-10 flex-1 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:min-h-11 sm:flex-none sm:px-4 sm:text-sm"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="min-h-10 flex-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:min-h-11 sm:flex-none sm:px-4 sm:text-sm"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}

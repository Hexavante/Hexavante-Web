import { AUTH_SESSION_COOKIE_NAMES } from "@/lib/auth-env";
import type { NextResponse } from "next/server";

const SESSION_COOKIE_PREFIXES = [
  "hexavante.session_token",
  "__Secure-hexavante.session_token",
];

function isSessionCookieName(name: string): boolean {
  return SESSION_COOKIE_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}.`));
}

export function listSessionCookieNames(cookieHeader?: string | null): string[] {
  const names = new Set<string>(AUTH_SESSION_COOKIE_NAMES);

  if (!cookieHeader) return [...names];

  for (const part of cookieHeader.split(";")) {
    const name = part.trim().split("=")[0];
    if (name && isSessionCookieName(name)) names.add(name);
  }

  return [...names];
}

export function clearAllSessionCookies(
  response: NextResponse,
  cookieHeader?: string | null,
): NextResponse {
  // Limpa as DUAS variantes: host-only (sem Domain) e de domínio
  // (.hexavante.com.br). Cookies duplicados entre variantes fazem o
  // navegador enviar o velho primeiro, sombreando a sessão válida —
  // foi o que deslogou o app com a landing logada.
  const isProd = process.env.NODE_ENV === "production";
  for (const name of listSessionCookieNames(cookieHeader)) {
    response.cookies.delete(name);
    if (isProd) {
      response.cookies.set(name, "", {
        path: "/",
        domain: ".hexavante.com.br",
        maxAge: 0,
      });
    }
  }
  return response;
}

/** Só cookies de sessão Auth.js — um JWT normal já passa de 6 KB. */
export function getSessionCookiesByteSize(cookieHeader: string | null): number {
  if (!cookieHeader) return 0;

  let size = 0;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq);
    if (!isSessionCookieName(name)) continue;
    size += trimmed.length + 2;
  }
  return size;
}

export function isSessionCookieTooLarge(cookieHeader: string | null): boolean {
  return getSessionCookiesByteSize(cookieHeader) > 24_000;
}

/** Cookie de sessão presente no request (mesmo inválido/expirado). */
export function hasActiveSessionCookie(cookieHeader?: string | null): boolean {
  if (!cookieHeader) return false;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (isSessionCookieName(name) && value.length > 0) return true;
  }

  return false;
}

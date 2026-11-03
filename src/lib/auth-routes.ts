export const AUTH_PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/register",
  "/recuperar-senha",
  "/redefinir-senha",
  "/manutencao",
  "/suspenso",
  "/privacidade",
]);

export const AUTH_PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/oauth",
  "/api/platform/status",
  "/certificados/verificar",
];

export function isPublicAuthRoute(pathname: string): boolean {
  if (AUTH_PUBLIC_EXACT.has(pathname)) return true;
  return AUTH_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function getSafeCallbackUrl(value: string | null | undefined, fallback = "/app"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return fallback;
  return value;
}

/** Navegação GET — Auth.js v5 não suporta /api/auth/signin/[provider]; usa rota dedicada. */
export function buildOAuthSignInHref(
  provider: "google" | "github",
  callbackUrl: string,
): string {
  const params = new URLSearchParams({
    callbackUrl: getSafeCallbackUrl(callbackUrl),
  });
  return `/api/oauth/signin/${provider}?${params.toString()}`;
}

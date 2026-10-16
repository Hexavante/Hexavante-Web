/** Redireciona para login quando a sessão expirou (401 em fetch client-side). */
export function redirectOnUnauthorized(): void {
  if (typeof window === "undefined") return;

  const path = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?callbackUrl=${encodeURIComponent(path)}`;
}

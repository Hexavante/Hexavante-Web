/**
 * URL pública da landing (hexavante.com.br).
 * Fonte única para CTAs que saem do app e vão para o site público.
 *
 * Env: `NEXT_PUBLIC_SITE_URL` (opcional, client e server).
 * Padrão: `https://hexavante.com.br`.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://hexavante.com.br"
).replace(/\/$/, "");

/**
 * Monta uma URL absoluta para a landing: `siteUrl("/ajuda")`
 * → `https://hexavante.com.br/ajuda`. Com caminho vazio devolve a raiz.
 */
export function siteUrl(path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `${SITE_URL}/${clean}` : SITE_URL;
}

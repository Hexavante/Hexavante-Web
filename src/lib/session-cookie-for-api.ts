/** Adapta o cookie host-only local ao contrato HTTPS da API, sem alterar o navegador. */
export function sessionCookieForApi(cookieHeader: string): string {
  if (cookieHeader.split(";").some((part) => part.trim().startsWith("__Secure-hexavante.session_token="))) return cookieHeader;
  return cookieHeader.split(";").map((part) => part.trim().replace(/^hexavante\.session_token=/, "__Secure-hexavante.session_token=")).join("; ");
}

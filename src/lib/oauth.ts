import { getApiUrl } from "@/lib/api-url";

export type OAuthProviders = {
  google?: boolean;
  github?: boolean;
  microsoft?: boolean;
  discord?: boolean;
};

/**
 * Fallback estático (vazio = nenhum provedor).
 * A lista real vem de `GET {API_URL}/oauth/providers` — ver `fetchOAuthProviders()`.
 * Nunca marcar `true` aqui: credenciais vivem na API.
 */
export const oauthProviders: OAuthProviders = {};

const EMPTY_PROVIDERS: OAuthProviders = {};

export function hasOAuthProviders(providers: OAuthProviders = oauthProviders): boolean {
  return Boolean(
    providers.google || providers.github || providers.microsoft || providers.discord,
  );
}

/**
 * Descobre dinamicamente quais provedores OAuth têm credencial configurada na API.
 * Sem provedores, timeout ou erro, degrada para "nenhum" e o login por e-mail
 * continua funcionando normalmente.
 */
export async function fetchOAuthProviders(): Promise<OAuthProviders> {
  try {
    const res = await fetch(`${getApiUrl()}/oauth/providers`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return EMPTY_PROVIDERS;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) return EMPTY_PROVIDERS;

    const data = (await res.json()) as { providers?: Record<string, unknown> };
    const raw = data?.providers;
    if (!raw || typeof raw !== "object") return EMPTY_PROVIDERS;

    return {
      google: raw.google === true,
      github: raw.github === true,
      microsoft: raw.microsoft === true,
      discord: raw.discord === true,
    };
  } catch {
    return EMPTY_PROVIDERS;
  }
}

export const oauthErrorMessages: Record<string, string> = {
  oauth_invalid_state: "Sessão OAuth expirada. Tente novamente.",
  oauth_no_code: "Não foi possível autenticar. Tente novamente.",
  oauth_token_exchange: "Falha ao autenticar com o provedor. Tente novamente.",
  oauth_no_token: "Não foi possível obter credenciais do provedor.",
  oauth_no_email: "O provedor não retornou seu e-mail. Use e-mail e senha.",
  oauth_callback_error: "Erro ao processar autenticação. Tente novamente.",
  oauth_provider_not_found: "Provedor não suportado.",
  provider_not_found: "Provedor não suportado.",
  access_denied: "Você cancelou o acesso. Tente novamente.",
  oauth_access_denied: "Você cancelou o acesso. Tente novamente.",
  oauth_cancelled: "Você cancelou o acesso. Tente novamente.",
  oauth_error: "Não foi possível entrar com a conta social. Tente novamente.",
};

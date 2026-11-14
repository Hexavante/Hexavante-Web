import { SERVER_API_URL } from "@/lib/api-url";

/**
 * Cliente serviço-a-serviço Web → API (`/internal/v1/*`).
 *
 * SÓ PARA CÓDIGO DE SERVIDOR (services, server actions, route handlers): o
 * token dá poder sobre qualquer usuário e nunca pode chegar ao navegador —
 * por isso a env NÃO tem prefixo NEXT_PUBLIC_.
 *
 * As rotas internas são idempotentes (sourceId), então falhas transitórias
 * (rede, 5xx, 429) são repetidas com segurança.
 */

const TIMEOUT_MS = 8_000;
const RETRY_DELAYS_MS = [200, 600];

export class InternalApiError extends Error {
  constructor(
    message: string,
    readonly status: number | "network" | "config",
  ) {
    super(message);
    this.name = "InternalApiError";
  }
}

function getInternalToken(): string {
  const token = process.env.INTERNAL_API_TOKEN?.trim();
  if (!token) {
    throw new InternalApiError("INTERNAL_API_TOKEN não configurado no Web.", "config");
  }
  return token;
}

function isRetryable(status: number | "network"): boolean {
  return status === "network" || status === 429 || (typeof status === "number" && status >= 500);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function internalApiPost<T>(path: string, body: unknown): Promise<T> {
  if (typeof window !== "undefined") {
    throw new InternalApiError("internalApiPost só pode rodar no servidor.", "config");
  }
  const token = getInternalToken();
  let lastError: InternalApiError | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);

    let res: Response;
    try {
      res = await fetch(`${SERVER_API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-token": token },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      lastError = new InternalApiError(
        `Falha de rede em ${path}: ${error instanceof Error ? error.message : String(error)}`,
        "network",
      );
      continue;
    }

    if (res.ok) return (await res.json()) as T;

    const detail = await res.text().catch(() => "");
    lastError = new InternalApiError(`API ${res.status} em ${path}: ${detail.slice(0, 200)}`, res.status);
    if (!isRetryable(res.status)) break;
  }

  throw lastError ?? new InternalApiError(`Falha em ${path}`, "network");
}

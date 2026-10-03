import { SERVER_API_URL } from "@/lib/api-url";

/**
 * Contrato fixo com a API (Hexavante-api) — pagamentos Mercado Pago.
 *
 * GET  /api/v1/payments/catalog        → packs + premium
 * POST /api/v1/payments/checkout       → { checkoutUrl, paymentId }
 * GET  /api/v1/payments/:paymentId     → status do pagamento
 *
 * Preços vêm SEMPRE do catalog — nunca hardcoded no front.
 */

/** productId fixo do plano premium. */
export const PREMIUM_PRODUCT_ID = "hexa_premium";

/** Timeout das chamadas à API (evita travar páginas públicas como /hexa). */
const PAYMENTS_TIMEOUT_MS = 10_000;

export type PaymentPack = {
  id: string;
  coins: number;
  priceBrl: number;
  label: string;
};

export type PremiumPlan = {
  id: string;
  priceBrl: number;
  days: number;
  label: string;
};

export type PaymentsCatalog = {
  packs: PaymentPack[];
  premium: PremiumPlan;
};

export type PaymentStatusValue =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded";

export type PaymentStatusInfo = {
  status: PaymentStatusValue;
  productId: string;
  amountBrl: number;
  coins: number;
  paidAt: string | null;
};

export type CheckoutInfo = {
  checkoutUrl: string;
  paymentId: string;
};

/** HTTP status, ou "network" (falha de conexão) ou "invalid" (resposta não-JSON/incompleta). */
export type PaymentsFetchError = number | "network" | "invalid";

export type PaymentsFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: PaymentsFetchError };

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const integerFormatter = new Intl.NumberFormat("pt-BR");

export function formatBrl(value: number): string {
  return brlFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatCoins(value: number): string {
  return integerFormatter.format(
    Number.isFinite(value) ? Math.trunc(value) : 0,
  );
}

/** Data por extenso em pt-BR ("30 de setembro de 2026") ou null se inválida. */
export function formatLongDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function readJson(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

type PaymentsRequest = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Header `cookie` repassado (ações server-side). */
  cookieHeader?: string;
};

async function paymentsFetch(
  path: string,
  request: PaymentsRequest = {},
): Promise<PaymentsFetchResult<unknown>> {
  try {
    const res = await fetch(`${SERVER_API_URL}${path}`, {
      method: request.method ?? "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(PAYMENTS_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        ...(request.cookieHeader ? { cookie: request.cookieHeader } : {}),
      },
      ...(request.body !== undefined ? { body: JSON.stringify(request.body) } : {}),
    });

    const data = await readJson(res);
    if (!res.ok) return { ok: false, status: res.status };
    if (data === null) return { ok: false, status: "invalid" };
    return { ok: true, data };
  } catch {
    return { ok: false, status: "network" };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizePack(raw: unknown): PaymentPack | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const { id, label, coins, priceBrl } = rec;
  if (typeof id !== "string" || !id) return null;
  if (typeof label !== "string" || !label) return null;
  if (typeof coins !== "number" || typeof priceBrl !== "number") return null;
  return { id, label, coins, priceBrl };
}

function normalizePremium(raw: unknown): PremiumPlan | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const { id, label, priceBrl, days } = rec;
  if (typeof id !== "string" || !id) return null;
  if (typeof label !== "string" || !label) return null;
  if (typeof priceBrl !== "number") return null;
  if (typeof days !== "number") return null;
  return { id, label, priceBrl, days };
}

/** Normaliza status vindos da API (e aliases do Mercado Pago). */
const STATUS_ALIASES: Record<string, PaymentStatusValue> = {
  pending: "pending",
  in_process: "pending",
  authorized: "pending",
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  canceled: "cancelled",
  refunded: "refunded",
};

function normalizeStatus(raw: unknown): PaymentStatusValue | null {
  if (typeof raw !== "string") return null;
  return STATUS_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export async function fetchPaymentsCatalog(
  cookieHeader?: string,
): Promise<PaymentsFetchResult<PaymentsCatalog>> {
  const result = await paymentsFetch("/api/v1/payments/catalog", { cookieHeader });
  if (!result.ok) return result;

  const rec = asRecord(result.data);
  if (!rec) return { ok: false, status: "invalid" };

  const packs = Array.isArray(rec.packs)
    ? rec.packs.map(normalizePack).filter((p): p is PaymentPack => p !== null)
    : null;
  const premium = normalizePremium(rec.premium);
  if (!packs || !premium) return { ok: false, status: "invalid" };

  return { ok: true, data: { packs, premium } };
}

export async function fetchCheckout(
  productId: string,
  cookieHeader?: string,
): Promise<PaymentsFetchResult<CheckoutInfo>> {
  const result = await paymentsFetch("/api/v1/payments/checkout", {
    method: "POST",
    body: { productId },
    cookieHeader,
  });
  if (!result.ok) return result;

  const rec = asRecord(result.data);
  const checkoutUrl = rec?.checkoutUrl;
  const paymentId = rec?.paymentId;
  if (typeof checkoutUrl !== "string" || !checkoutUrl.startsWith("http")) {
    return { ok: false, status: "invalid" };
  }
  if (typeof paymentId !== "string" || !paymentId) {
    return { ok: false, status: "invalid" };
  }
  return { ok: true, data: { checkoutUrl, paymentId } };
}

export async function fetchPaymentStatus(
  paymentId: string,
  cookieHeader?: string,
): Promise<PaymentsFetchResult<PaymentStatusInfo>> {
  const result = await paymentsFetch(
    `/api/v1/payments/${encodeURIComponent(paymentId)}`,
    { cookieHeader },
  );
  if (!result.ok) return result;

  const rec = asRecord(result.data);
  const status = normalizeStatus(rec?.status);
  const productId = rec?.productId;
  if (!status || typeof productId !== "string" || !productId) {
    return { ok: false, status: "invalid" };
  }

  const amountBrl = typeof rec.amountBrl === "number" ? rec.amountBrl : 0;
  const coins = typeof rec.coins === "number" ? rec.coins : 0;
  const paidAt =
    typeof rec.paidAt === "string" || rec.paidAt === null ? rec.paidAt : null;

  return {
    ok: true,
    data: { status, productId, amountBrl, coins, paidAt },
  };
}

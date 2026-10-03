"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  fetchCheckout,
  fetchPaymentStatus,
  fetchPaymentsCatalog,
  type PaymentStatusInfo,
  type PaymentsCatalog,
  type PaymentsFetchError,
} from "@/lib/payments";
import { resolvePremiumState } from "@/services/premium.service";

/**
 * Rotas que exibem moedas/saldo ou estado premium — atualizadas quando um
 * pagamento é aprovado (o cliente também faz router.refresh()).
 */
const AFFECTED_PATHS = ["/app", "/shop", "/perfil", "/hexa", "/inventario"];

export type PaymentsErrorCode =
  | "unauthorized"
  | "not_found"
  | "unavailable"
  | "invalid";

async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const header = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return header || undefined;
}

function mapFailure(
  status: PaymentsFetchError,
  fallback: string,
): { error: string; code: PaymentsErrorCode } {
  if (status === 401) {
    return { error: "Sessão expirada. Faça login novamente.", code: "unauthorized" };
  }
  if (status === 404) {
    return { error: fallback, code: "not_found" };
  }
  if (status === "network") {
    return {
      error: "Não foi possível falar com o servidor de pagamentos. Verifique sua conexão e tente de novo.",
      code: "unavailable",
    };
  }
  if (status === "invalid") {
    return {
      error: "Resposta inválida do servidor de pagamentos. Tente novamente em instantes.",
      code: "invalid",
    };
  }
  if (typeof status === "number" && status === 429) {
    return {
      error: "Muitas tentativas em sequência. Aguarde um instante e tente de novo.",
      code: "unavailable",
    };
  }
  if (typeof status === "number" && status >= 500) {
    return {
      error: "O servidor de pagamentos está indisponível no momento. Tente novamente em instantes.",
      code: "unavailable",
    };
  }
  return { error: "Não foi possível concluir a operação.", code: "invalid" };
}

export type CatalogResult =
  | { success: true; catalog: PaymentsCatalog }
  | { success: false; error: string; code: PaymentsErrorCode };

export type CheckoutResult =
  | { success: true; checkoutUrl: string; paymentId: string }
  | { success: false; error: string; code: PaymentsErrorCode };

export type PaymentStatusResult =
  | { success: true; payment: PaymentStatusInfo }
  | { success: false; error: string; code: PaymentsErrorCode };

/** Catálogo público (packs + premium) — não depende de sessão. */
export async function loadPaymentsCatalogAction(): Promise<CatalogResult> {
  const result = await fetchPaymentsCatalog();
  if (!result.ok) {
    return { success: false, ...mapFailure(result.status, "Catálogo indisponível.") };
  }
  return { success: true, catalog: result.data };
}

/** Gera o checkout no Mercado Pago e devolve a URL de redirecionamento. */
export async function createCheckoutAction(
  productId: string,
): Promise<CheckoutResult> {
  if (typeof productId !== "string" || !productId.trim()) {
    return { success: false, error: "Produto inválido.", code: "invalid" };
  }

  const result = await fetchCheckout(productId.trim(), await getSessionCookie());
  if (!result.ok) {
    return {
      success: false,
      ...mapFailure(result.status, "Este item não está mais disponível para compra."),
    };
  }
  return {
    success: true,
    checkoutUrl: result.data.checkoutUrl,
    paymentId: result.data.paymentId,
  };
}

/** Status de um pagamento (somente o dono, via cookie de sessão). */
export async function getPaymentStatusAction(
  paymentId: string,
): Promise<PaymentStatusResult> {
  if (typeof paymentId !== "string" || !paymentId.trim()) {
    return {
      success: false,
      error: "Pagamento não identificado.",
      code: "not_found",
    };
  }

  const result = await fetchPaymentStatus(paymentId.trim(), await getSessionCookie());
  if (!result.ok) {
    return {
      success: false,
      ...mapFailure(result.status, "Não encontramos esse pagamento."),
    };
  }

  if (result.data.status === "approved") {
    for (const path of AFFECTED_PATHS) revalidatePath(path);
  }

  return { success: true, payment: result.data };
}

export type PremiumSnapshot = {
  success: boolean;
  isActive: boolean;
  expiresAt: string | null;
};

/** Estado premium atualizado (sessão/ banco) — usado após aprovação. */
export async function getPremiumSnapshotAction(): Promise<PremiumSnapshot> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, isActive: false, expiresAt: null };
  }

  const state = await resolvePremiumState(session.user.id, session.user);
  return {
    success: true,
    isActive: state.isActive,
    expiresAt: state.expiresAt ? state.expiresAt.toISOString() : null,
  };
}

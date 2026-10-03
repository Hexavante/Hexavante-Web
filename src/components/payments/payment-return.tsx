"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  getPaymentStatusAction,
  getPremiumSnapshotAction,
  type PaymentsErrorCode,
} from "@/app/actions/payments";
import { redirectOnUnauthorized } from "@/lib/client-auth";
import {
  formatCoins,
  formatLongDate,
  PREMIUM_PRODUCT_ID,
  type PaymentStatusInfo,
} from "@/lib/payments";
import { Button, LinkButton } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 15000;

type Phase =
  | "checking"
  | "approved_coins"
  | "approved_premium"
  | "processing"
  | "failed"
  | "not_found"
  | "error";

type Failure = { error: string; code: PaymentsErrorCode };

type Props = {
  /** external_reference devolvido pelo Mercado Pago (= nosso paymentId). */
  externalReference: string | null;
};

const PRIMARY_LINK_CLASS = "mt-6 flex w-full items-center justify-center";
const SECONDARY_LINK_CLASS = "mt-3 flex w-full items-center justify-center";

/**
 * Retorno do Mercado Pago: consulta o status do pagamento via API,
 * aguarda aprovação (poll ~2s por até 15s) e mostra o resultado.
 */
export function PaymentReturn({ externalReference }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [payment, setPayment] = useState<PaymentStatusInfo | null>(null);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function fail(result: Failure) {
      if (result.code === "unauthorized") {
        redirectOnUnauthorized();
        return;
      }
      if (result.code === "not_found") {
        setPhase("not_found");
        return;
      }
      setErrorMessage(result.error);
      setPhase("error");
    }

    async function finish(info: PaymentStatusInfo) {
      setPayment(info);

      if (info.status !== "approved") {
        setPhase("failed");
        return;
      }

      router.refresh();

      if (info.productId === PREMIUM_PRODUCT_ID) {
        const snapshot = await getPremiumSnapshotAction();
        if (cancelled) return;
        if (snapshot.success) setPremiumExpiresAt(snapshot.expiresAt);
        setPhase("approved_premium");
        return;
      }

      setPhase("approved_coins");
    }

    async function verify() {
      if (!externalReference) {
        setErrorMessage("Não identificamos qual pagamento verificar.");
        setPhase("error");
        return;
      }

      setPhase("checking");
      setErrorMessage(null);

      const first = await getPaymentStatusAction(externalReference);
      if (cancelled) return;
      if (!first.success) {
        fail(first);
        return;
      }
      if (first.payment.status !== "pending") {
        await finish(first.payment);
        return;
      }

      // Aguarda a confirmação do Mercado Pago por até 15s.
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (cancelled) return;

        const next = await getPaymentStatusAction(externalReference);
        if (cancelled) return;
        if (!next.success) {
          fail(next);
          return;
        }
        if (next.payment.status !== "pending") {
          await finish(next.payment);
          return;
        }
      }

      setPayment(first.payment);
      setPhase("processing");
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [externalReference, retryToken, router]);

  const isPremiumPayment = payment?.productId === PREMIUM_PRODUCT_ID;
  const retry = () => setRetryToken((token) => token + 1);

  let content: React.ReactNode = null;

  if (phase === "checking") {
    content = (
      <>
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-400" />
        <h1 className="mt-4 text-xl font-bold hx-text-title">
          Verificando seu pagamento...
        </h1>
        <p className="mt-2 text-sm hx-text-muted">Isso leva poucos segundos.</p>
      </>
    );
  }

  if (phase === "approved_coins") {
    const coins = payment?.coins ?? 0;
    content = (
      <>
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-black hx-text-title">
          {coins > 0
            ? `✅ ${formatCoins(coins)} moedas creditadas!`
            : "✅ Pagamento aprovado!"}
        </h1>
        <p className="mt-2 text-sm hx-text-muted">
          Seu saldo já foi atualizado. Aproveite na loja.
        </p>
        <LinkButton href="/shop" className={PRIMARY_LINK_CLASS}>
          Ir para a loja
        </LinkButton>
      </>
    );
  }

  if (phase === "approved_premium") {
    const expiresAt = formatLongDate(premiumExpiresAt);
    content = (
      <>
        <Crown className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-4 text-2xl font-black hx-text-title">
          {expiresAt ? `✅ Hexa ativado até ${expiresAt}!` : "✅ Hexa ativado!"}
        </h1>
        <p className="mt-2 text-sm hx-text-muted">
          Seu Premium está ativo. Bom estudo!
        </p>
        <LinkButton href="/hexa" className={PRIMARY_LINK_CLASS}>
          Ver meu Hexa
        </LinkButton>
      </>
    );
  }

  if (phase === "processing") {
    content = (
      <>
        <Clock3 className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-4 text-xl font-bold hx-text-title">
          Pagamento em processamento
        </h1>
        <p className="mt-2 text-sm hx-text-muted">
          {isPremiumPayment
            ? "A confirmação chega em instantes e o Hexa é ativado automaticamente."
            : "Pagamento em processamento — as moedas entram em instantes."}
        </p>
        <LinkButton
          href={isPremiumPayment ? "/hexa" : "/shop"}
          className={PRIMARY_LINK_CLASS}
        >
          {isPremiumPayment ? "Ver meu Hexa" : "Ir para a loja"}
        </LinkButton>
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={retry}>
          Verificar novamente
        </Button>
      </>
    );
  }

  if (phase === "failed") {
    const details: Record<string, string> = {
      rejected: "O pagamento foi recusado pela operadora. Você pode tentar de novo.",
      cancelled: "O pagamento foi cancelado antes da confirmação.",
      refunded: "Este pagamento foi reembolsado.",
    };
    content = (
      <>
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h1 className="mt-4 text-xl font-bold hx-text-title">
          Pagamento não concluído
        </h1>
        <p className="mt-2 text-sm hx-text-muted">
          {details[payment?.status ?? ""] ??
            "Não conseguimos concluir esse pagamento."}
        </p>
        <LinkButton
          href={isPremiumPayment ? "/hexa" : "/shop"}
          className={PRIMARY_LINK_CLASS}
        >
          Tentar de novo
        </LinkButton>
        <a
          href="/app"
          className={`hx-btn-secondary ${SECONDARY_LINK_CLASS}`}
        >
          Voltar ao painel
        </a>
      </>
    );
  }

  if (phase === "not_found") {
    content = (
      <>
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-4 text-xl font-bold hx-text-title">
          Pagamento não encontrado
        </h1>
        <p className="mt-2 text-sm hx-text-muted">
          Não localizamos esse pagamento. Se você acabou de pagar, aguarde alguns
          minutos e verifique novamente.
        </p>
        <Button type="button" className="mt-6 w-full" onClick={retry}>
          Verificar novamente
        </Button>
        <LinkButton href="/shop" variant="outline" className={SECONDARY_LINK_CLASS}>
          Ir para a loja
        </LinkButton>
      </>
    );
  }

  if (phase === "error") {
    content = (
      <>
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-4 text-xl font-bold hx-text-title">
          Não foi possível verificar o pagamento
        </h1>
        <p className="mt-2 text-sm hx-text-muted">
          {errorMessage ?? "Tente novamente em instantes."}
        </p>
        {/* Sem external_reference não há o que reconsultar — só ir pra loja. */}
        {externalReference && (
          <Button type="button" className="mt-6 w-full" onClick={retry}>
            Tentar novamente
          </Button>
        )}
        <LinkButton href="/shop" variant="outline" className={SECONDARY_LINK_CLASS}>
          Ir para a loja
        </LinkButton>
      </>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div
        className="hx-card anim-enter w-full max-w-lg p-8 text-center"
        aria-live="polite"
      >
        {content}
      </div>
    </div>
  );
}

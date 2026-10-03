import type { Metadata } from "next";
import { PaymentReturn } from "@/components/payments/payment-return";

export const metadata: Metadata = {
  title: "Pagamento",
  robots: { index: false },
};

type ReturnSearchParams = Promise<{
  external_reference?: string;
  status?: string;
  payment_id?: string;
}>;

/**
 * Retorno do Mercado Pago:
 * /pagamento/retorno?external_reference=<paymentId>&status=<mp_status>
 *
 * Rota pública (pode voltar sem cookie válido) — o client trata 401.
 */
export default async function PagamentoRetornoPage({
  searchParams,
}: {
  searchParams: ReturnSearchParams;
}) {
  const params = await searchParams;
  return <PaymentReturn externalReference={params.external_reference ?? null} />;
}

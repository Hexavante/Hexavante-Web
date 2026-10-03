import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentReturn } from "../payments/payment-return";

const getPaymentStatusAction = vi.fn();
const getPremiumSnapshotAction = vi.fn();
const refresh = vi.fn();
const redirectOnUnauthorized = vi.fn();

vi.mock("@/app/actions/payments", () => ({
  getPaymentStatusAction: (...args: unknown[]) => getPaymentStatusAction(...args),
  getPremiumSnapshotAction: (...args: unknown[]) =>
    getPremiumSnapshotAction(...args),
}));

vi.mock("@/lib/client-auth", () => ({
  redirectOnUnauthorized: () => redirectOnUnauthorized(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function payment(overrides: Record<string, unknown> = {}) {
  return {
    status: "approved",
    productId: "coins_500",
    amountBrl: 19.9,
    coins: 500,
    paidAt: "2026-10-03T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getPremiumSnapshotAction.mockResolvedValue({
    success: true,
    isActive: true,
    expiresAt: null,
  });
});

describe("PaymentReturn", () => {
  it("crédita moedas quando o pagamento é aprovado", async () => {
    getPaymentStatusAction.mockResolvedValue({ success: true, payment: payment() });

    render(<PaymentReturn externalReference="pay_1" />);

    expect(await screen.findByText(/500 moedas creditadas!/)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Ir para a loja" })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  it("ativa o premium e mostra a data de expiração", async () => {
    getPaymentStatusAction.mockResolvedValue({
      success: true,
      payment: payment({ productId: "hexa_premium", coins: 0 }),
    });
    getPremiumSnapshotAction.mockResolvedValue({
      success: true,
      isActive: true,
      expiresAt: "2026-12-31T12:00:00.000Z",
    });

    render(<PaymentReturn externalReference="pay_2" />);

    expect(
      await screen.findByText("✅ Hexa ativado até 31 de dezembro de 2026!"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver meu Hexa" })).toHaveAttribute(
      "href",
      "/hexa",
    );
  });

  it("explica pagamento recusado", async () => {
    getPaymentStatusAction.mockResolvedValue({
      success: true,
      payment: payment({ status: "rejected", coins: 0 }),
    });

    render(<PaymentReturn externalReference="pay_3" />);

    expect(await screen.findByText("Pagamento não concluído")).toBeInTheDocument();
    expect(
      screen.getByText(/O pagamento foi recusado pela operadora/),
    ).toBeInTheDocument();
  });

  it("explica pagamento cancelado", async () => {
    getPaymentStatusAction.mockResolvedValue({
      success: true,
      payment: payment({ status: "cancelled", coins: 0 }),
    });

    render(<PaymentReturn externalReference="pay_4" />);

    expect(await screen.findByText("Pagamento não concluído")).toBeInTheDocument();
    expect(screen.getByText(/foi cancelado antes da confirmação/)).toBeInTheDocument();
  });

  it("fica verificando enquanto pendente e vira 'em processamento' após 15s", async () => {
    vi.useFakeTimers();
    getPaymentStatusAction.mockResolvedValue({
      success: true,
      payment: payment({ status: "pending", coins: 0 }),
    });

    try {
      render(<PaymentReturn externalReference="pay_5" />);

      // Primeira consulta: ainda dentro da janela de polling.
      await vi.advanceTimersByTimeAsync(500);
      expect(screen.getByText(/Verificando seu pagamento/)).toBeInTheDocument();
      expect(getPaymentStatusAction).toHaveBeenCalledTimes(1);

      // Estoura o limite de 15s de polling (~2s por tentativa).
      await vi.advanceTimersByTimeAsync(16_000);
      vi.useRealTimers();
      expect(
        await screen.findByText("Pagamento em processamento"),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("trata 404 da API com 'Pagamento não encontrado'", async () => {
    getPaymentStatusAction.mockResolvedValue({
      success: false,
      error: "Não encontramos esse pagamento.",
      code: "not_found",
    });

    render(<PaymentReturn externalReference="sumiu" />);

    expect(await screen.findByText("Pagamento não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verificar novamente" })).toBeInTheDocument();
  });

  it("mostra mensagem amigável quando a API de pagamentos está fora", async () => {
    getPaymentStatusAction.mockResolvedValue({
      success: false,
      error:
        "Não foi possível falar com o servidor de pagamentos. Verifique sua conexão e tente de novo.",
      code: "unavailable",
    });

    render(<PaymentReturn externalReference="pay_6" />);

    expect(
      await screen.findByText(/servidor de pagamentos/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("sem external_reference não oferece retry inútil", async () => {
    render(<PaymentReturn externalReference={null} />);

    expect(
      await screen.findByText("Não identificamos qual pagamento verificar."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
    expect(getPaymentStatusAction).not.toHaveBeenCalled();
  });

  it("401 leva o usuário pro login preservando o retorno", async () => {
    getPaymentStatusAction.mockResolvedValue({
      success: false,
      error: "Sessão expirada. Faça login novamente.",
      code: "unauthorized",
    });

    render(<PaymentReturn externalReference="pay_7" />);

    await waitFor(() => expect(redirectOnUnauthorized).toHaveBeenCalledTimes(1));
  });
});

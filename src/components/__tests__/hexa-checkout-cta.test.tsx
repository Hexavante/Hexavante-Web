import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HexaCheckoutCta } from "../landing/hexa-checkout-cta";

const createCheckoutAction = vi.fn();
const redirectOnUnauthorized = vi.fn();

vi.mock("@/app/actions/payments", () => ({
  createCheckoutAction: (...args: unknown[]) => createCheckoutAction(...args),
}));

vi.mock("@/lib/client-auth", () => ({
  redirectOnUnauthorized: () => redirectOnUnauthorized(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HexaCheckoutCta", () => {
  it("deslogado leva pro registro com retorno pra /hexa", () => {
    render(
      <HexaCheckoutCta
        isLoggedIn={false}
        isPremiumActive={false}
        premiumExpiresAt={null}
      />,
    );

    const link = screen.getByRole("link", { name: "Começar com Hexa" });
    expect(link).toHaveAttribute("href", "/register?callbackUrl=%2Fhexa");
  });

  it("logado inicia o checkout do plano premium", async () => {
    createCheckoutAction.mockResolvedValue({
      success: true,
      checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/preference",
      paymentId: "pay_1",
    });

    render(
      <HexaCheckoutCta
        isLoggedIn={true}
        isPremiumActive={false}
        premiumExpiresAt={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Assinar Hexa" }));

    await waitFor(() =>
      expect(createCheckoutAction).toHaveBeenCalledWith("hexa_premium"),
    );
  });

  it("já premium mostra o estado ativo sem botão de assinar", () => {
    render(
      <HexaCheckoutCta
        isLoggedIn={true}
        isPremiumActive={true}
        premiumExpiresAt="2026-12-31T12:00:00.000Z"
      />,
    );

    expect(screen.getByText("Você já é Premium ✓")).toBeInTheDocument();
    expect(screen.getByText("Ativo até 31 de dezembro de 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("erro do checkout aparece em pt-BR abaixo do botão", async () => {
    createCheckoutAction.mockResolvedValue({
      success: false,
      error: "O servidor de pagamentos está indisponível no momento. Tente novamente em instantes.",
      code: "unavailable",
    });

    render(
      <HexaCheckoutCta
        isLoggedIn={true}
        isPremiumActive={false}
        premiumExpiresAt={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Assinar Hexa" }));

    expect(
      await screen.findByText(/servidor de pagamentos está indisponível/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assinar Hexa" })).toBeEnabled();
  });
});

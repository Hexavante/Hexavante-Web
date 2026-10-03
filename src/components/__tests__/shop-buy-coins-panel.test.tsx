import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShopBuyCoinsPanel } from "../shop/shop-buy-coins-panel";

const loadPaymentsCatalogAction = vi.fn();
const createCheckoutAction = vi.fn();
const redirectOnUnauthorized = vi.fn();

vi.mock("@/app/actions/payments", () => ({
  loadPaymentsCatalogAction: (...args: unknown[]) =>
    loadPaymentsCatalogAction(...args),
  createCheckoutAction: (...args: unknown[]) => createCheckoutAction(...args),
}));

vi.mock("@/lib/client-auth", () => ({
  redirectOnUnauthorized: () => redirectOnUnauthorized(),
}));

const catalog = {
  packs: [
    { id: "pack_100", coins: 100, priceBrl: 4.9, label: "Pacote Start" },
    { id: "pack_500", coins: 500, priceBrl: 19.9, label: "Pacote Pro" },
  ],
  premium: { id: "hexa_premium", priceBrl: 29, days: 30, label: "Hexa" },
};

beforeEach(() => {
  vi.clearAllMocks();
  loadPaymentsCatalogAction.mockResolvedValue({ success: true, catalog });
});

describe("ShopBuyCoinsPanel", () => {
  it("lista os packs com preço vindo do catálogo", async () => {
    render(<ShopBuyCoinsPanel />);

    expect(await screen.findByText("Pacote Start")).toBeInTheDocument();
    expect(screen.getByText("Pacote Pro")).toBeInTheDocument();
    expect(screen.getByText("R$ 4,90")).toBeInTheDocument();
    expect(screen.getByText("R$ 19,90")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Comprar" })).toHaveLength(2);
  });

  it("mostra erro amigável e botão de retry quando o catálogo falha", async () => {
    loadPaymentsCatalogAction.mockResolvedValue({
      success: false,
      error: "O servidor de pagamentos está indisponível no momento. Tente novamente em instantes.",
      code: "unavailable",
    });

    render(<ShopBuyCoinsPanel />);

    expect(
      await screen.findByText(/servidor de pagamentos está indisponível/),
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: /Tentar novamente/ });
    expect(retry).toBeInTheDocument();

    loadPaymentsCatalogAction.mockResolvedValue({ success: true, catalog });
    fireEvent.click(retry);
    expect(await screen.findByText("Pacote Start")).toBeInTheDocument();
  });

  it("dispara o checkout com o productId do pacote escolhido", async () => {
    createCheckoutAction.mockResolvedValue({
      success: true,
      checkoutUrl: "https://www.mercadopago.com.br/checkout/v1/preference",
      paymentId: "pay_1",
    });

    render(<ShopBuyCoinsPanel />);
    await screen.findByText("Pacote Pro");

    fireEvent.click(screen.getAllByRole("button", { name: "Comprar" })[1]);

    await waitFor(() =>
      expect(createCheckoutAction).toHaveBeenCalledWith("pack_500"),
    );
  });

  it("401 no checkout leva pro login", async () => {
    createCheckoutAction.mockResolvedValue({
      success: false,
      error: "Sessão expirada. Faça login novamente.",
      code: "unauthorized",
    });

    render(<ShopBuyCoinsPanel />);
    await screen.findByText("Pacote Start");

    fireEvent.click(screen.getAllByRole("button", { name: "Comprar" })[0]);

    await waitFor(() => expect(redirectOnUnauthorized).toHaveBeenCalledTimes(1));
  });

  it("erro do checkout aparece na tela sem sair da loja", async () => {
    createCheckoutAction.mockResolvedValue({
      success: false,
      error: "Este item não está mais disponível para compra.",
      code: "not_found",
    });

    render(<ShopBuyCoinsPanel />);
    await screen.findByText("Pacote Start");

    fireEvent.click(screen.getAllByRole("button", { name: "Comprar" })[0]);

    expect(
      await screen.findByText("Este item não está mais disponível para compra."),
    ).toBeInTheDocument();
  });
});

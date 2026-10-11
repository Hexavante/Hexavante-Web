import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeaderGamificationHud } from "../gamification/header-gamification-hud";
import { getUserXpProfile } from "@/services/xp.service";
import { getUserCoinProfile, getUserWallet } from "@/services/wallet.service";

vi.mock("@/services/xp.service", () => ({
  getUserXpProfile: vi.fn(),
}));

vi.mock("@/services/wallet.service", () => ({
  getUserCoinProfile: vi.fn(),
  getUserWallet: vi.fn(),
}));

const mockGetUserXpProfile = vi.mocked(getUserXpProfile);
const mockGetUserCoinProfile = vi.mocked(getUserCoinProfile);
const mockGetUserWallet = vi.mocked(getUserWallet);

describe("HeaderGamificationHud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserCoinProfile.mockResolvedValue({
      coins: 1234,
      boosterMultiplier: 1,
      boosterExpiresAt: null,
    } as never);
    mockGetUserXpProfile.mockResolvedValue({
      level: 7,
      currentXp: 12345,
      totalXp: 99999,
      xpToNextLevel: 50000,
      progressPercent: 25,
    });
  });

  it("deve renderizar moedas e XP com hierarquia clara e valores em pt-BR", async () => {
    const ui = await HeaderGamificationHud({ userId: "user-1" });
    render(ui);

    expect(screen.getByText("Nível 7")).toBeInTheDocument();
    expect(screen.getByText("Nv. 7")).toBeInTheDocument();

    const count = screen.getByText("12.345/50.000 XP");
    expect(count).toBeInTheDocument();
    expect(count).toHaveAttribute("title", "12.345/50.000 XP");

    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1.234" })).toHaveAttribute("href", "/shop");
    expect(
      screen.getByTitle("1.234 moedas — ir para a loja"),
    ).toHaveAttribute("href", "/shop");
    expect(
      screen.getByTitle("Nível 7 — 12.345/50.000 XP (25%)"),
    ).toHaveAttribute("href", "/perfil");
  });

  it("deve expor a barra com aria completo e percentual arredondado 0-100", async () => {
    mockGetUserXpProfile.mockResolvedValue({
      level: 3,
      currentXp: 999,
      totalXp: 1000,
      xpToNextLevel: 300,
      progressPercent: 142.6,
    });

    const ui = await HeaderGamificationHud({ userId: "user-1" });
    render(ui);

    const track = screen.getByRole("progressbar");
    expect(track).toHaveAttribute("aria-valuenow", "100");
    expect(track).toHaveAttribute("aria-valuemin", "0");
    expect(track).toHaveAttribute("aria-valuemax", "100");
    expect(track).toHaveAttribute(
      "aria-label",
      "Nível 3, 100% para o próximo nível",
    );
    expect(track.querySelector(".hx-progress-fill")).toHaveStyle({ width: "100%" });
  });

  it("deve mostrar o % só quando há espaço e manter rótulo compacto de nível", async () => {
    const ui = await HeaderGamificationHud({ userId: "user-1" });
    const { container } = render(ui);

    const percent = container.querySelector(".hx-header-hud-xp-percent");
    expect(percent).not.toBeNull();
    expect(percent).toHaveClass("hidden");
    expect(percent?.className).toMatch(/min-\[420px\]:inline/);

    expect(container.querySelector(".hx-header-hud-xp-level-full")).not.toBeNull();
    expect(container.querySelector(".hx-header-hud-xp-level-short")).not.toBeNull();
    expect(container.querySelector(".hx-header-hud-xp")).not.toBeNull();
  });

  it("deve truncar/abreviar valores gigantes sem sobrepor (nível 1000, 999M/1B)", async () => {
    mockGetUserXpProfile.mockResolvedValue({
      level: 1000,
      currentXp: 999999999,
      totalXp: 1999999999,
      xpToNextLevel: 1000000000,
      progressPercent: 99,
    });

    const ui = await HeaderGamificationHud({ userId: "user-1" });
    const { container } = render(ui);

    // Aria com valor completo, nunca abreviado.
    const track = screen.getByRole("progressbar");
    expect(track).toHaveAttribute("aria-valuenow", "99");
    expect(track).toHaveAttribute("aria-valuemin", "0");
    expect(track).toHaveAttribute("aria-valuemax", "100");
    expect(track).toHaveAttribute(
      "aria-label",
      "Nível 1000, 99% para o próximo nível",
    );
    expect(track).toHaveClass("hx-header-hud-xp-track");
    expect(track.querySelector(".hx-progress-fill")).toHaveStyle({ width: "99%" });

    // Contagem abreviada no visual, completa no title.
    const count = screen.getByText("999,9M/1,00B XP");
    expect(count).toHaveClass("hx-header-hud-xp-count");
    expect(count).toHaveAttribute("title", "999.999.999/1.000.000.000 XP");

    // Nível em linha própria (linha 1), nunca na mesma linha flex da contagem.
    const topRow = container.querySelector(".hx-header-hud-xp-row--top");
    const countRow = container.querySelector(".hx-header-hud-xp-count-row");
    expect(topRow).not.toBeNull();
    expect(countRow).not.toBeNull();
    expect(topRow).not.toContainElement(count as HTMLElement);
    expect(countRow).toContainElement(count as HTMLElement);
    expect(container.querySelector(".hx-header-hud-xp-level")?.textContent).toMatch(
      /1\.000/,
    );

    // Barra em linha própria da grade, sem neon-dot e sem sobrepor texto.
    expect(track.querySelector(".xp-neon-dot")).toBeNull();
    const card = container.querySelector(".hx-header-hud-xp");
    expect(card).not.toBeNull();
    expect(card?.children[2]).toBe(track);

    // % visual decorativo, fora do aria.
    const percent = container.querySelector(".hx-header-hud-xp-percent");
    expect(percent).toHaveAttribute("aria-hidden", "true");

    // Cadeia de truncamento presente em todas as larguras.
    for (const selector of [
      ".hx-header-hud",
      ".hx-header-hud-xp",
      ".hx-header-hud-xp-row--top",
      ".hx-header-hud-xp-level",
      ".hx-header-hud-xp-count-row",
      ".hx-header-hud-xp-count",
      ".hx-header-hud-xp-track",
    ]) {
      expect(
        container.querySelector(selector),
        `deveria existir ${selector}`,
      ).not.toBeNull();
    }
  });

  it("deve exibir estado de erro do XP sem quebrar as moedas", async () => {
    mockGetUserXpProfile.mockRejectedValue(new Error("xp fora do ar"));

    const ui = await HeaderGamificationHud({ userId: "user-1" });
    render(ui);

    const errorLink = screen.getByTitle("XP indisponível");
    expect(errorLink).toHaveAttribute("href", "/perfil");
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("deve exibir estado de erro das moedas sem quebrar o XP", async () => {
    mockGetUserCoinProfile.mockRejectedValue(new Error("wallet fora do ar"));
    mockGetUserWallet.mockRejectedValue(new Error("wallet fora do ar"));

    const ui = await HeaderGamificationHud({ userId: "user-1" });
    render(ui);

    expect(screen.getByTitle("Saldo indisponível")).toHaveAttribute("href", "/shop");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("deve preservar o indicador de booster quando ativo", async () => {
    mockGetUserCoinProfile.mockResolvedValue({
      coins: 500,
      boosterMultiplier: 2,
      boosterExpiresAt: new Date(Date.now() + 60_000),
    } as never);

    const ui = await HeaderGamificationHud({ userId: "user-1" });
    render(ui);

    expect(await screen.findByText("2x")).toBeInTheDocument();
  });
});

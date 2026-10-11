/**
 * Toast global de conquista — dedupe por sessão, empilhamento, fechar
 * manual, aria e host acumulativo.
 *
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AchievementToast, type AchievementToastItem } from "../achievement-toast";
import { AchievementToastHost } from "../achievement-toast-host";
import { dispatchAchievementUnlocked } from "@/lib/achievement-events";

function makeItem(key: string, overrides: Partial<AchievementToastItem> = {}): AchievementToastItem {
  return {
    key,
    title: `Título ${key}`,
    description: `Descrição ${key}`,
    icon: "trophy",
    tier: "gold",
    ...overrides,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AchievementToast", () => {
  it("renderiza selo, título, descrição, tier e aria de alerta", () => {
    render(<AchievementToast achievements={[makeItem("first_lesson")]} />);

    expect(screen.getByText("Nova conquista")).toBeInTheDocument();
    expect(screen.getByText("Título first_lesson")).toBeInTheDocument();
    expect(screen.getByText("Descrição first_lesson")).toBeInTheDocument();
    expect(screen.getByText("Ouro")).toBeInTheDocument();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-label", expect.stringContaining("Título first_lesson"));

    const live = screen.getByRole("status");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveAttribute("aria-label", "Conquistas desbloqueadas");
  });

  it("exibe recompensa XP/moedas somente quando houver valor real", () => {
    const { rerender } = render(
      <AchievementToast achievements={[makeItem("first_lesson")]} />,
    );
    expect(screen.queryByText(/\+.*XP/)).not.toBeInTheDocument();
    expect(screen.queryByText(/moedas/)).not.toBeInTheDocument();

    window.sessionStorage.clear();
    rerender(<AchievementToast achievements={[]} />);
    render(
      <AchievementToast
        achievements={[makeItem("xp_1000", { xpReward: 50, coinReward: 10 })]}
      />,
    );
    expect(screen.getByText(/\+50 XP/)).toBeInTheDocument();
    expect(screen.getByText(/\+10 moedas/)).toBeInTheDocument();
  });

  it("não repete a mesma conquista na mesma sessão (sessionStorage)", () => {
    const { rerender } = render(
      <AchievementToast achievements={[makeItem("first_lesson")]} />,
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);

    // Re-render com a mesma chave (nova referência) não deve duplicar.
    rerender(<AchievementToast achievements={[makeItem("first_lesson")]} />);
    expect(screen.getAllByRole("alert")).toHaveLength(1);

    // Nova montagem na mesma sessão também não repete.
    render(<AchievementToast achievements={[makeItem("first_lesson")]} />);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("empilha até 5 toasts (FIFO visível)", () => {
    const items = Array.from({ length: 6 }, (_, i) => makeItem(`key_${i}`));
    render(<AchievementToast achievements={items} />);
    expect(screen.getAllByRole("alert")).toHaveLength(5);
  });

  it("fecha manualmente ao clicar no botão fechar", () => {
    render(<AchievementToast achievements={[makeItem("first_lesson")]} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", {
      name: "Fechar notificação: Título first_lesson",
    });
    fireEvent.click(closeButton);

    // Saída animada de 250ms antes do dismiss.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("aplica classes de motion-safe/motion-reduce e largura responsiva", () => {
    const { container } = render(
      <AchievementToast achievements={[makeItem("first_lesson")]} />,
    );
    const card = screen.getByRole("alert");
    expect(card.className).toContain("motion-safe:animate-[achievement-slide-in_0.3s_ease-out]");
    expect(card.className).toContain("motion-reduce:animate-none");
    expect(card.className).toContain("max-w-[calc(100vw-2rem)]");
    expect(container.textContent).toContain("Nova conquista");
  });
});

describe("AchievementToastHost", () => {
  it("acumula múltiplos dispatchs em vez de substituir", () => {
    render(<AchievementToastHost />);

    act(() => {
      dispatchAchievementUnlocked(["first_lesson"]);
    });
    expect(screen.getByText("Primeira aula")).toBeInTheDocument();

    act(() => {
      dispatchAchievementUnlocked(["level_5"]);
    });
    // Ambos empilhados.
    expect(screen.getByText("Primeira aula")).toBeInTheDocument();
    expect(screen.getByText("Nível 5")).toBeInTheDocument();
  });

  it("ignora chaves desconhecidas e não quebra", () => {
    render(<AchievementToastHost />);

    act(() => {
      dispatchAchievementUnlocked(["chave_que_nao_existe"]);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => {
      dispatchAchievementUnlocked(["first_lesson", "chave_que_nao_existe"]);
    });
    expect(screen.getByText("Primeira aula")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("respeita o dedupe de sessão do host global", () => {
    render(<AchievementToastHost />);

    act(() => {
      dispatchAchievementUnlocked(["first_lesson"]);
    });
    expect(screen.getAllByRole("alert")).toHaveLength(1);

    act(() => {
      dispatchAchievementUnlocked(["first_lesson"]);
    });
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});

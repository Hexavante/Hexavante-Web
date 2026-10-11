import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { XpProgressBar } from "../gamification/xp-progress-bar";

describe("XpProgressBar", () => {
  const mockProps = {
    level: 5,
    currentXp: 50,
    xpToNextLevel: 100,
    progressPercent: 50,
  };

  it("deve renderizar a barra de XP completa", () => {
    render(<XpProgressBar {...mockProps} />);

    expect(screen.getByText("Nível 5")).toBeInTheDocument();
    expect(screen.getByText("50 / 100 XP")).toBeInTheDocument();
    expect(screen.getByText("50% para o próximo nível")).toBeInTheDocument();
  });

  it("deve renderizar a versão compacta", () => {
    render(<XpProgressBar {...mockProps} compact />);

    expect(screen.getByText("Nível 5")).toBeInTheDocument();
    expect(screen.getByText("50/100 XP")).toBeInTheDocument();
    expect(screen.queryByText("50% para o próximo nível")).not.toBeInTheDocument();
  });

  it("deve ter largura correta da barra de progresso", () => {
    render(<XpProgressBar {...mockProps} />);
    const progressTrack = screen.getByRole("progressbar");
    const progressFill = progressTrack.querySelector(".hx-progress-fill");

    expect(progressFill).toHaveStyle({ width: "50%" });
  });

  it("deve formatar valores grandes em pt-BR sem quebrar o layout", () => {
    render(
      <XpProgressBar
        level={27}
        currentXp={12345}
        xpToNextLevel={50000}
        progressPercent={25}
        compact
      />,
    );

    const count = screen.getByText("12.345/50.000 XP");
    expect(count).toBeInTheDocument();
    expect(count).toHaveClass("truncate");
    expect(count).toHaveClass("tabular-nums");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-label",
      "Nível 27, 25% para o próximo nível",
    );
  });

  it("deve abreviar valores gigantes no compacto com title/aria completos e sem overflow", () => {
    const { container } = render(
      <XpProgressBar
        level={1000}
        currentXp={999999999}
        xpToNextLevel={1000000000}
        progressPercent={99}
        compact
      />,
    );

    const track = screen.getByRole("progressbar");
    expect(track).toHaveAttribute("aria-valuenow", "99");
    expect(track).toHaveAttribute("aria-valuemin", "0");
    expect(track).toHaveAttribute("aria-valuemax", "100");
    expect(track).toHaveAttribute(
      "aria-label",
      "Nível 1000, 99% para o próximo nível",
    );

    const count = screen.getByText("999,9M/1,00B XP");
    expect(count).toHaveAttribute("title", "999.999.999/1.000.000.000 XP");
    expect(count).toHaveClass("truncate");
    expect(count).toHaveClass("tabular-nums");

    const level = screen.getByText("Nível 1.000");
    expect(level).toHaveClass("truncate");

    // Trilho em linha própria, sem neon-dot no compacto, sem estourar.
    expect(track).toHaveClass("hx-progress-track");
    expect(track.querySelector(".xp-neon-dot")).toBeNull();
    expect(track.querySelector(".hx-progress-fill")).toHaveStyle({ width: "99%" });
    expect(track.className).toMatch(/min-w-0/);
    expect(track.className).toMatch(/max-w-full/);
    expect(track.className).toMatch(/overflow-hidden/);
    expect(container.firstElementChild?.className).toMatch(/min-w-0/);
    expect(container.firstElementChild?.className).toMatch(/max-w-full/);
  });

  it("deve abreviar valores gigantes na versão completa mantendo o neon do dashboard", () => {
    render(
      <XpProgressBar
        level={1000}
        currentXp={999999999}
        xpToNextLevel={1000000000}
        progressPercent={100}
      />,
    );

    const count = screen.getByText("999,9M / 1,00B XP");
    expect(count).toHaveAttribute("title", "999.999.999 / 1.000.000.000 XP");
    expect(count).toHaveClass("truncate");

    const track = screen.getByRole("progressbar");
    expect(track).toHaveAttribute("aria-valuenow", "100");
    expect(track).toHaveAttribute(
      "aria-label",
      "Nível 1000, 100% para o próximo nível",
    );
    expect(track.querySelector(".hx-progress-fill")).toHaveStyle({ width: "100%" });
    // Neon-dot reservado ao dashboard/perfil (versão completa).
    expect(track.querySelector(".xp-neon-dot")).not.toBeNull();
  });

  it("deve limitar o percentual ao intervalo 0-100 na barra e no aria", () => {
    const { rerender } = render(<XpProgressBar {...mockProps} progressPercent={150} />);

    let track = screen.getByRole("progressbar");
    expect(track).toHaveAttribute("aria-valuenow", "100");
    expect(track.querySelector(".hx-progress-fill")).toHaveStyle({ width: "100%" });
    expect(screen.getByText("100% para o próximo nível")).toBeInTheDocument();

    rerender(<XpProgressBar {...mockProps} progressPercent={-20} />);
    track = screen.getByRole("progressbar");
    expect(track).toHaveAttribute("aria-valuenow", "0");
    expect(track.querySelector(".hx-progress-fill")).toHaveStyle({ width: "0%" });
  });
});

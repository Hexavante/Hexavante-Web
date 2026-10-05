import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConclusionBrandLogo } from "../conclusion-brand-logo";

// Roda com cwd na raiz do projeto (vitest.config.mjs).
const css = readFileSync(resolve(process.cwd(), "src/styles/animations.css"), "utf8");
const asset = resolve(process.cwd(), "public/brand/conquista-logo.svg");

describe("ConclusionBrandLogo", () => {
  it("deve renderizar a imagem da marca com a classe de conclusão", () => {
    render(<ConclusionBrandLogo />);

    const img = screen.getByRole("img", { name: "Hexavante" });
    expect(img).toHaveAttribute("src", "/brand/conquista-logo.svg");
    expect(img).toHaveClass("hx-conclusao-logo");
  });

  it("deve manter o asset em public/brand com nome sem espaços", () => {
    expect(existsSync(asset)).toBe(true);
    expect(readFileSync(asset, "utf8")).toContain("#1B1B1C");
  });

  it("deve animar a entrada com o keyframe hx-logo-conclusao", () => {
    expect(css).toMatch(/\.hx-conclusao-logo \{[^}]*animation: hx-logo-conclusao/);
    expect(css).toContain("@keyframes hx-logo-conclusao");
  });

  it("deve esconder a logo nos temas claros (gate por data-theme-mode)", () => {
    // O SVG traz fundo #1B1B1C embutido: em tema claro ele não pode aparecer.
    expect(css).toMatch(
      /html\[data-theme-mode="light"\] \.hx-conclusao-logo \{\s*display: none;\s*\}/,
    );
    // Default (temas escuros) fica visível, sem depender de JS.
    expect(css).not.toMatch(/html\[data-theme-mode="dark"\] \.hx-conclusao-logo \{\s*display: none/);
  });
});

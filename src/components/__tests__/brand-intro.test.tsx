/**
 * `BrandIntro` — abertura da marca montada no root layout.
 *
 * Regressões cobertas:
 *  - só monta quando o script inline definiu `data-intro="play"`;
 *  - quem já viu (`data-intro="done"`) não vê nada (sem flash);
 *  - com `data-intro="play"` renderiza a abertura e marca `hx-intro-seen`
 *    no sessionStorage para não repetir na mesma sessão.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandIntro } from "@/components/brand-intro";

const html = document.documentElement;

beforeEach(() => {
  html.removeAttribute("data-intro");
  window.sessionStorage.clear();
});

afterEach(() => {
  html.removeAttribute("data-intro");
  window.sessionStorage.clear();
});

describe("BrandIntro", () => {
  it("não monta quando data-intro não é 'play'", () => {
    html.dataset.intro = "done";

    const { container } = render(<BrandIntro />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/hexavante/i)).not.toBeInTheDocument();
  });

  it("não monta quando o atributo data-intro nem existe", () => {
    const { container } = render(<BrandIntro />);

    expect(container).toBeEmptyDOMElement();
  });

  it("monta a abertura quando data-intro='play' e marca a sessão como vista", () => {
    html.dataset.intro = "play";

    render(<BrandIntro />);

    expect(document.querySelector(".hx-intro")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("hx-intro-seen")).toBe("1");
  });
});

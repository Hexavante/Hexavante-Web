import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BackgroundMusic, parseYouTubeVideoId } from "../background-music";
beforeEach(() => { cleanup(); localStorage.clear(); });
describe("player de estudos", () => {
 it("abre os controles sem iniciar reprodução e restaura volume ao tirar do mudo", () => {
  const { container } = render(<BackgroundMusic />);
  fireEvent.click(screen.getByRole("button", {name:"Música de foco"}));
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.change(screen.getByRole("slider"), {target:{value:"35"}});
  fireEvent.click(screen.getByRole("button", {name:"Silenciar"}));
  expect(screen.getByRole("slider")).toHaveValue("0");
  fireEvent.click(screen.getByRole("button", {name:"Ativar som"}));
  expect(screen.getByRole("slider")).toHaveValue("35");
 });
 it("rejeita links externos sem iniciar reprodução", () => {
  const { container } = render(<BackgroundMusic />);
  fireEvent.click(screen.getByRole("button", {name:"Música de foco"}));
  fireEvent.change(screen.getByLabelText("Sua música, seu ritmo"), {target:{value:"https://example.com/video"}});
  fireEvent.click(screen.getByRole("button", {name:/^Tocar$/}));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(container.querySelector("iframe")).toBeNull();
 });
 it("aceita links do YouTube e rejeita domínios parecidos", () => {
  expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  expect(parseYouTubeVideoId("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
 });
});

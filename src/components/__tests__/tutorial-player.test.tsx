import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TutorialPlayer } from "../tutorials/tutorial-player";
import config from "../../../next.config";
afterEach(() => {cleanup();vi.restoreAllMocks();vi.unstubAllEnvs();});
describe("reprodução dos tutoriais", () => {
 it("libera somente as origens de mídia previstas na política de produção", async () => {
  vi.stubEnv("NODE_ENV","production");
  const rules=await config.headers!();
  const csp=rules[0].headers.find(h=>h.key==="Content-Security-Policy")!.value;
  const media=csp.split(";").find(s=>s.trim().startsWith("media-src"))!;
  expect(media).toContain("https://test-videos.co.uk");
  expect(media).toContain("https://assets.hexavante.com.br");
  expect(media).not.toMatch(/(?:^|\s)(\*|https:)(?:\s|$)/);
 });
 it("usa o protocolo do Vimeo mesmo sem provider explícito", () => {
  const {container}=render(<TutorialPlayer url="https://vimeo.com/123456789" title="Tutorial"/>);
  const frame=container.querySelector("iframe")!;
  const post=vi.spyOn(frame.contentWindow!,"postMessage");
  fireEvent.click(screen.getByRole("button",{name:"Reproduzir vídeo"}));
  expect(post).toHaveBeenCalledWith(JSON.stringify({method:"play"}),"https://player.vimeo.com");
  fireEvent.click(screen.getByRole("button",{name:"Pausar vídeo"}));
  expect(post).toHaveBeenLastCalledWith(JSON.stringify({method:"pause"}),"https://player.vimeo.com");
 });
 it("trata rejeição de play e permite recarregar", async () => {
  vi.spyOn(HTMLMediaElement.prototype,"play").mockRejectedValue(new Error("blocked"));
  const load=vi.spyOn(HTMLMediaElement.prototype,"load").mockImplementation(()=>{});
  render(<TutorialPlayer url="https://test-videos.co.uk/demo.mp4" title="Tutorial"/>);
  fireEvent.click(screen.getByRole("button",{name:"Reproduzir vídeo"}));
  await waitFor(()=>expect(screen.getByRole("alert")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button",{name:"Tentar novamente"}));
  expect(load).toHaveBeenCalledOnce();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
 });
});

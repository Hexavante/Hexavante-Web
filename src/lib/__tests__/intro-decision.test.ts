/**
 * Abertura da marca — decisão do script inline do root layout.
 *
 * Duas camadas, mesmos casos:
 *  1. `shouldPlayIntro` (função pura, usada como especificação);
 *  2. `INTRO_SCRIPT` (o script real que roda no `<head>`), executado aqui com
 *     document/sessionStorage/location falsos para garantir que o inline
 *     continua em sincronia com a função pura.
 */
import { describe, expect, it } from "vitest";
import {
  INTRO_SCRIPT,
  isLandingReferrer,
  shouldPlayIntro,
} from "@/lib/intro-decision";

const WEB_HOST = "app.hexavante.com.br";
const LANDING = "hexavante.com.br";

/** Roda o script real com entradas controladas e devolve o resultado. */
function runScript({
  referrer = "",
  currentHost = WEB_HOST,
  storage = {} as Record<string, string>,
}: {
  referrer?: string;
  currentHost?: string;
  storage?: Record<string, string>;
}) {
  const store = new Map(Object.entries(storage));
  const dataset: Record<string, string> = {};
  const run = new Function("document", "sessionStorage", "location", INTRO_SCRIPT);
  run(
    { referrer, documentElement: { dataset } },
    {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
    },
    { hostname: currentHost },
  );
  return { intro: dataset.intro as string | undefined, storage: { ...Object.fromEntries(store) } };
}

describe("isLandingReferrer", () => {
  it("aceita o domínio da landing e subdomínios", () => {
    expect(isLandingReferrer(LANDING, WEB_HOST)).toBe(true);
    expect(isLandingReferrer("painel.hexavante.com.br", WEB_HOST)).toBe(true);
    expect(isLandingReferrer("app.hexavante.com.br", WEB_HOST)).toBe(false);
  });

  it("rejeita referrer vazio, navegação interna e outros domínios", () => {
    expect(isLandingReferrer("", WEB_HOST)).toBe(false);
    expect(isLandingReferrer(null, WEB_HOST)).toBe(false);
    expect(isLandingReferrer("outrasite.com", WEB_HOST)).toBe(false);
    expect(isLandingReferrer("nao-hexavante.com.br", WEB_HOST)).toBe(false);
  });
});

describe("shouldPlayIntro", () => {
  it("1) sem sessão prévia → play", () => {
    expect(
      shouldPlayIntro({ seen: false, referrerHost: "", currentHost: WEB_HOST, replayKey: null }),
    ).toBe(true);
  });

  it("2) visto + referrer interno → done", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: WEB_HOST,
        currentHost: WEB_HOST,
        replayKey: null,
      }),
    ).toBe(false);
  });

  it("3) visto + referrer hexavante.com.br → play (1ª transição)", () => {
    expect(
      shouldPlayIntro({ seen: true, referrerHost: LANDING, currentHost: WEB_HOST, replayKey: null }),
    ).toBe(true);
  });

  it("4) mesmo referrer-host já consumido na sessão (replayKey) → done", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: LANDING,
        currentHost: WEB_HOST,
        replayKey: LANDING,
      }),
    ).toBe(false);
  });

  it("5) referrer painel.hexavante.com.br → play (outro host de origem)", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: "painel.hexavante.com.br",
        currentHost: WEB_HOST,
        replayKey: LANDING,
      }),
    ).toBe(true);
  });

  it("sem referrer e já visto → done", () => {
    expect(
      shouldPlayIntro({ seen: true, referrerHost: "", currentHost: WEB_HOST, replayKey: null }),
    ).toBe(false);
  });
});

describe("INTRO_SCRIPT (script inline do layout)", () => {
  it("1) sem sessão prévia → play", () => {
    expect(runScript({})).toMatchObject({ intro: "play" });
  });

  it("2) visto + referrer interno → done", () => {
    expect(
      runScript({
        referrer: `https://${WEB_HOST}/cursos`,
        storage: { "hx-intro-seen": "1" },
      }),
    ).toMatchObject({ intro: "done" });
  });

  it("3) visto + referrer da landing → play e registra o replay", () => {
    const { intro, storage } = runScript({
      referrer: `https://${LANDING}/precos`,
      storage: { "hx-intro-seen": "1" },
    });

    expect(intro).toBe("play");
    expect(storage["hx-intro-replay"]).toBe(LANDING);
  });

  it("4) reload com o mesmo referrer-host já consumido → done", () => {
    expect(
      runScript({
        referrer: `https://${LANDING}/precos`,
        storage: { "hx-intro-seen": "1", "hx-intro-replay": LANDING },
      }),
    ).toMatchObject({ intro: "done" });
  });

  it("5) referrer painel.hexavante.com.br com replay da landing → play", () => {
    const { intro, storage } = runScript({
      referrer: "https://painel.hexavante.com.br/",
      storage: { "hx-intro-seen": "1", "hx-intro-replay": LANDING },
    });

    expect(intro).toBe("play");
    expect(storage["hx-intro-replay"]).toBe("painel.hexavante.com.br");
  });

  it("referrer de outro domínio com sessão já vista → done", () => {
    expect(
      runScript({
        referrer: "https://www.google.com/",
        storage: { "hx-intro-seen": "1" },
      }),
    ).toMatchObject({ intro: "done" });
  });

  it("sem referrer mas sem sessão prévia → play", () => {
    expect(runScript({ referrer: "" })).toMatchObject({ intro: "play" });
  });

  it("storage indisponível → done (nunca lança)", () => {
    const dataset: Record<string, string> = {};
    const run = new Function("document", "sessionStorage", "location", INTRO_SCRIPT);
    expect(() =>
      run(
        { referrer: `https://${LANDING}/`, documentElement: { dataset } },
        {
          getItem: () => {
            throw new Error("bloqueado");
          },
          setItem: () => {},
        },
        { hostname: WEB_HOST },
      ),
    ).not.toThrow();
    expect(dataset.intro).toBe("done");
  });
});

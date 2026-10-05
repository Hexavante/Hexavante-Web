/**
 * Abertura da marca — decisão do script inline do root layout.
 *
 * Duas camadas, mesmos casos:
 *  1. `shouldPlayIntro` (função pura, usada como especificação);
 *  2. `INTRO_SCRIPT` (o script real que roda no `<head>`), executado aqui com
 *     document/sessionStorage/location/performance falsos para garantir que o
 *     inline continua em sincronia com a função pura.
 */
import { describe, expect, it } from "vitest";
import {
  INTRO_SCRIPT,
  isLandingReferrer,
  shouldPlayIntro,
} from "@/lib/intro-decision";

const WEB_HOST = "app.hexavante.com.br";
const LANDING = "hexavante.com.br";

/** Executa o `INTRO_SCRIPT` real com argumentos falsos arbitrários. */
function execScript(
  documentFake: unknown,
  storageFake: unknown,
  locationFake: unknown,
  performanceFake: unknown,
) {
  const run = new Function(
    "document",
    "sessionStorage",
    "location",
    "performance",
    INTRO_SCRIPT,
  );
  run(documentFake, storageFake, locationFake, performanceFake);
}

/** Roda o script real com entradas controladas e devolve o resultado. */
function runScript({
  referrer = "",
  currentHost = WEB_HOST,
  storage = {} as Record<string, string>,
  navType = "navigate" as string | null,
}: {
  referrer?: string;
  currentHost?: string;
  storage?: Record<string, string>;
  /** `null` simula `performance` sem entradas de navegação (indisponível). */
  navType?: string | null;
}) {
  const store = new Map(Object.entries(storage));
  const dataset: Record<string, string> = {};
  const performanceFake = {
    getEntriesByType: (type: string) =>
      type === "navigation" && navType !== null ? [{ type: navType }] : [],
  };
  execScript(
    { referrer, documentElement: { dataset } },
    {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
    },
    { hostname: currentHost },
    performanceFake,
  );
  return {
    intro: dataset.intro as string | undefined,
    storage: { ...Object.fromEntries(store) },
  };
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
      shouldPlayIntro({
        seen: false,
        referrerHost: "",
        currentHost: WEB_HOST,
        navType: "navigate",
      }),
    ).toBe(true);
  });

  it("2) visto + referrer interno → done", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: WEB_HOST,
        currentHost: WEB_HOST,
        navType: "navigate",
      }),
    ).toBe(false);
  });

  it("3) visto + referrer da landing em navegação nova → play", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: LANDING,
        currentHost: WEB_HOST,
        navType: "navigate",
      }),
    ).toBe(true);
  });

  it("4) visto + referrer da landing em reload (F5) → done", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: LANDING,
        currentHost: WEB_HOST,
        navType: "reload",
      }),
    ).toBe(false);
  });

  it("5) visto + referrer da landing em back_forward → play", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: LANDING,
        currentHost: WEB_HOST,
        navType: "back_forward",
      }),
    ).toBe(true);
  });

  it("6) visto + referrer da landing sem navType (indisponível) → play", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: LANDING,
        currentHost: WEB_HOST,
      }),
    ).toBe(true);
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: LANDING,
        currentHost: WEB_HOST,
        navType: "",
      }),
    ).toBe(true);
  });

  it("7) referrer painel.hexavante.com.br → play (nav nova)", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: "painel.hexavante.com.br",
        currentHost: WEB_HOST,
        navType: "navigate",
      }),
    ).toBe(true);
  });

  it("sem referrer e já visto → done", () => {
    expect(
      shouldPlayIntro({
        seen: true,
        referrerHost: "",
        currentHost: WEB_HOST,
        navType: "navigate",
      }),
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

  it("3) visto + referrer da landing em navegação nova → play, sem gravar replay", () => {
    const { intro, storage } = runScript({
      referrer: `https://${LANDING}/precos`,
      storage: { "hx-intro-seen": "1" },
      navType: "navigate",
    });

    expect(intro).toBe("play");
    expect(storage).not.toHaveProperty("hx-intro-replay");
  });

  it("4) visto + referrer da landing em reload → done", () => {
    expect(
      runScript({
        referrer: `https://${LANDING}/precos`,
        storage: { "hx-intro-seen": "1" },
        navType: "reload",
      }),
    ).toMatchObject({ intro: "done" });
  });

  it("5) visto + referrer da landing em back_forward → play", () => {
    expect(
      runScript({
        referrer: `https://${LANDING}/precos`,
        storage: { "hx-intro-seen": "1" },
        navType: "back_forward",
      }),
    ).toMatchObject({ intro: "play" });
  });

  it("6) referrer painel.hexavante.com.br em navegação nova → play", () => {
    expect(
      runScript({
        referrer: "https://painel.hexavante.com.br/",
        storage: { "hx-intro-seen": "1" },
        navType: "navigate",
      }),
    ).toMatchObject({ intro: "play" });
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

  it("performance sem entrada de navegação → conta como nav nova e play", () => {
    expect(
      runScript({
        referrer: `https://${LANDING}/`,
        storage: { "hx-intro-seen": "1" },
        navType: null,
      }),
    ).toMatchObject({ intro: "play" });
  });

  it("performance indisponível (lança) → conta como nav nova e play", () => {
    const dataset: Record<string, string> = {};
    expect(() =>
      execScript(
        { referrer: `https://${LANDING}/`, documentElement: { dataset } },
        { getItem: () => "1", setItem: () => {} },
        { hostname: WEB_HOST },
        undefined,
      ),
    ).not.toThrow();
    expect(dataset.intro).toBe("play");
  });

  it("storage indisponível → done (nunca lança)", () => {
    const dataset: Record<string, string> = {};
    expect(() =>
      execScript(
        { referrer: `https://${LANDING}/`, documentElement: { dataset } },
        {
          getItem: () => {
            throw new Error("bloqueado");
          },
          setItem: () => {},
        },
        { hostname: WEB_HOST },
        {
          getEntriesByType: (type: string) =>
            type === "navigation" ? [{ type: "navigate" }] : [],
        },
      ),
    ).not.toThrow();
    expect(dataset.intro).toBe("done");
  });
});

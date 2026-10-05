/**
 * Regras da abertura da marca (`BrandIntro`), decididas ANTES da primeira
 * pintura pelo script inline do root layout — por isso a lógica também vive
 * aqui, em forma testável: o layout importa `INTRO_SCRIPT` e os testes
 * exercitam tanto a função pura quanto o script real (mesmos casos).
 *
 * Comportamento:
 *  - primeira visita da sessão (sem `hx-intro-seen`) → abre;
 *  - vindo do site de landing (`hexavante.com.br` ou subdomínio, e host
 *    diferente do atual) numa navegação NOVA (`navType !== "reload"`) →
 *    reabre, mesmo já tendo visto na sessão: toda transição landing→web
 *    toca a marca, 1ª, 2ª, 3ª… vez;
 *  - reload com referrer de landing persistente (`navType === "reload"`) →
 *    não repete (F5 não reabre a intro);
 *  - navegação interna (referrer = próprio host), referrer de outro domínio
 *    com sessão já vista, ou sem referrer já visto → não abre.
 *
 * `navType` vem de `performance.getEntriesByType("navigation")[0]?.type`
 * (`"navigate" | "reload" | "back_forward"`); vazio/indisponível é tratado
 * como não-reload (ou seja, pode tocar).
 *
 * Mantenha `INTRO_SCRIPT` e `shouldPlayIntro` em sincronia (o teste de
 * comportamento do script cobre exatamente os casos da função pura).
 */

/** Domínio da landing: vale para ele mesmo e para qualquer subdomínio. */
export const LANDING_HOST = "hexavante.com.br";

/** `sessionStorage` — abertura já vista nesta sessão (gravada pelo BrandIntro). */
export const INTRO_SEEN_KEY = "hx-intro-seen";

/** Hostname do referrer veio do site de landing (e não é navegação interna)? */
export function isLandingReferrer(
  referrerHost: string | null | undefined,
  currentHost: string,
): boolean {
  if (!referrerHost) return false;
  // Navegação interna do próprio app: nunca reabre a intro.
  if (referrerHost === currentHost) return false;
  return (
    referrerHost === LANDING_HOST ||
    referrerHost.endsWith(`.${LANDING_HOST}`)
  );
}

/** Decide se a abertura deve tocar nesta carga (`html[data-intro]`). */
export function shouldPlayIntro(input: {
  /** Usuário já viu a abertura nesta sessão (`hx-intro-seen === "1"`). */
  seen: boolean;
  /** Hostname de `document.referrer` ("" quando não há referrer). */
  referrerHost: string | null;
  /** Hostname atual (`location.hostname`). */
  currentHost: string;
  /**
   * `performance.getEntriesByType("navigation")[0]?.type`
   * (`"navigate" | "reload" | "back_forward"`). `""`/indisponível conta como
   * não-reload.
   */
  navType?: string | null;
}): boolean {
  if (!input.seen) return true;
  const fromLanding = isLandingReferrer(input.referrerHost, input.currentHost);
  return fromLanding && input.navType !== "reload";
}

/**
 * Script bloqueante do `<head>` (roda antes do paint → sem flash).
 * Lê `performance` para distinguir reload (não repete) de navegação nova
 * (toda transição landing→web repete). Não grava nada no `sessionStorage`.
 */
export const INTRO_SCRIPT = `
try{
  var seen=sessionStorage.getItem("hx-intro-seen")==="1";
  var ref=document.referrer?new URL(document.referrer).hostname:"";
  var land=!!ref&&(ref==="hexavante.com.br"||ref.endsWith(".hexavante.com.br"))&&ref!==location.hostname;
  var nav="";try{nav=(performance.getEntriesByType("navigation")[0]||{}).type||""}catch(n){}
  var play=!seen||(land&&nav!=="reload");
  document.documentElement.dataset.intro=play?"play":"done";
}catch(e){document.documentElement.dataset.intro="done"}
`;

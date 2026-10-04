/**
 * Regras da abertura da marca (`BrandIntro`), decididas ANTES da primeira
 * pintura pelo script inline do root layout — por isso a lógica também vive
 * aqui, em forma testável: o layout importa `INTRO_SCRIPT` e os testes
 * exercitam tanto a função pura quanto o script real (mesmos casos).
 *
 * Comportamento:
 *  - primeira visita da sessão (sem `hx-intro-seen`) → abre;
 *  - vindo do site de landing (`hexavante.com.br` ou subdomínio, e host
 *    diferente do atual) → reabre, mesmo já tendo visto na sessão;
 *  - reload da mesma página com referrer externo já consumido → não repete
 *    (host de origem guardado em `hx-intro-replay`);
 *  - navegação interna (referrer = próprio host) ou referrer de outro domínio
 *    com sessão já vista → não abre.
 *
 * Mantenha `INTRO_SCRIPT` e `shouldPlayIntro` em sincronia (o teste de
 * comportamento do script cobre exatamente os casos da função pura).
 */

/** Domínio da landing: vale para ele mesmo e para qualquer subdomínio. */
export const LANDING_HOST = "hexavante.com.br";

/** `sessionStorage` — abertura já vista nesta sessão (gravada pelo BrandIntro). */
export const INTRO_SEEN_KEY = "hx-intro-seen";

/** `sessionStorage` — host de origem de landing cuja transição já foi consumida. */
export const INTRO_REPLAY_KEY = "hx-intro-replay";

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
  /** Valor salvo em `hx-intro-replay` (host de origem já consumido). */
  replayKey: string | null;
}): boolean {
  if (!input.seen) return true;
  const fromLanding = isLandingReferrer(input.referrerHost, input.currentHost);
  return fromLanding && input.referrerHost !== input.replayKey;
}

/**
 * Script bloqueante do `<head>` (roda antes do paint → sem flash).
 * Ele também grava `hx-intro-replay` quando decide `play` por origem de
 * landing, para que o reload seguinte caia em `done`.
 */
export const INTRO_SCRIPT = `
try{
  var seen=sessionStorage.getItem("hx-intro-seen")==="1";
  var ref=document.referrer?new URL(document.referrer).hostname:"";
  var land=!!ref&&(ref==="hexavante.com.br"||ref.endsWith(".hexavante.com.br"))&&ref!==location.hostname;
  var play=!seen||(land&&sessionStorage.getItem("hx-intro-replay")!==ref);
  if(play&&land)sessionStorage.setItem("hx-intro-replay",ref);
  document.documentElement.dataset.intro=play?"play":"done";
}catch(e){document.documentElement.dataset.intro="done"}
`;

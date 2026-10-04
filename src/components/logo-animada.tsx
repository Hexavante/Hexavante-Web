"use client";

/**
 * Logo (cabeça + globo) animada em camadas.
 * Cada camada é um SVG exportado do Figma (mesmo quadro 1024x1024), empilhado
 * e animado por CSS (src/styles/logo-animada.css). Sem dependências.
 *
 * Arquivos esperados em /public/brand/logo/:
 *   escuro/pantera.svg  escuro/emblema.svg  escuro/arco-superior.svg
 *   escuro/arco-inferior.svg  escuro/acabamentos.svg
 *   claro/…  (mesmos nomes, versão branca/vermelha)
 * Opcional: arco-preto.svg (quando o arco grande preto existir no Figma).
 */

type Props = {
  className?: string;
  /** Animação de entrada. false = logo parada (ex.: header). */
  animar?: boolean;
  /** Chamado quando a entrada termina. */
  onTerminar?: () => void;
};

/** Ordem de baixo para cima, igual ao Figma. */
const CAMADAS = [
  "arco-preto", // opcional — remova da lista se não for usar
  "pantera",
  "emblema",
  "arco-superior",
  "arco-inferior",
  "acabamentos",
] as const;

const BASE = "/brand/logo";

function Conjunto({
  tema,
  animar,
  onTerminar,
}: {
  tema: "escuro" | "claro";
  animar: boolean;
  onTerminar?: () => void;
}) {
  return (
    <div className={`hx-logo-set hx-logo-${tema === "escuro" ? "dark" : "light"}`}>
      {CAMADAS.map((nome) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={nome}
          src={`${BASE}/${tema}/${nome}.svg`}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading={tema === "escuro" ? "eager" : "lazy"}
          className={`hx-logo-layer hx-logo-${nome}`}
          data-animar={animar ? "true" : "false"}
          onAnimationEnd={(e) => {
            if (e.animationName === "hx-logo-pop") onTerminar?.();
          }}
        />
      ))}
    </div>
  );
}

export function LogoAnimada({ className, animar = true, onTerminar }: Props) {
  return (
    <div
      className={`hx-logo-anim${className ? ` ${className}` : ""}`}
      role="img"
      aria-label="Hexavante"
    >
      <Conjunto tema="escuro" animar={animar} onTerminar={onTerminar} />
      <Conjunto tema="claro" animar={animar} onTerminar={onTerminar} />
    </div>
  );
}

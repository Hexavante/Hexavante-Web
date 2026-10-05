import { cn } from "@/lib/cn";

/**
 * Selo de conquista da marca — usado quando o usuário conclui um curso ou
 * um simulado (ver `src/styles/animations.css`, bloco `hx-conclusao-logo`).
 *
 * Server-safe (sem "use client"): pode ser importado por páginas e por
 * componentes cliente.
 *
 * ATENÇÃO: o SVG (`public/brand/conquista-logo.svg`) traz o fundo `#1B1B1C`
 * embutido no primeiro path, por isso o gate por tema é OBRIGATÓRIO — em
 * temas claros (Neve, Luz do Dia, Creme, Pérola) a logo não aparece.
 * O gate é CSS puro: `html[data-theme-mode="light"] .hx-conclusao-logo`.
 */
type Props = {
  /** Tamanho definido pelas classes do chamador (ex.: `h-16 w-16`). */
  className?: string;
  alt?: string;
};

export function ConclusionBrandLogo({ className, alt = "Hexavante" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/conquista-logo.svg"
      alt={alt}
      width={1024}
      height={1024}
      draggable={false}
      className={cn("hx-conclusao-logo", className)}
    />
  );
}

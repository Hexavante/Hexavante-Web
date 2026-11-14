import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Mantido por compatibilidade com os pontos de uso — o reveal na rolagem foi removido. */
  delay?: number;
};

export function ScrollReveal({ children, className = "" }: Props) {
  return <div className={className}>{children}</div>;
}

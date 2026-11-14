import type { SVGProps } from "react";

// Desenhos próprios em uma grade de 24px: contornos abertos e detalhe hexagonal.
const drawings: Record<string, string> = {
  "/app": "M12 3 21 8v9l-9 5-9-5V8Z M12 3v9l9 5 M12 12 3 17 M12 12l5-3",
  "/courses": "M12 7C9 4 5 4 3 5v14c3-1 6-1 9 2 3-3 6-3 9-2V5c-2-1-6-1-9 2v14 M6 9l3 1 M15 10l3-1",
  "/historico": "M4 9a8 8 0 1 1 0 7 M4 4v5h5 M12 7v5l4 2",
  "/tutorials": "M5 4h14l2 3v12H3V7Z M3 8h18 M9 11l6 3-6 3Z M7 4l2 4 M14 4l2 4",
  "/anotacoes": "M6 3h12v18H6Z M3 7h5 M3 12h5 M3 17h5 M11 8h4 M11 12h4 M11 16h2",
  "/simulados": "M12 3 20 7v10l-8 4-8-4V7Z M8 12l3 3 5-6",
  "/estatisticas": "M3 19h18 M6 15v-4 M12 15V8 M18 15V4 M4 7l5-3 4 1",
  "/shop": "M5 8h14l2 13H3Z M8 8V6a4 4 0 0 1 8 0v2 M10 13l2-1 2 1v3l-2 1-2-1Z",
  "/inventario": "M12 3 21 8v9l-9 5-9-5V8Z M3 8l9 5 9-5 M12 13v9 M7 5l9 5v4",
  "/live-rooms": "M9 9l7 3-7 3Z M6 6a9 9 0 0 0 0 12 M18 6a9 9 0 0 1 0 12 M3 3a13 13 0 0 0 0 18 M21 3a13 13 0 0 1 0 18",
  "/ranking": "M8 3h8v6a4 4 0 0 1-8 0Z M8 5H4v3a4 4 0 0 0 4 4 M16 5h4v3a4 4 0 0 1-4 4 M12 13v5 M8 21v-3h8v3",
  "/certificados": "M5 3h14v13H5Z M8 7h8 M8 10h4 M12 14l3-2 3 2v4l-3 2-3-2Z M13 20v2l2-1 2 1v-2",
  "/plano-diario": "M5 5h14v16H5Z M8 3v4 M16 3v4 M5 10h14 M8 15l2 2 5-4",
  "/configuracoes": "m12 3 8 5v8l-8 5-8-5V8Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
};

export function NavigationIcon({ href, ...props }: SVGProps<SVGSVGElement> & { href: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={drawings[href] ?? drawings["/configuracoes"]} />
    </svg>
  );
}

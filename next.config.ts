import type { NextConfig } from "next";

// Aplicados em todas as respostas HTML/API pelo Next.js
const SECURITY_HEADERS = [
  // Impede que a página seja carregada em iframes de outros domínios (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Impede que o browser "adivinhe" o MIME type (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla informações de referência enviadas em requisições
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desabilita acesso a câmera, microfone e geolocalização via APIs do browser
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Força HTTPS por 1 ano em produção (ignorado em HTTP/dev)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Política de segurança de conteúdo
  // object-src 'none'     — bloqueia plugins (Flash, Java applets)
  // base-uri 'self'       — impede injeção de <base> apontando para outros domínios
  // frame-ancestors 'none' — reforça X-Frame-Options no nível CSP
  // form-action 'self'    — impede formulários de enviar dados para domínios externos
  {
    key: "Content-Security-Policy",
    value: [
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      // Next.js/React precisam de unsafe-inline/unsafe-eval no cliente;
      // bloqueamos apenas fontes externas não autorizadas.
      // NOTA: upgrade para 'strict-dynamic' pendente de suporte total do Next.js
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // CDN de avatar dos provedores OAuth (foto gravada no banco pela API).
      "img-src 'self' data: blob: https://assets.hexavante.com.br https://cdn.discordapp.com https://media.discordapp.net https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
      "connect-src 'self' https://api.hexavante.com.br wss://api.hexavante.com.br",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://player.vimeo.com https://www.youtube.com https://www.youtube-nocookie.com https://w.soundcloud.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      (process.env.NODE_ENV === "production"
        ? "https://hexavante.com.br"
        : "http://localhost:3000"),
  },
  allowedDevOrigins: ["hexavante.com.br", "www.hexavante.com.br", "26.249.87.48"],
  experimental: {
    serverActions: {
      // 2 MB é suficiente para formulários; uploads de imagem usam Route Handlers dedicados
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // Headers de segurança em dev quebram HMR (Turbopack), RSC fetch e túneis — desligados.
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;

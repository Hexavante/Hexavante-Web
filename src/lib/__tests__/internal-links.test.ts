import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Guarda contra 404s de navegação interna após a unificação do histórico.
// - Monta a tabela de rotas a partir do glob real de page.tsx em src/app
//   (estático, sem mocks de dados — inclui route.ts como endpoint válido).
// - Extrai href / router.push / redirect literais das superfícies principais
//   (painel, sidebar, histórico, simulados, relâmpago, plano diário, social).
// - Falha se algum link apontar para rota inexistente (ex.: /history,
//   /course-history, /exam-history, /comunidade, /courses/x/review).

// Vitest executa com cwd na raiz do projeto (Hexavante/).
const APP_DIR = join(process.cwd(), "src", "app");
const SRC_DIR = join(process.cwd(), "src");

/** Rotas que precisam existir após a unificação do histórico. */
const EXPECTED_ROUTES = [
  "/app",
  "/historico",
  "/courses/history",
  "/simulados/historico",
  "/estatisticas",
  "/desafio-relampago",
  "/plano-diario",
  "/social",
  "/courses",
  "/simulados",
];

/**
 * Aliases que nunca existiram como rota — documenta que links internos devem
 * usar as rotas reais (`/historico?aba=…`, `/social`, `/courses/[slug]`).
 */
const KNOWN_DEAD_ROUTES = ["/history", "/course-history", "/exam-history", "/comunidade"];

/** Superfícies varridas em busca de links navegacionais literais. */
const SCAN_FILES = [
  "app/(main)/app/page.tsx",
  "app/(main)/historico/page.tsx",
  "app/(main)/simulados/page.tsx",
  "app/(main)/simulados/[slug]/resultado/[attemptId]/page.tsx",
  "app/(main)/desafio-relampago/page.tsx",
  "app/(main)/plano-diario/page.tsx",
  "components/app-sidebar.tsx",
  "components/historico/atividades-tab.tsx",
  "components/historico/cursos-tab.tsx",
  "components/historico/simulados-tab.tsx",
  "components/home/daily-study-plan.tsx",
  "components/home/dashboard-command-center.tsx",
  "components/home/marquee-shortcuts.tsx",
  "components/home/student-dashboard.tsx",
  "components/lightning/lightning-game.tsx",
  "components/profile/my-journey.tsx",
  "components/social/social-feed.tsx",
  "services/daily-plan.service.ts",
  "services/dashboard-pending.service.ts",
];

type RoutePattern = { segments: (string | null)[]; source: string };

function isGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isDynamic(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

function collectRoutes(dir: string, segments: string[] = [], out: RoutePattern[] = []): RoutePattern[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collectRoutes(join(dir, entry.name), [...segments, entry.name], out);
    } else if (entry.name === "page.tsx" || entry.name === "route.ts") {
      const source = [...segments, entry.name].join("/");
      const pattern = segments.filter((s) => !isGroup(s)).map((s) => (isDynamic(s) ? null : s));
      out.push({ segments: pattern, source });
    }
  }
  return out;
}

function matchesRoute(pathname: string, routes: RoutePattern[]): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const parts = normalized === "/" ? [] : normalized.slice(1).split("/");
  return routes.some(
    (r) => r.segments.length === parts.length && r.segments.every((seg, i) => seg === null || seg === parts[i]),
  );
}

type FoundLink = { href: string; file: string };

/** Extrai links de navegação literais (`href="…"`, `href: "…"`, `router.push("…")`, `redirect("…")`, `action="…"`). */
function extractLinks(file: string, content: string): FoundLink[] {
  const links: FoundLink[] = [];
  const re = /(?:href|router\.push|redirect|action)\s*[:=]\s*["'](\/[^"'`]*)["']/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const href = match[1];
    if (href.includes("${")) continue;
    links.push({ href, file });
    // Valida também o destino embutido em ?callbackUrl=/…
    const cb = /callbackUrl=([^&"'}\s]+)/.exec(href);
    if (cb) {
      try {
        const decoded = decodeURIComponent(cb[1]);
        if (decoded.startsWith("/") && !decoded.includes("${")) {
          links.push({ href: decoded, file: `${file} (callbackUrl)` });
        }
      } catch {
        // callbackUrl malformado: ignorado aqui (login valida em runtime).
      }
    }
  }
  return links;
}

function toPathname(href: string): string {
  const end = href.search(/[?#]/);
  const path = end >= 0 ? href.slice(0, end) : href;
  return path.replace(/\/+$/, "") || "/";
}

describe("links internos x rotas reais", () => {
  const routes = collectRoutes(APP_DIR);

  it("mantém as rotas do painel/histórico acessíveis", () => {
    const missing = EXPECTED_ROUTES.filter((r) => !matchesRoute(r, routes));
    expect(missing, `rotas esperadas sem page.tsx: ${missing.join(", ")}`).toEqual([]);
  });

  it("documenta aliases que nunca existiram como rota", () => {
    const leaked = KNOWN_DEAD_ROUTES.filter((r) => matchesRoute(r, routes));
    expect(leaked, `alias ganhou page.tsx inesperado: ${leaked.join(", ")}`).toEqual([]);
  });

  it("não aponta href principal para rota inexistente", () => {
    const broken: string[] = [];
    for (const file of SCAN_FILES) {
      const content = readFileSync(join(SRC_DIR, file), "utf8");
      for (const { href, file: origin } of extractLinks(file, content)) {
        const pathname = toPathname(href);
        if (!matchesRoute(pathname, routes)) {
          broken.push(`${origin}: ${href}`);
        }
      }
    }
    expect(broken, `links para rotas inexistentes:\n${broken.join("\n")}`).toEqual([]);
  });
});

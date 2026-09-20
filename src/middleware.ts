import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MODERATOR_REQUIRED = /^\/admin(\/|$)/;

const MAINTENANCE_EXEMPT =
  /^\/(manutencao|suspenso|login|register|recuperar-senha|redefinir-senha|hexa|ajuda)(\/|$)/;

const MAINTENANCE_CACHE_TTL_MS = 30_000;
const MAINTENANCE_FETCH_TIMEOUT_MS = 2_000;
let maintenanceCache: { enabled: boolean; at: number } | null = null;

// Server-side API URL (middleware runs on server)
const API_URL =
  process.env.AUTH_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.hexavante.com.br"
    : "http://localhost:3045");

function getInternalOrigin(publicOrigin: string): string {
  const configured = process.env.INTERNAL_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (publicOrigin.includes("localhost") || publicOrigin.includes("127.0.0.1")) {
    return publicOrigin.replace(/\/$/, "");
  }

  const port = process.env.PORT?.trim() || "3000";
  return `http://127.0.0.1:${port}`;
}

function nextWithPathname(req: { headers: Headers; nextUrl: { pathname: string } }) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function cacheMaintenance(enabled: boolean) {
  maintenanceCache = { enabled, at: Date.now() };
  return enabled;
}

async function isMaintenanceEnabled(publicOrigin: string): Promise<boolean> {
  if (maintenanceCache && Date.now() - maintenanceCache.at < MAINTENANCE_CACHE_TTL_MS) {
    return maintenanceCache.enabled;
  }

  const origin = getInternalOrigin(publicOrigin);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAINTENANCE_FETCH_TIMEOUT_MS);
    const res = await fetch(`${origin}/api/platform/status`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return cacheMaintenance(false);

    const data = (await res.json()) as { maintenance?: { enabled?: boolean } };
    return cacheMaintenance(Boolean(data.maintenance?.enabled));
  } catch {
    return cacheMaintenance(false);
  }
}

async function getSessionUser(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

// Janela de race condition: a sessão pode ser revogada entre a verificação
// do middleware e o processamento da rota. As rotas fazem validação própria
// via requireBearerAuth, mitigando o problema.

const APP_HOST = "app.hexavante.com.br";
const ADMIN_HOST = "painel.hexavante.com.br";

function requestHost(req: NextRequest): string {
  const host = (req.headers.get("host") || "").toLowerCase();
  return host.startsWith("[") ? host.slice(1, host.indexOf("]")) : host.split(":")[0];
}

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const hostname = requestHost(req);

  if (pathname.startsWith("/api")) {
    return nextWithPathname(req);
  }

  // Painel de moderação mora em projeto/container próprio — redireciona
  if (
    (pathname === "/admin" || pathname.startsWith("/admin/")) &&
    hostname !== ADMIN_HOST
  ) {
    const url = new URL(pathname + req.nextUrl.search, `https://${ADMIN_HOST}`);
    return NextResponse.redirect(url);
  }

  if (hostname === APP_HOST && pathname === "/") {
    return NextResponse.redirect(new URL("/app", origin));
  }

  const cookieHeader = req.headers.get("cookie");
  const user = await getSessionUser(cookieHeader);
  const isAuthenticated = Boolean(user?.id);

  if (await isMaintenanceEnabled(origin)) {
    if (!MAINTENANCE_EXEMPT.test(pathname)) {
      const maintenanceUrl = new URL("/manutencao", origin);
      return NextResponse.redirect(maintenanceUrl);
    }
  }

  const publicPaths = ["/", "/hexa", "/ajuda", "/login", "/register", "/recuperar-senha", "/redefinir-senha", "/verificar-dispositivo", "/manutencao", "/suspenso", "/tutorials", "/cursos", "/admin-login", "/admin-verificar"];

  // O painel admin usa sessão própria (cookie hx_admin_session). O layout
  // /admin valida de verdade; aqui só deixamos passar quem tem o cookie
  // para não exigir login no app principal antes do login admin.
  const hasAdminCookie = Boolean(req.cookies.get("hx_admin_session")?.value);
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isAuthenticated && !publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (isAdminArea && hasAdminCookie) {
      return nextWithPathname(req);
    }
    const login = new URL("/login", origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isAuthenticated && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    // Modo "adicionar conta": permite abrir o login mesmo logado
    if (req.nextUrl.searchParams.get("addAccount") === "1") {
      return nextWithPathname(req);
    }
    return NextResponse.redirect(new URL("/app", origin));
  }

  if (MODERATOR_REQUIRED.test(pathname) && !pathname.startsWith("/admin-login") && !pathname.startsWith("/admin-verificar") && !user.roles?.some((r: string) => ["ADMIN", "MODERATOR", "SUPERADMIN"].includes(r))) {
    // Com cookie admin, o layout /admin valida a sessão de verdade
    if (isAdminArea && hasAdminCookie) {
      return nextWithPathname(req);
    }
    return NextResponse.redirect(new URL("/app", origin));
  }

  return nextWithPathname(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand|favicon.ico|limpar-sessao|.*\\.(?:png|jpe?g|gif|svg|webp|ico|css|js|txt|pdf|woff2?|mp[34]|webmanifest)$).*)",
  ],
};

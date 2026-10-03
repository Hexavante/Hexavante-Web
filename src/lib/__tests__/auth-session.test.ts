/**
 * Mapeamento da sessão da API → AuthSession em `getApiSession()`.
 *
 * Regressão: `image` ficava fixo em `null` e descartava `user.avatarUrl` da
 * API, então todo consumidor de `auth()` (contas, header da landing) mostrava
 * placeholder mesmo com foto (login OAuth).
 *
 * Resposta da API vem de um servidor HTTP real (nada de mock de fetch);
 * só `next/headers` é mockado, pois `cookies()` exige o request scope do Next.
 *
 * @vitest-environment node
 */
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [{ name: "__Secure-hexavante.session_token", value: "token-teste" }],
    get: () => undefined,
    set: () => {},
    delete: () => {},
  })),
}));

let server: Server;
let baseUrl: string;
let status = 200;
let body: unknown;
let receivedCookie: string | undefined;

function json(res: ServerResponse, code: number, payload: unknown) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    receivedCookie = req.headers.cookie;
    json(res, status, body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("porta inválida");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err?: Error | null) => (err ? reject(err) : resolve())),
  );
});

beforeEach(() => {
  status = 200;
  body = undefined;
  receivedCookie = undefined;
});

async function loadAuthSession() {
  vi.resetModules();
  process.env.AUTH_API_URL = baseUrl;
  return import("@/lib/auth-session");
}

function apiUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    name: "Estudante Teste",
    email: "teste@hexavante.com",
    username: "teste",
    avatarUrl: "https://cdn.discordapp.com/avatars/1/abc.png?size=128",
    roles: ["STUDENT"],
    ...overrides,
  };
}

describe("getApiSession", () => {
  it("expõe o avatarUrl da API em user.image", async () => {
    body = { user: apiUser(), session: { expiresAt: "2030-01-01T00:00:00.000Z" } };
    const { getApiSession } = await loadAuthSession();

    const session = await getApiSession();

    expect(session).not.toBeNull();
    expect(session?.user?.image).toBe(
      "https://cdn.discordapp.com/avatars/1/abc.png?size=128",
    );
    expect(session?.user?.id).toBe("user-1");
    expect(session?.user?.username).toBe("teste");
    expect(session?.user?.roles).toEqual(["STUDENT"]);
  });

  it("mantém image null quando a API não devolve avatar", async () => {
    body = { user: apiUser({ avatarUrl: null }) };
    const { getApiSession } = await loadAuthSession();

    const session = await getApiSession();

    expect(session?.user?.image).toBeNull();
  });

  it("repassa o cookie de sessão para a API", async () => {
    body = { user: apiUser() };
    const { getApiSession } = await loadAuthSession();

    await getApiSession();

    expect(receivedCookie).toContain("__Secure-hexavante.session_token=token-teste");
  });

  it("retorna null quando a API responde 401", async () => {
    status = 401;
    body = { message: "unauthorized" };
    const { getApiSession } = await loadAuthSession();

    expect(await getApiSession()).toBeNull();
  });

  it("retorna null quando a sessão não tem usuário", async () => {
    body = { user: null };
    const { getApiSession } = await loadAuthSession();

    expect(await getApiSession()).toBeNull();
  });
});

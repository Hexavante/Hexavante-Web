/**
 * Sincronização da lista multiconta `hx_accounts` com a sessão atual.
 *
 * Cobre o helper de decisão (`needsAccountSync`), a leitura de cookies
 * (`isAccountSyncPending`) e a `syncCurrentAccountAction` chamada pelo
 * `<AccountSyncTracker />` quando o login veio por OAuth — nesse fluxo a API
 * seta o cookie de sessão sozinha e ninguém passa por `loginAction`.
 *
 * `next/headers` é mockado (cookies() exige o request scope do Next) e o fetch
 * é stubado: a API não precisa estar no ar.
 *
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAccountSyncPending,
  needsAccountSync,
  type LinkedAccount,
} from "@/lib/account-switcher";
import { syncCurrentAccountAction } from "@/app/actions/security";

const SESSION_COOKIE = "__Secure-hexavante.session_token";
const ACCOUNTS_COOKIE = "hx_accounts";

const { jar, sets } = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  sets: [] as { name: string; value: string }[],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => {
      sets.push({ name, value });
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  }),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const contaA: LinkedAccount = {
  userId: "user-a",
  username: "ana",
  name: "Ana",
  avatarUrl: null,
  token: "token-a",
};

const fetchMock = vi.fn();
let errorSpy: ReturnType<typeof vi.spyOn>;

function sessionUser(id: string) {
  return { id, name: "Usuário OAuth", username: "oauth", avatarUrl: null };
}

beforeEach(() => {
  jar.clear();
  sets.length = 0;
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  errorSpy.mockRestore();
});

describe("needsAccountSync (helper de decisão)", () => {
  it("não sincroniza sem token de sessão", () => {
    expect(needsAccountSync(null, [contaA])).toBe(false);
    expect(needsAccountSync(undefined, [])).toBe(false);
    expect(needsAccountSync("", [contaA])).toBe(false);
  });

  it("não sincroniza quando o token atual já está na lista", () => {
    expect(needsAccountSync("token-a", [contaA])).toBe(false);
  });

  it("sincroniza quando a lista está vazia (login OAuth recém-chegado)", () => {
    expect(needsAccountSync("token-oauth", [])).toBe(true);
  });

  it("sincroniza quando o token foi rotacionado (mesmo usuário, outro token)", () => {
    expect(needsAccountSync("token-novo", [contaA])).toBe(true);
  });
});

describe("isAccountSyncPending (leitura dos cookies)", () => {
  it("retorna false sem cookie de sessão", async () => {
    expect(await isAccountSyncPending()).toBe(false);
  });

  it("retorna true com sessão e sem hx_accounts", async () => {
    jar.set(SESSION_COOKIE, "token-oauth");

    expect(await isAccountSyncPending()).toBe(true);
  });

  it("retorna false quando o token atual já está em hx_accounts", async () => {
    jar.set(SESSION_COOKIE, "token-a");
    jar.set(ACCOUNTS_COOKIE, JSON.stringify([contaA]));

    expect(await isAccountSyncPending()).toBe(false);
  });
});

describe("syncCurrentAccountAction", () => {
  it("adiciona a conta da sessão quando o token não está na lista (OAuth)", async () => {
    jar.set(SESSION_COOKIE, "token-oauth");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user: sessionUser("user-oauth") }),
    });

    const result = await syncCurrentAccountAction();

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/auth/session");
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      cookie: `${SESSION_COOKIE}=token-oauth`,
    });
    expect(sets).toHaveLength(1);
    expect(sets[0].name).toBe(ACCOUNTS_COOKIE);
    expect(sets[0].value).toContain('"userId":"user-oauth"');
    expect(sets[0].value).toContain('"token":"token-oauth"');
  });

  it("não faz nada sem cookie de sessão (no-op)", async () => {
    const result = await syncCurrentAccountAction();

    expect(result).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sets).toHaveLength(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("não chama a API quando o token atual já está na lista", async () => {
    jar.set(SESSION_COOKIE, "token-a");
    jar.set(ACCOUNTS_COOKIE, JSON.stringify([contaA]));

    const result = await syncCurrentAccountAction();

    expect(result).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sets).toHaveLength(0);
  });

  it("retorna ok:false quando a API não reconhece a sessão (401)", async () => {
    jar.set(SESSION_COOKIE, "token-expirado");
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "unauthorized" }),
    });

    const result = await syncCurrentAccountAction();

    expect(result).toEqual({ ok: false });
    expect(sets).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[account-sync]"));
  });

  it("nunca lança erro quando o fetch falha (não-bloqueante)", async () => {
    jar.set(SESSION_COOKIE, "token-oauth");
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const result = await syncCurrentAccountAction();

    expect(result).toEqual({ ok: false });
    expect(sets).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[account-sync]"));
  });
});

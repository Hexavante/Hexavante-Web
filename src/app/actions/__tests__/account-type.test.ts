import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [{ name: "hexavante.session_token", value: "abc" }] }),
}));
vi.mock("@/lib/api-url", () => ({ SERVER_API_URL: "http://api.test" }));
import { chooseAccountTypeAction, isAccountTypePending } from "../account-type";

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};
const fetchMock = vi.fn();
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); });
afterEach(() => vi.unstubAllGlobals());

describe("escolha aluno/instrutor no 1º login OAuth", () => {
  it("instrutor vai para o painel de instrutor e manda a sessão para a API", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ roles: ["USER", "INSTRUCTOR"] }), { status: 200 }));
    const result = await chooseAccountTypeAction({ success: false }, form({ accountType: "INSTRUCTOR", next: "/app" }));
    expect(result).toEqual({ success: true, redirectTo: "/instructor/gerenciar" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/auth/account-type");
    expect(JSON.parse(init.body)).toEqual({ accountType: "INSTRUCTOR" });
    expect(init.headers.cookie).toContain("__Secure-hexavante.session_token=abc");
  });

  it("aluno segue para onde ia; destino inseguro vira /app", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await chooseAccountTypeAction({ success: false }, form({ accountType: "STUDENT", next: "/cursos/java" })))
      .toEqual({ success: true, redirectTo: "/cursos/java" });
    expect(await chooseAccountTypeAction({ success: false }, form({ accountType: "STUDENT", next: "//mal.com" })))
      .toEqual({ success: true, redirectTo: "/app" });
  });

  it("valor inválido não chama a API", async () => {
    const result = await chooseAccountTypeAction({ success: false }, form({ accountType: "ADMIN" }));
    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("escolha já feita em outra aba só segue em frente; erro mostra mensagem", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 409 }));
    expect((await chooseAccountTypeAction({ success: false }, form({ accountType: "INSTRUCTOR", next: "/app" }))).redirectTo).toBe("/app");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    expect((await chooseAccountTypeAction({ success: false }, form({ accountType: "STUDENT" }))).error).toMatch(/Tente novamente/);
  });

  it("se a API falhar, não prende ninguém na tela de escolha", async () => {
    fetchMock.mockRejectedValue(new Error("fora"));
    expect(await isAccountTypePending()).toBe(false);
  });
});

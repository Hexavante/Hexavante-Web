// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InternalApiError, internalApiPost } from "@/lib/internal-api";
import { SERVER_API_URL } from "@/lib/api-url";

const ORIGINAL = process.env.INTERNAL_API_TOKEN;
const fetchMock = vi.fn();

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  process.env.INTERNAL_API_TOKEN = "token-de-teste-com-mais-de-32-caracteres";
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  if (ORIGINAL === undefined) delete process.env.INTERNAL_API_TOKEN;
  else process.env.INTERNAL_API_TOKEN = ORIGINAL;
});

describe("internalApiPost", () => {
  it("envia o token no header e o corpo em JSON", async () => {
    fetchMock.mockResolvedValue(json(200, { award: null }));

    await expect(internalApiPost("/internal/v1/x", { a: 1 })).resolves.toEqual({ award: null });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${SERVER_API_URL}/internal/v1/x`);
    expect(init.method).toBe("POST");
    expect(init.headers["x-internal-token"]).toBe("token-de-teste-com-mais-de-32-caracteres");
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
  });

  it("repete em falha de rede e 5xx (rotas idempotentes)", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(json(503, {}))
      .mockResolvedValueOnce(json(200, { ok: true }));

    const pending = internalApiPost("/internal/v1/x", {});
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("não repete erro do cliente (400/401)", async () => {
    fetchMock.mockResolvedValue(json(401, { error: "Token interno inválido." }));

    const pending = internalApiPost("/internal/v1/x", {});
    const assertion = expect(pending).rejects.toMatchObject({ status: 401 });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("desiste após 3 tentativas e lança InternalApiError", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const pending = internalApiPost("/internal/v1/x", {});
    const assertion = expect(pending).rejects.toBeInstanceOf(InternalApiError);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("sem INTERNAL_API_TOKEN → erro de configuração, sem chamar a rede", async () => {
    delete process.env.INTERNAL_API_TOKEN;
    await expect(internalApiPost("/internal/v1/x", {})).rejects.toMatchObject({ status: "config" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

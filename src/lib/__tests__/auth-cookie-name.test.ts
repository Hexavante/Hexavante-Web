import { afterEach, describe, expect, it, vi } from "vitest";
import { getSessionCookieName } from "../auth-cookies";

afterEach(() => vi.unstubAllEnvs());

describe("cookie de sessão por ambiente", () => {
  it("permite sessão em HTTP no desenvolvimento local", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSessionCookieName()).toBe("hexavante.session_token");
  });
  it("preserva o prefixo seguro em produção", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getSessionCookieName()).toBe("__Secure-hexavante.session_token");
  });
});

import { afterEach, expect, it, vi } from "vitest";
import { authProxyHeaders } from "../auth-proxy-headers";
const incoming = vi.hoisted(() => new Headers());
vi.mock("next/headers", () => ({ headers: async () => incoming }));
afterEach(() => { vi.unstubAllEnvs(); incoming.delete("x-real-ip"); incoming.delete("x-forwarded-for"); });
it("só encaminha o IP confirmado por uma entrada confiável", async () => {
  incoming.set("x-real-ip", "192.0.2.7");
  incoming.set("x-forwarded-for", "198.51.100.2");
  vi.stubEnv("AUTH_TRUST_INGRESS_REAL_IP", "false");
  expect(await authProxyHeaders()).toEqual({});
  vi.stubEnv("AUTH_TRUST_INGRESS_REAL_IP", "true");
  expect(await authProxyHeaders()).toEqual({"X-Forwarded-For":"192.0.2.7"});
  incoming.set("x-real-ip", "endereço inválido");
  expect(await authProxyHeaders()).toEqual({});
});

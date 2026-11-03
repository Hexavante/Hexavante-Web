import { isIP } from "node:net";
import { headers } from "next/headers";

/** Ativar apenas quando o proxy de entrada sobrescreve X-Real-IP e é a única entrada do Web. */
export async function authProxyHeaders(): Promise<Record<string, string>> {
  if (process.env.AUTH_TRUST_INGRESS_REAL_IP !== "true") return {};
  const address = (await headers()).get("x-real-ip")?.trim();
  return address && isIP(address) ? { "X-Forwarded-For": address } : {};
}

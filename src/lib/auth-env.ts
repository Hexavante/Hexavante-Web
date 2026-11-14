import { randomBytes } from "node:crypto";

export const PRODUCTION_APP_URL = "https://app.hexavante.com.br";
export const PRODUCTION_API_URL = "https://api.hexavante.com.br";

const DEV_APP_URL = "http://localhost:3000";
const DEV_API_URL = "http://localhost:3045";

function trimUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : undefined;
}

export function isLocalDevUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "10.0.2.2" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
    );
  } catch {
    return true;
  }
}

export function getAuthBaseUrl(): string {
  const explicit =
    trimUrl(process.env.AUTH_URL) ||
    trimUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    trimUrl(process.env.HEXAVANTE_APP_URL);

  if (explicit) {
    if (process.env.NODE_ENV === "production" && isLocalDevUrl(explicit)) {
      return PRODUCTION_APP_URL;
    }
    return explicit;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL;
  }

  return DEV_APP_URL;
}

export function getApiBaseUrl(): string {
  const explicit = trimUrl(process.env.AUTH_API_URL);

  if (explicit) {
    if (process.env.NODE_ENV === "production" && isLocalDevUrl(explicit)) {
      return PRODUCTION_API_URL;
    }
    return explicit;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_API_URL;
  }

  return DEV_API_URL;
}

export function getOAuthCredentials() {
  return {
    googleId: process.env.AUTH_GOOGLE_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim() || "",
    googleSecret:
      process.env.AUTH_GOOGLE_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
  };
}

let cachedDevSecret: string | null = null;

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || "";

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET ausente");
  }

  if (!cachedDevSecret) {
    cachedDevSecret = randomBytes(32).toString("hex");
  }
  return cachedDevSecret;
}

export const AUTH_SESSION_COOKIE_NAMES = [
  "hexavante.session_token",
  "__Secure-hexavante.session_token",
] as const;

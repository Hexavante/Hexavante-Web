"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/auth-session";
import { getAccounts, removeAccount } from "@/lib/account-switcher";

const API_URL = getApiUrl();

const COOKIE_NAMES = [
  "hexavante.session_token",
  "__Secure-hexavante.session_token",
];

export async function signOutAction() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Try to delete session on API (best effort)
  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    });
  } catch {
    // Ignore errors — we'll clear the cookie locally regardless
  }

  // Remove a conta atual da lista multiconta
  try {
    const accounts = await getAccounts();
    const activeToken = cookieStore.get("__Secure-hexavante.session_token")?.value
      ?? cookieStore.get("hexavante.session_token")?.value;
    const current = accounts.find((a) => a.token === activeToken);
    if (current) await removeAccount(current.userId);
  } catch {
    // best effort
  }

  // Limpa as DUAS variantes (host-only e domínio) — ver auth-cookies.ts
  const isProd = process.env.NODE_ENV === "production";
  for (const name of COOKIE_NAMES) {
    cookieStore.delete(name);
    if (isProd) {
      cookieStore.set(name, "", {
        path: "/",
        domain: ".hexavante.com.br",
        maxAge: 0,
      });
    }
  }

  // Se restou outra conta vinculada, ativa ela em vez de deslogar tudo
  try {
    const remaining = await getAccounts();
    if (remaining.length > 0) {
      const { switchAccount } = await import("@/lib/account-switcher");
      const ok = await switchAccount(remaining[0].userId);
      if (ok) redirect("/app");
    }
  } catch {
    // segue para logout total
  }

  const { clearAccounts } = await import("@/lib/account-switcher");
  await clearAccounts();
  redirect("/");
}

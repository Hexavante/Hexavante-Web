"use server";

import { cookies } from "next/headers";
import { SERVER_API_URL } from "@/lib/api-url";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import { sessionCookieForApi } from "@/lib/session-cookie-for-api";

/**
 * Escolha "Aluno ou Instrutor" de quem entrou pela 1ª vez com Google/Discord.
 * A API só aceita uma vez por conta (POST /api/v1/auth/account-type).
 */

export type AccountType = "STUDENT" | "INSTRUCTOR";
export type AccountTypeResult = { success: boolean; error?: string; redirectTo?: string };

async function apiCookieHeader(): Promise<string> {
  const all = (await cookies()).getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  return sessionCookieForApi(all);
}

export async function isAccountTypePending(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_API_URL}/api/v1/auth/account-type`, {
      headers: { cookie: await apiCookieHeader() },
      cache: "no-store",
    });
    if (!res.ok) return false;
    return Boolean(((await res.json()) as { pending?: boolean }).pending);
  } catch {
    return false;
  }
}

/** Para onde ir depois da escolha: instrutor sem destino específico vai ao painel dele. */
export async function destinationAfterChoice(accountType: AccountType, next: string): Promise<string> {
  const safe = getSafeCallbackUrl(next);
  return accountType === "INSTRUCTOR" && ["/", "/app"].includes(safe) ? "/instructor/gerenciar" : safe;
}

export async function chooseAccountTypeAction(
  _prev: AccountTypeResult,
  formData: FormData,
): Promise<AccountTypeResult> {
  const accountType = formData.get("accountType");
  const next = String(formData.get("next") ?? "/app");
  if (accountType !== "STUDENT" && accountType !== "INSTRUCTOR") {
    return { success: false, error: "Escolha uma das opções." };
  }

  try {
    const res = await fetch(`${SERVER_API_URL}/api/v1/auth/account-type`, {
      method: "POST",
      headers: { cookie: await apiCookieHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ accountType }),
      cache: "no-store",
    });
    // 409 = já escolhido (outra aba). Só segue em frente.
    if (res.status === 409) return { success: true, redirectTo: getSafeCallbackUrl(next) };
    if (res.status === 401) return { success: false, error: "Sua sessão expirou. Entre de novo." };
    if (!res.ok) return { success: false, error: "Não foi possível salvar agora. Tente novamente." };
  } catch {
    return { success: false, error: "Não foi possível falar com o servidor. Tente novamente." };
  }

  return { success: true, redirectTo: await destinationAfterChoice(accountType, next) };
}

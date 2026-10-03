"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApiUrl } from "@/lib/auth-session";
import {
  addAccount,
  getAccounts,
  needsAccountSync,
  readSessionToken,
  removeAccount,
  switchAccount,
} from "@/lib/account-switcher";

const API_URL = getApiUrl();

export type SecurityResult = { ok: boolean; error?: string };

async function authedFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", cookie: cookieHeader, ...init?.headers },
    cache: "no-store",
  });
}

export type DeviceInfo = {
  id: string;
  name: string;
  ipAddress: string | null;
  lastSeenAt: string;
  revoked: boolean;
  createdAt: string;
};

export async function getMyDevices(): Promise<{ devices: DeviceInfo[]; currentFingerprintNote: string }> {
  try {
    const res = await authedFetch("/api/v1/users/me/devices");
    if (!res.ok) return { devices: [], currentFingerprintNote: "" };
    const data = (await res.json()) as { devices: DeviceInfo[] };
    return { devices: data.devices ?? [], currentFingerprintNote: "" };
  } catch {
    return { devices: [], currentFingerprintNote: "" };
  }
}

export async function revokeDeviceAction(deviceId: string): Promise<SecurityResult & { signedOut?: boolean }> {
  try {
    const res = await authedFetch(`/api/v1/users/me/devices/${deviceId}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: "Não foi possível remover o dispositivo." };
    const data = (await res.json()) as { currentRevoked?: boolean };
    revalidatePath("/configuracoes/dispositivos");
    if (data.currentRevoked) {
      const cookieStore = await cookies();
      cookieStore.delete("__Secure-hexavante.session_token");
      cookieStore.delete("hexavante.session_token");
      return { ok: true, signedOut: true };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao remover dispositivo." };
  }
}

export type SecurityProfile = {
  twoFactorEnabled: boolean;
  presence: string;
};

export async function getSecurityProfile(): Promise<SecurityProfile> {
  try {
    const res = await authedFetch("/api/v1/users/me");
    if (!res.ok) return { twoFactorEnabled: false, presence: "ONLINE" };
    const data = (await res.json()) as {
      user?: { twoFactorEnabled?: boolean; presence?: string };
    };
    return {
      twoFactorEnabled: Boolean(data.user?.twoFactorEnabled),
      presence: data.user?.presence ?? "ONLINE",
    };
  } catch {
    return { twoFactorEnabled: false, presence: "ONLINE" };
  }
}

export async function setPresenceAction(status: string): Promise<SecurityResult> {
  try {
    const res = await authedFetch("/api/v1/users/me/presence", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { ok: false, error: "Não foi possível atualizar o status." };
    revalidatePath("/configuracoes/seguranca");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao atualizar status." };
  }
}

export async function enableTwoFactorAction(): Promise<SecurityResult & { verificationId?: string }> {
  try {
    const res = await authedFetch("/api/v1/users/me/2fa/enable", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { verificationId?: string; error?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.error ?? data.message ?? "Erro ao ativar 2FA." };
    return { ok: true, verificationId: data.verificationId };
  } catch {
    return { ok: false, error: "Erro ao ativar 2FA." };
  }
}

export async function confirmTwoFactorAction(
  verificationId: string,
  code: string,
): Promise<SecurityResult> {
  try {
    const res = await authedFetch("/api/v1/users/me/2fa/confirm", {
      method: "POST",
      body: JSON.stringify({ verificationId, code }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      return { ok: false, error: data.error ?? data.message ?? "Código inválido." };
    }
    revalidatePath("/configuracoes/seguranca");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao confirmar 2FA." };
  }
}

export async function disableTwoFactorAction(): Promise<SecurityResult> {
  try {
    const res = await authedFetch("/api/v1/users/me/2fa", { method: "DELETE" });
    if (!res.ok) return { ok: false, error: "Não foi possível desativar." };
    revalidatePath("/configuracoes/seguranca");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao desativar 2FA." };
  }
}

export async function switchAccountAction(userId: string) {
  const ok = await switchAccount(userId);
  if (!ok) return;
  redirect("/app");
}

export async function removeAccountAction(userId: string) {
  await removeAccount(userId);
  revalidatePath("/configuracoes/contas");
}

export async function getLinkedAccounts() {
  return getAccounts();
}

/**
 * Sincroniza a sessão atual com a lista multiconta `hx_accounts`.
 *
 * Chamada pelo `<AccountSyncTracker />` (montado no root layout) quando o token
 * de sessão atual ainda não está na lista: é o caso do login OAuth, onde a API
 * seta o cookie sozinha e ninguém passa por `loginAction`/`registerAction`/
 * `verifyDeviceAction`. Não-bloqueante: só loga erro e devolve `{ ok }`.
 */
export async function syncCurrentAccountAction(): Promise<{ ok: boolean }> {
  try {
    const token = await readSessionToken();
    if (!token) return { ok: true };
    if (!needsAccountSync(token, await getAccounts())) return { ok: true };

    const added = await addAccount(token);
    if (!added) {
      // Sessão inválida/expirada ou API fora do ar — nada a sincronizar
      console.error("[account-sync] addAccount não confirmou a sessão atual (não bloqueante).");
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[account-sync] addAccount falhou (não bloqueante):", e);
    return { ok: false };
  }
}

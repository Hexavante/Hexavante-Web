"use server";

import { cookies } from "next/headers";
import { getSessionCookieName } from "@/lib/auth-cookies";
import { getApiUrl } from "@/lib/auth-session";
import { addAccount } from "@/lib/account-switcher";
import { getClientDevice } from "@/lib/client-device";

const API_URL = getApiUrl();

export type DeviceAuthResult = {
  ok: boolean;
  error?: string;
  /** A API confirmou o dispositivo/e-mail, mas a conta exige 2FA. */
  requiresTwoFactor?: boolean;
  verificationId?: string;
};

function sessionCookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    domain: process.env.NODE_ENV === "production" ? ".hexavante.com.br" : undefined,
  };
}

export async function verifyDeviceAction(
  verificationId: string,
  code: string,
): Promise<DeviceAuthResult> {
  try {
    const device = await getClientDevice();
    const res = await fetch(`${API_URL}/api/v1/auth/verify-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationId, code, ...device }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { message?: string }).message ||
        (body as { error?: string }).error ||
        "Código inválido ou expirado.";
      return { ok: false, error: message };
    }

    const data = (await res.json()) as {
      requiresVerification?: boolean;
      verificationId?: string;
      reason?: string;
      user?: { id: string };
      session?: { token: string };
    };

    // Dispositivo/e-mail confirmados, mas falta o código de 2FA.
    // Sem sessão aqui: a API só cria depois do segundo código.
    if (data.requiresVerification && data.verificationId) {
      return {
        ok: false,
        requiresTwoFactor: true,
        verificationId: data.verificationId,
      };
    }

    if (!data.session?.token) {
      return { ok: false, error: "Não foi possível concluir a verificação. Tente novamente." };
    }

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), data.session.token, sessionCookieOpts());
    // Multiconta é conveniência: nunca pode quebrar o login
    try {
      await addAccount(data.session.token);
    } catch (e) {
      console.error("[device-auth] addAccount falhou (não bloqueante):", e);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao verificar" };
  }
}

export async function resendDeviceCodeAction(
  verificationId: string,
): Promise<DeviceAuthResult & { verificationId?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/resend-device-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { message?: string }).message ||
        (body as { error?: string }).error ||
        "Não foi possível reenviar.";
      return { ok: false, error: message };
    }

    const data = (await res.json()) as { verificationId?: string };
    return { ok: true, verificationId: data.verificationId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao reenviar" };
  }
}

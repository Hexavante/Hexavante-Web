"use server";

import { cookies } from "next/headers";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import type { ZodError } from "zod";
import { getApiUrl } from "@/lib/auth-session";
import { addAccount } from "@/lib/account-switcher";
import { getClientDevice } from "@/lib/client-device";

const WEB_ORIGIN =
  process.env.WEB_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://app.hexavante.com.br"
    : "http://localhost:3000");

const ALLOWED_REDIRECT_HOSTS = [
  "hexavante.com.br",
  "app.hexavante.com.br",
  "www.hexavante.com.br",
  "localhost",
  "127.0.0.1",
];

function isSafeRedirect(url: string): boolean {
  if (!url.startsWith("http")) return true;
  try {
    return ALLOWED_REDIRECT_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

function mapZodErrors(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

const API_URL = getApiUrl();

const COOKIE_NAMES = [
  "hexavante.session_token",
  "__Secure-hexavante.session_token",
];

async function clearStaleSessionCookies() {
  const cookieStore = await cookies();
  for (const name of COOKIE_NAMES) {
    cookieStore.delete(name);
  }
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    birthDate: formData.get("birthDate"),
    phone: formData.get("phone") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    terms: formData.get("terms") ? "on" : undefined,
  };
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  if (!isSafeRedirect(callbackUrl)) {
    return { success: false, error: "URL de redirecionamento inválida." };
  }

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Corrija os campos destacados.",
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: WEB_ORIGIN,
      },
      body: JSON.stringify({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
        username: parsed.data.username,
        birthDate: parsed.data.birthDate,
        phone: parsed.data.phone,
        city: parsed.data.city,
        state: parsed.data.state,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { message?: string }).message ||
        (body as { error?: string }).error ||
        "Erro ao cadastrar";
      if ((body as { fieldErrors?: Record<string, string> }).fieldErrors) {
        return {
          success: false,
          error: "Corrija os campos destacados.",
          fieldErrors: (body as { fieldErrors: Record<string, string> }).fieldErrors,
        };
      }
      return { success: false, error: message };
    }

    await clearStaleSessionCookies();

    // After registration, login to get the session cookie
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: WEB_ORIGIN,
      },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        ...(await getClientDevice()),
      }),
    });

    // NOTE: Response.ok é true para 202 — checar o status ANTES de .ok (e ler o body uma vez só)
    if (loginRes.status === 202) {
      const data = await loginRes.json() as { verificationId?: string; reason?: string };
      if (data.verificationId) {
        const motivo = data.reason === "EMAIL_VERIFY" ? "&motivo=email" : data.reason === "TWO_FACTOR" ? "&motivo=2fa" : "";
        return {
          success: true,
          redirectTo: `/verificar-dispositivo?vid=${encodeURIComponent(data.verificationId)}${motivo}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        };
      }
      return { success: false, error: "Não foi possível iniciar a verificação. Tente novamente." };
    }

    if (loginRes.ok) {
      const loginData = await loginRes.json() as {
        session?: { token: string; expiresAt: string };
      };
      if (loginData.session) {
        const cookieStore = await cookies();
        cookieStore.set("__Secure-hexavante.session_token", loginData.session.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7 days
          domain: process.env.NODE_ENV === "production" ? ".hexavante.com.br" : undefined,
        });
        try {
          await addAccount(loginData.session.token);
        } catch (e) {
          console.error("[auth] addAccount falhou (não bloqueante):", e);
        }
      }
    }

    return { success: true, redirectTo: callbackUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao cadastrar",
    };
  }
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  const rememberMe = formData.get("rememberMe") === "on";
  if (!isSafeRedirect(callbackUrl)) {
    return { success: false, error: "URL de redirecionamento inválida." };
  }

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: "Corrija os campos destacados.",
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  await clearStaleSessionCookies();

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: WEB_ORIGIN,
      },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        ...(await getClientDevice()),
      }),
    });

    // NOTE: Response.ok é true para 202 — checar o status ANTES de !res.ok
    if (res.status === 202) {
      const data = await res.json() as { verificationId?: string; reason?: string };
      if (data.verificationId) {
        const motivo = data.reason === "EMAIL_VERIFY" ? "&motivo=email" : data.reason === "TWO_FACTOR" ? "&motivo=2fa" : "";
        return {
          success: true,
          redirectTo: `/verificar-dispositivo?vid=${encodeURIComponent(data.verificationId)}${motivo}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        };
      }
      return { success: false, error: "Não foi possível iniciar a verificação. Tente novamente." };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { message?: string }).message ||
        (body as { error?: string }).error;
      // 401 = credenciais; demais erros mostram a mensagem real da API
      return {
        success: false,
        error: res.status === 401 || !message ? "E-mail ou senha incorretos." : message,
      };
    }

    const data = await res.json() as {
      user: { id: string; name: string; email: string; username: string; roles: string[] };
      session?: { token: string; expiresAt: string };
    };

    if (data.session) {
      const cookieStore = await cookies();
      cookieStore.set("__Secure-hexavante.session_token", data.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        // Sem "Lembrar-me": cookie de sessão (morre ao fechar o navegador)
        ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 } : {}),
        domain: process.env.NODE_ENV === "production" ? ".hexavante.com.br" : undefined,
      });
      try {
        await addAccount(data.session.token);
      } catch (e) {
        console.error("[auth] addAccount falhou (não bloqueante):", e);
      }
    }

    return { success: true, redirectTo: callbackUrl };
  } catch (error) {
    // fetch falhou = API fora do ar ou sem internet (não necessariamente credencial errada)
    const offline =
      error instanceof TypeError ||
      (error instanceof Error && /fetch|network|ECONN|ENOTFOUND|Failed/i.test(error.message));
    return {
      success: false,
      error: offline
        ? "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente."
        : "E-mail ou senha incorretos.",
    };
  }
}

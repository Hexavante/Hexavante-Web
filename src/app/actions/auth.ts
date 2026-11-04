"use server";

import { cookies } from "next/headers";
import { getSessionCookieName } from "@/lib/auth-cookies";
import { hasTeachingRole } from "@/lib/permissions";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import type { ZodError } from "zod";
import { getApiUrl } from "@/lib/auth-session";
import { addAccount } from "@/lib/account-switcher";
import { getClientDevice } from "@/lib/client-device";
import { authProxyHeaders } from "@/lib/auth-proxy-headers";
import { saveRegistrationProfile } from "@/services/registration-profile.service";

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
  if (url.startsWith("/")) return Boolean(getSafeCallbackUrl(url, ""));
  try {
    const target = new URL(url);
    return (target.protocol === "https:" || (process.env.NODE_ENV !== "production" && target.protocol === "http:"))
      && ALLOWED_REDIRECT_HOSTS.includes(target.hostname);
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
    accountType: formData.get("accountType") || "STUDENT",
    studyGoal: formData.get("studyGoal") || undefined,
    studyInterests: formData.get("studyInterests") || undefined,
    instructorMotivation: formData.get("instructorMotivation") || undefined,
    instructorExperience: formData.get("instructorExperience") || undefined,
  };
  const requestedUrl = (formData.get("callbackUrl") as string) || "/";
  const callbackUrl = raw.accountType === "INSTRUCTOR" && ["/", "/app"].includes(requestedUrl)
    ? "/instructor/gerenciar" : requestedUrl;
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

  const resumeLogin = { success: true, redirectTo: "/login?" + new URLSearchParams({ registered: "1", callbackUrl }).toString() };
  let created = false;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        ...(await authProxyHeaders()),
        "Content-Type": "application/json",
        Origin: WEB_ORIGIN,
      },
      body: JSON.stringify({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
        username: parsed.data.username,
        accountType: parsed.data.accountType,
        birthDate: parsed.data.birthDate,
        phone: parsed.data.phone,
        city: parsed.data.city,
        state: parsed.data.state,
      }),
    });

    if (res.status === 429) return { success: false, error: "Muitas tentativas. Aguarde um minuto e tente novamente." };
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

    created = true;
    const registration = await res.json() as { user?: { id: string } };
    if (registration.user?.id) {
      try {
        await saveRegistrationProfile(registration.user.id, parsed.data);
      } catch (error) {
        console.error("[auth] Falha ao salvar preferências de cadastro", error);
      }
    }

    // After registration, login to get the session cookie
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        ...(await authProxyHeaders()),
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
      return resumeLogin;
    }

    if (loginRes.ok) {
      const loginData = await loginRes.json() as {
        user?: { id: string };
        session?: { token: string; expiresAt: string };
      };
      if (!loginData.session?.token) return resumeLogin;
      await clearStaleSessionCookies();
      const cookieStore = await cookies();
      cookieStore.set(getSessionCookieName(), loginData.session.token, {
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

    } else {
      return resumeLogin;
    }

    return { success: true, redirectTo: callbackUrl };
  } catch {
    if (created) return resumeLogin;
    return { success: false, error: "Não foi possível confirmar o cadastro. Tente entrar antes de cadastrar novamente." };
  }
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const requestedUrl = (formData.get("callbackUrl") as string) || "/app";
  const callbackUrl = requestedUrl === "/" ? "/app" : requestedUrl;
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

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        ...(await authProxyHeaders()),
        "Content-Type": "application/json",
        Origin: WEB_ORIGIN,
      },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        ...(await getClientDevice()),
      }),
    });

    if (res.status === 429) return { success: false, error: "Muitas tentativas. Aguarde um minuto e tente novamente." };

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
        error: res.status === 401 ? "E-mail ou senha incorretos." : (typeof message === "string" ? message : "Não foi possível entrar agora. Tente novamente."),
      };
    }

    const data = await res.json() as {
      user: { id: string; name: string; email: string; username: string; roles: string[] };
      session?: { token: string; expiresAt: string };
    };

    if (!data.session?.token) return { success: false, error: "O servidor não confirmou a sessão. Tente entrar novamente." };
    await clearStaleSessionCookies();
    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), data.session.token, {
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

    return { success: true, redirectTo: callbackUrl === "/app" && hasTeachingRole(data.user?.roles) ? "/instructor/gerenciar" : callbackUrl };
  } catch (error) {
    // fetch falhou = API fora do ar ou sem internet (não necessariamente credencial errada)
    const offline =
      error instanceof TypeError ||
      (error instanceof Error && /fetch|network|ECONN|ENOTFOUND|Failed/i.test(error.message));
    return {
      success: false,
      error: offline
        ? "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente."
        : "Não foi possível concluir o login. Tente novamente.",
    };
  }
}

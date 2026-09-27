import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/auth-session";

const ACCOUNTS_COOKIE = "hx_accounts";
const MAX_ACCOUNTS = 5;

export type LinkedAccount = {
  userId: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  token: string;
};

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    domain: process.env.NODE_ENV === "production" ? ".hexavante.com.br" : undefined,
  };
}

export async function getAccounts(): Promise<LinkedAccount[]> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(ACCOUNTS_COOKIE)?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LinkedAccount[];
    return Array.isArray(parsed) ? parsed.filter((a) => a?.token && a?.userId) : [];
  } catch {
    return [];
  }
}

async function saveAccounts(accounts: LinkedAccount[]) {
  const cookieStore = await cookies();
  // Avatares base64 (data:) estouram o header Set-Cookie (nginx 502) — nunca vão para cookie.
  const slim = accounts.slice(0, MAX_ACCOUNTS).map((a) => ({
    ...a,
    avatarUrl: a.avatarUrl?.startsWith("data:") ? null : a.avatarUrl,
  }));
  cookieStore.set(ACCOUNTS_COOKIE, JSON.stringify(slim), cookieOpts());
}

async function fetchUserForToken(token: string) {
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/auth/session`, {
      headers: { cookie: `__Secure-hexavante.session_token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { id: string; name: string; username: string | null; avatarUrl: string | null } | null;
    };
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** Adiciona (ou atualiza) a conta da lista multiconta. Retorna false se o token for inválido. */
export async function addAccount(token: string): Promise<boolean> {
  const user = await fetchUserForToken(token);
  if (!user) return false;
  const accounts = await getAccounts();
  const rest = accounts.filter((a) => a.userId !== user.id);
  await saveAccounts([
    { userId: user.id, username: user.username, name: user.name, avatarUrl: user.avatarUrl, token },
    ...rest,
  ]);
  return true;
}

export async function removeAccount(userId: string) {
  const accounts = await getAccounts();
  await saveAccounts(accounts.filter((a) => a.userId !== userId));
}

/** Troca a sessão ativa para outra conta vinculada. Retorna false se inválida. */
export async function switchAccount(userId: string): Promise<boolean> {
  const accounts = await getAccounts();
  const target = accounts.find((a) => a.userId === userId);
  if (!target) return false;
  const user = await fetchUserForToken(target.token);
  if (!user) {
    await removeAccount(userId);
    return false;
  }
  const cookieStore = await cookies();
  cookieStore.set("__Secure-hexavante.session_token", target.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    domain: process.env.NODE_ENV === "production" ? ".hexavante.com.br" : undefined,
  });
  await saveAccounts([
    { ...target, username: user.username, name: user.name, avatarUrl: user.avatarUrl },
    ...accounts.filter((a) => a.userId !== userId),
  ]);
  return true;
}

export async function clearAccounts() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNTS_COOKIE);
}

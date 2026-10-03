import { cookies } from "next/headers";
import { SERVER_API_URL } from "./api-url";

interface ApiSessionResponse {
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    roles: string[];
    /** Retornados pela API conforme contrato de pagamentos/sessão. */
    isPremium?: boolean;
    premiumExpiresAt?: string | null;
    coins?: number;
  } | null;
  session?: {
    expiresAt: string;
  };
}

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    username: string | null;
    roles: string[];
    isPremium?: boolean;
    premiumExpiresAt?: string | null;
    coins?: number;
  } | null;
  session?: {
    expiresAt: string;
  };
  expires: string;
}

export async function getApiSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${SERVER_API_URL}/api/v1/auth/session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data: ApiSessionResponse = await res.json();
    if (!data.user) return null;

    return {
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: null,
        username: data.user.username,
        roles: data.user.roles,
        isPremium: data.user.isPremium,
        premiumExpiresAt: data.user.premiumExpiresAt ?? null,
        coins: data.user.coins,
      },
      session: data.session,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

// Re-export for backward compatibility
export function getApiUrl(): string { return SERVER_API_URL; }

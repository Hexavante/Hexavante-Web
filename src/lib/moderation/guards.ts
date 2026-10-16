import { auth } from "@/auth";
import { canModerate, isAdmin } from "@/lib/permissions";

export type ModeratorAccount = {
  id: string;
  username: string | null;
  roles: string[];
};

export async function requireModeratorAccount(): Promise<ModeratorAccount> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Faça login para continuar.");
  }
  if (!canModerate(session.user.roles)) {
    throw new Error("Acesso restrito a moderadores e administradores.");
  }
  return {
    id: session.user.id,
    username: session.user.username,
    roles: session.user.roles ?? [],
  };
}

export async function requireAdminAccount(): Promise<ModeratorAccount> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Faça login para continuar.");
  }
  if (!isAdmin(session.user.roles)) {
    throw new Error("Acesso restrito a administradores.");
  }
  return {
    id: session.user.id,
    username: session.user.username,
    roles: session.user.roles ?? [],
  };
}

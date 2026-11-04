"use server";

import { auth } from "@/auth";
import { canModerate } from "@/lib/permissions";
import { requireAdminAccount } from "@/lib/moderation/guards";
import { canManageTarget } from "@/lib/moderation/permissions";
import { prisma } from "@/lib/prisma";
import { updateUserWithRetry } from "@/lib/retry-update";
import { revalidatePath } from "next/cache";

export type ModActionResult = { success: boolean; error?: string; message?: string };

async function requireModerator() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Faça login para continuar.");
  if (!canModerate(session.user.roles)) throw new Error("Sem permissão de moderador.");
  return session.user;
}

function parseDuration(str?: string): Date | null {
  if (!str) return null;
  const match = str.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const ms = unit === "m" ? n * 60_000 : unit === "h" ? n * 3_600_000 : n * 86_400_000;
  return new Date(Date.now() + ms);
}

// ── BAN ──────────────────────────────────────────────────
export async function banUser(userId: string, reason: string): Promise<ModActionResult> {
  try {
    const mod = await requireModerator();
    if (!reason.trim()) return { success: false, error: "Motivo é obrigatório." };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    await prisma.userBan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, liftedAt: new Date(), liftedById: mod.id },
    });
    await prisma.userBan.create({
      data: { userId, moderatorId: mod.id, reason: reason.trim(), isActive: true },
    });
    await prisma.moderationLog.create({
      data: {
        moderatorId: mod.id,
        targetUserId: userId,
        action: "BAN",
        description: `Baniu @${user.username}: ${reason.trim()}`,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: `@${user.username} banido.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao banir" };
  }
}

// ── UNBAN ────────────────────────────────────────────────
export async function unbanUser(userId: string): Promise<ModActionResult> {
  try {
    const mod = await requireAdminAccount();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    await prisma.userBan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, liftedAt: new Date(), liftedById: mod.id },
    });
    await prisma.moderationLog.create({
      data: {
        moderatorId: mod.id,
        targetUserId: userId,
        action: "UNBAN",
        description: `Desbaniu @${user.username}`,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: `@${user.username} desbanido.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao desbanir" };
  }
}

// ── MUTE ─────────────────────────────────────────────────
export async function muteUser(userId: string, reason: string, duration: string): Promise<ModActionResult> {
  try {
    const mod = await requireModerator();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const expiresAt = parseDuration(duration);

    await prisma.userMute.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, liftedAt: new Date(), liftedById: mod.id },
    });
    await prisma.userMute.create({
      data: { userId, moderatorId: mod.id, reason: reason.trim() || "Sem motivo", expiresAt, isActive: true },
    });
    await prisma.moderationLog.create({
      data: {
        moderatorId: mod.id,
        targetUserId: userId,
        action: "MUTE",
        description: `Silenciou @${user.username}: ${reason.trim() || "Sem motivo"}`,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: `@${user.username} silenciado.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao silenciar" };
  }
}

// ── UNMUTE ───────────────────────────────────────────────
export async function unmuteUser(userId: string): Promise<ModActionResult> {
  try {
    const mod = await requireAdminAccount();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    await prisma.userMute.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, liftedAt: new Date(), liftedById: mod.id },
    });
    await prisma.moderationLog.create({
      data: {
        moderatorId: mod.id,
        targetUserId: userId,
        action: "UNMUTE",
        description: `Removeu silêncio de @${user.username}`,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: `Silêncio removido de @${user.username}.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao remover silêncio" };
  }
}

// ── WARN ─────────────────────────────────────────────────
export async function warnUser(userId: string, reason: string): Promise<ModActionResult> {
  try {
    const mod = await requireModerator();
    if (!reason.trim()) return { success: false, error: "Motivo é obrigatório." };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    await prisma.userWarning.create({
      data: { userId, moderatorId: mod.id, reason: reason.trim() },
    });
    await prisma.moderationLog.create({
      data: {
        moderatorId: mod.id,
        targetUserId: userId,
        action: "WARN",
        description: `Avisou @${user.username}: ${reason.trim()}`,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: `Aviso dado a @${user.username}.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao avisar" };
  }
}

// ── DELETE USER (hard delete) ────────────────────────────
export async function deleteUserByAdmin(userId: string): Promise<ModActionResult> {
  try {
    const mod = await requireModerator();

    const username = await prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: {
        username: true, role: true, roles: { select: { role: { select: { name: true } } } },
      } });
      if (!user) throw new Error("Usuário não encontrado.");
      const targetRoles = [user.role.toUpperCase(), ...user.roles.map(r => r.role.name)];
      if (!canManageTarget(mod.roles, targetRoles, mod.id === userId)) {
        throw new Error("Não é permitido excluir essa conta.");
      }
      await tx.moderationLog.create({ data: { moderatorId: mod.id, targetUserId: userId,
        action: "DELETE_USER", description: `Excluiu conta de @${user.username}` } });
      await tx.user.delete({ where: { id: userId } });
      return user.username;
    }, { isolationLevel: "Serializable" });

    revalidatePath("/admin/usuarios");
    return { success: true, message: `Conta de @${username} excluída.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao excluir conta" };
  }
}

// ── DELETE PROFILE (avatar + banner + bio) ───────────────
export async function deleteProfileData(userId: string): Promise<ModActionResult> {
  try {
    const mod = await requireModerator();

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    await updateUserWithRetry(
      { id: userId },
      { avatarUrl: null, bannerUrl: null, bio: null },
    );
    await prisma.moderationLog.create({
      data: {
        moderatorId: mod.id,
        targetUserId: userId,
        action: "DELETE_PROFILE",
        description: `Removeu perfil de @${user.username} (avatar, banner, bio)`,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: `Perfil de @${user.username} limpo.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro ao limpar perfil" };
  }
}

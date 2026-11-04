import { applyXp, xpRequiredForLevel } from "@/lib/gamification";
import { allowedRoleChanges, requireModAction } from "@/lib/moderation/permissions";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/services/notification.service";
import { invalidatePlatformSettingsCache } from "@/services/platform-settings.service";
import type { ModerationLogType, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

export type CommandResult = {
  status: "success" | "error" | "info";
  message: string;
  data?: unknown;
};

const ROLE_ALIASES: Record<string, string> = {
  usuario: "USER",
  user: "USER",
  instrutor: "INSTRUCTOR",
  instructor: "INSTRUCTOR",
  moderador: "MODERATOR",
  moderator: "MODERATOR",
  admin: "ADMIN",
  administrador: "ADMIN",
  superadmin: "SUPERADMIN",
  super: "SUPERADMIN",
  premium: "USER",
};

function parseUsername(raw?: string): string {
  if (!raw) throw new Error("Informe @username.");
  return raw.replace(/^@/, "").trim().toLowerCase();
}

function parseQuoted(text: string): string {
  const match = text.match(/^"([^"]*)"/);
  return match ? match[1] : text.replace(/^["']|["']$/g, "").trim();
}

function parseDuration(raw?: string): Date | null {
  if (!raw) return null;
  const m = raw.match(/^(\d+)(h|d|w)$/i);
  if (!m) throw new Error("Duração inválida. Use ex: 24h, 7d, 1w");
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const ms = unit === "h" ? n * 3600000 : unit === "d" ? n * 86400000 : n * 604800000;
  return new Date(Date.now() + ms);
}

async function findUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      roles: { include: { role: true } },
      xp: true,
      bansReceived: { where: { isActive: true }, take: 1 },
      mutesReceived: { where: { isActive: true }, take: 1 },
      _count: { select: { warningsReceived: true } },
    },
  });
  if (!user) throw new Error(`Usuário @${username} não encontrado.`);
  return user;
}

export async function writeModerationLog(input: {
  moderatorId: string;
  targetUserId?: string | null;
  action: ModerationLogType;
  description: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.moderationLog.create({ data: input });
}

async function adminAdjustXp(
  moderatorId: string,
  roles: string[],
  userId: string,
  username: string,
  delta: number,
  action: "add" | "remove" | "set",
  permission: string,
) {
  requireModAction(permission, roles);

  let userXp = await prisma.userXP.findUnique({ where: { userId } });
  if (!userXp) {
    userXp = await prisma.userXP.create({ data: { userId } });
  }

  const sourceId = `admin-${Date.now()}-${randomBytes(4).toString("hex")}`;
  let newLevel = userXp.level;
  let newCurrent = userXp.currentXp;
  let newTotal = userXp.totalXp;

  if (action === "set") {
    newTotal = Math.max(0, delta);
    newLevel = 1;
    newCurrent = 0;
    while (newCurrent + xpRequiredForLevel(newLevel) <= newTotal && newLevel < 999) {
      newCurrent += xpRequiredForLevel(newLevel);
      newLevel += 1;
    }
    newCurrent = newTotal - newCurrent;
  } else {
    const amount = action === "remove" ? -Math.abs(delta) : Math.abs(delta);
    const applied = applyXp(userXp.level, userXp.currentXp, userXp.totalXp, amount);
    newLevel = applied.level;
    newCurrent = applied.currentXp;
    newTotal = applied.totalXp;
  }

  await prisma.$transaction(async (tx) => {
    await tx.userXP.update({
      where: { userId },
      data: { level: newLevel, currentXp: newCurrent, totalXp: newTotal },
    });
    await tx.xpTransaction.create({
      data: {
        userId,
        amount:
          action === "set"
            ? newTotal - userXp!.totalXp
            : action === "remove"
              ? -Math.abs(delta)
              : Math.abs(delta),
        source: "ADMIN",
        sourceId,
        description: `Ajuste admin (${action})`,
      },
    });
  });

  const logType = action === "set" ? "XP_SET" : action === "remove" ? "XP_REMOVE" : "XP_ADD";
  await writeModerationLog({
    moderatorId,
    targetUserId: userId,
    action: logType,
    description: `${action === "set" ? "Definiu" : action === "remove" ? "Removeu" : "Adicionou"} XP de @${username}`,
    metadata: { delta, total: newTotal },
  });

  return { total: newTotal, level: newLevel };
}

async function adminAdjustCoins(
  moderatorId: string,
  roles: string[],
  userId: string,
  username: string,
  delta: number,
  action: "add" | "remove" | "set",
  permission: string,
) {
  requireModAction(permission, roles);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
  if (!user) throw new Error("Usuário não encontrado.");

  const newCoins =
    action === "set"
      ? Math.max(0, delta)
      : action === "remove"
        ? Math.max(0, user.coins - Math.abs(delta))
        : user.coins + Math.abs(delta);

  const sourceId = `admin-coin-${Date.now()}-${randomBytes(4).toString("hex")}`;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { coins: newCoins } });
    await tx.userWallet.upsert({
      where: { userId },
      create: { userId, coins: newCoins },
      update: { coins: newCoins },
    });
    await tx.coinTransaction.create({
      data: {
        userId,
        amount: Math.abs(newCoins - user.coins) || Math.abs(delta),
        type: newCoins >= user.coins ? "EARN" : "SPEND",
        source: "ADMIN",
        sourceId,
        description: `Ajuste admin (${action})`,
      },
    });
  });

  const logType = action === "set" ? "COIN_SET" : action === "remove" ? "COIN_REMOVE" : "COIN_ADD";
  await writeModerationLog({
    moderatorId,
    targetUserId: userId,
    action: logType,
    description: `${action === "set" ? "Definiu" : action === "remove" ? "Removeu" : "Adicionou"} moedas de @${username}`,
    metadata: { delta, total: newCoins },
  });

  return { coins: newCoins };
}

export async function getModerationUserInfo(username: string) {
  const user = await findUserByUsername(username);
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    level: user.xp?.level ?? 1,
    xp: user.xp?.totalXp ?? 0,
    coins: user.coins,
    roles: user.roles.map((r) => r.role.name),
    isBanned: user.bansReceived.length > 0,
    isMuted: user.mutesReceived.length > 0,
    warnings: user._count.warningsReceived,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

export async function listModerationUsers(options: {
  search?: string;
  status?: string;
  role?: string;
  limit?: number;
}) {
  const where: Prisma.UserWhereInput = {};
  if (options.search) {
    const q = options.search.replace(/^@/, "");
    where.OR = [
      { username: { contains: q } },
      { fullName: { contains: q } },
      { email: { contains: q } },
    ];
  }
  if (options.role && options.role !== "all") {
    where.roles = { some: { role: { name: options.role } } };
  }
  if (options.status === "banned") {
    where.bansReceived = { some: { isActive: true } };
  } else if (options.status === "muted") {
    where.mutesReceived = { some: { isActive: true } };
  }

  const users = await prisma.user.findMany({
    where,
    take: options.limit ?? 50,
    orderBy: { createdAt: "desc" },
    include: {
      xp: true,
      roles: { include: { role: true } },
      bansReceived: { where: { isActive: true }, take: 1 },
      mutesReceived: { where: { isActive: true }, take: 1 },
      _count: { select: { warningsReceived: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    level: u.xp?.level ?? 1,
    xp: u.xp?.totalXp ?? 0,
    coins: u.coins,
    roles: u.roles.map((r) => r.role.name),
      legacyRole: u.role,
    isBanned: u.bansReceived.length > 0,
    isMuted: u.mutesReceived.length > 0,
    warnings: u._count.warningsReceived,
    createdAt: u.createdAt,
  }));
}

export async function listModerationLogs(options: {
  type?: string;
  search?: string;
  limit?: number;
}) {
  const where: Prisma.ModerationLogWhereInput = {};
  if (options.type && options.type !== "all") {
    where.action = options.type as ModerationLogType;
  }
  if (options.search) {
    const q = options.search.replace(/^@/, "");
    where.OR = [
      { description: { contains: q } },
      { targetUser: { username: { contains: q } } },
      { moderator: { username: { contains: q } } },
    ];
  }

  const logs = await prisma.moderationLog.findMany({
    where,
    take: options.limit ?? 100,
    orderBy: { createdAt: "desc" },
    include: {
      moderator: { select: { username: true, fullName: true } },
      targetUser: { select: { username: true, fullName: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    description: log.description,
    createdAt: log.createdAt,
    moderator: log.moderator.username,
    targetUser: log.targetUser?.username ?? null,
    metadata: log.metadata,
  }));
}

export async function getPlatformModerationStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeToday,
    activeBans,
    activeMutes,
    totalUsers,
    totalCoins,
    xpToday,
    pendingCourses,
    pendingApplications,
    pendingReports,
    totalTutorials,
    publishedTutorials,
    totalExams,
    publishedExams,
    totalEnrollments,
    newUsersToday,
  ] = await Promise.all([
    prisma.user.count({ where: { lastLogin: { gte: today } } }),
    prisma.userBan.count({ where: { isActive: true } }),
    prisma.userMute.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.user.aggregate({ _sum: { coins: true } }),
    prisma.xpTransaction.aggregate({
      where: { createdAt: { gte: today }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.course.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.instructorApplication.count({ where: { status: "PENDING" } }),
    prisma.communityReport.count({ where: { status: "PENDING" } }),
    prisma.tutorial.count(),
    prisma.tutorial.count({ where: { isPublished: true } }),
    prisma.exam.count(),
    prisma.exam.count({ where: { isPublished: true } }),
    prisma.courseEnrollment.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
  ]);

  const activityData = await getActivityLast7Days();

  return {
    activeToday,
    activeBans,
    activeMutes,
    pendingReports,
    newMessages: 0,
    xpToday: xpToday._sum.amount ?? 0,
    totalCoins: totalCoins._sum.coins ?? 0,
    totalUsers,
    pendingCourses,
    pendingApplications,
    totalTutorials,
    publishedTutorials,
    totalExams,
    publishedExams,
    totalEnrollments,
    newUsersToday,
    activityData,
  };
}

async function getActivityLast7Days() {
  const days: { date: string; usuarios: number; simulados: number; xpGanho: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const [usuarios, simulados, xpGanho] = await Promise.all([
      prisma.user.count({ where: { lastLogin: { gte: d, lte: end } } }),
      prisma.examAttempt.count({ where: { startedAt: { gte: d, lte: end } } }),
      prisma.xpTransaction.aggregate({
        where: { createdAt: { gte: d, lte: end }, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
    ]);

    days.push({
      date: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
      usuarios,
      simulados,
      xpGanho: xpGanho._sum.amount ?? 0,
    });
  }
  return days;
}

export async function executeModerationCommand(
  raw: string,
  moderatorId: string,
  roles: string[],
): Promise<CommandResult> {
  const trimmed = raw.trim();
  if (!trimmed) return { status: "error", message: "Comando vazio." };

  const tokens = tokenizeCommand(trimmed);
  const cmd = tokens[0]?.toLowerCase();

  try {
    switch (cmd) {
      case "/help":
        return showHelp(roles);
      case "/clear":
        return { status: "info", message: "Terminal limpo." };
      case "/user": {
        requireModAction("user", roles);
        const info = await getModerationUserInfo(parseUsername(tokens[1]));
        return {
          status: "info",
          message: [
            `@${info.username} (${info.fullName})`,
            `Email: ${info.email}`,
            `Nível ${info.level} · ${info.xp} XP · ${info.coins} moedas`,
            `Cargos: ${info.roles.join(", ") || "USER"}`,
            `Status: ${info.isBanned ? "BANIDO" : info.isMuted ? "SILENCIADO" : "Ativo"} · ${info.warnings} advertência(s)`,
          ].join("\n"),
          data: info,
        };
      }
      case "/addxp": {
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const amount = Number(tokens[2]);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor de XP inválido.");
        const result = await adminAdjustXp(
          moderatorId,
          roles,
          user.id,
          user.username ?? "unknown",
          amount,
          "add",
          "addxp",
        );
        return {
          status: "success",
          message: `✅ +${amount} XP para @${user.username} (total: ${result.total} XP, nível ${result.level})`,
        };
      }
      case "/removexp": {
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const amount = Number(tokens[2]);
        const result = await adminAdjustXp(
          moderatorId,
          roles,
          user.id,
          user.username ?? "unknown",
          amount,
          "remove",
          "removexp",
        );
        return {
          status: "success",
          message: `✅ -${amount} XP de @${user.username} (total: ${result.total} XP)`,
        };
      }
      case "/setxp": {
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const amount = Number(tokens[2]);
        const result = await adminAdjustXp(
          moderatorId,
          roles,
          user.id,
          user.username ?? "unknown",
          amount,
          "set",
          "setxp",
        );
        return {
          status: "success",
          message: `✅ XP de @${user.username} definido para ${result.total}`,
        };
      }
      case "/setlevel": {
        requireModAction("setlevel", roles);
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const level = Number(tokens[2]);
        if (!Number.isFinite(level) || level < 1) throw new Error("Nível inválido.");
        let total = 0;
        for (let l = 1; l < level; l++) total += xpRequiredForLevel(l);
        const result = await adminAdjustXp(
          moderatorId,
          roles,
          user.id,
          user.username ?? "unknown",
          total,
          "set",
          "setxp",
        );
        await prisma.userXP.update({ where: { userId: user.id }, data: { level, currentXp: 0 } });
        await writeModerationLog({
          moderatorId,
          targetUserId: user.id,
          action: "LEVEL_SET",
          description: `Definiu nível ${level} para @${user.username}`,
        });
        return {
          status: "success",
          message: `✅ Nível de @${user.username} definido para ${level}`,
        };
      }
      case "/addmoedas": {
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const amount = Number(tokens[2]);
        const result = await adminAdjustCoins(
          moderatorId,
          roles,
          user.id,
          user.username ?? "unknown",
          amount,
          "add",
          "addmoedas",
        );
        return {
          status: "success",
          message: `✅ +${amount} moedas para @${user.username} (total: ${result.coins})`,
        };
      }
      case "/removemoedas": {
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const amount = Number(tokens[2]);
        const result = await adminAdjustCoins(
          moderatorId,
          roles,
          user.id,
          user.username ?? "unknown",
          amount,
          "remove",
          "removemoedas",
        );
        return {
          status: "success",
          message: `✅ -${amount} moedas de @${user.username} (total: ${result.coins})`,
        };
      }
      case "/setmoedas": {
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const amount = Number(tokens[2]);
        const result = await adminAdjustCoins(
          moderatorId,
          roles,
          user.id,
          user.username ?? "unknown",
          amount,
          "set",
          "setmoedas",
        );
        return {
          status: "success",
          message: `✅ Saldo de @${user.username} definido para ${result.coins} moedas`,
        };
      }
      case "/addcargo":
      case "/removecargo": {
        const isAdd = cmd === "/addcargo";
        requireModAction(isAdd ? "addcargo" : "removecargo", roles);
        const username = parseUsername(tokens[1]);
        const roleName = ROLE_ALIASES[tokens[2]?.toLowerCase()] ?? tokens[2]?.toUpperCase();
        await prisma.$transaction(async tx => {
          const target = await tx.user.findUnique({ where: { username }, select: {
            id: true, role: true, roles: { select: { role: { select: { name: true } } } },
          } });
          if (!target) throw new Error("Usuário não encontrado.");
          const targetRoles = [target.role.toUpperCase(), ...target.roles.map(r => r.role.name)];
          const current = await tx.userRole.findMany({ where: { userId: moderatorId }, select: { role: { select: { name: true } } } });
          const actorRoles = current.map(r => r.role.name).filter(name => roles.includes(name));
          if (!allowedRoleChanges(actorRoles, targetRoles, target.id === moderatorId).includes(roleName)) {
            throw new Error("Sem permissão para alterar esse cargo nessa conta.");
          }
          const role = await tx.role.findUnique({ where: { name: roleName } });
          if (!role) throw new Error("Cargo não cadastrado.");
          const key = { userId: target.id, roleId: role.id };
          if (isAdd) {
            await tx.userRole.upsert({ where: { userId_roleId: key }, create: { ...key, assignedBy: moderatorId }, update: {} });
          } else {
            await tx.userRole.deleteMany({ where: key });
          }
          await tx.moderationLog.create({ data: {
            moderatorId, targetUserId: target.id, action: isAdd ? "ROLE_ADD" : "ROLE_REMOVE",
            description: `${isAdd ? "Atribuiu" : "Removeu"} cargo ${roleName} de @${username}`,
          } });
        }, { isolationLevel: "Serializable" });
        return {
          status: "success",
          message: `✅ Cargo ${roleName} ${isAdd ? "atribuído a" : "removido de"} @${username}`,
        };
      }
      case "/ban": {
        requireModAction("ban", roles);
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const reason = parseQuoted(tokens.slice(2).join(" ")) || "Sem motivo informado";
        await prisma.userBan.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false, liftedAt: new Date(), liftedById: moderatorId },
        });
        await prisma.userBan.create({
          data: { userId: user.id, moderatorId, reason, isActive: true },
        });
        await writeModerationLog({
          moderatorId,
          targetUserId: user.id,
          action: "BAN",
          description: `Baniu @${user.username}: ${reason}`,
        });
        await createNotification({
          userId: user.id,
          type: "MODERATION_ACTION",
          title: "Conta suspensa",
          message: `Sua conta foi suspensa. Motivo: ${reason}`,
        });
        return { status: "success", message: `✅ @${user.username} banido. Motivo: "${reason}"` };
      }
      case "/unban": {
        requireModAction("unban", roles);
        const user = await findUserByUsername(parseUsername(tokens[1]));
        await prisma.userBan.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false, liftedAt: new Date(), liftedById: moderatorId },
        });
        await writeModerationLog({
          moderatorId,
          targetUserId: user.id,
          action: "UNBAN",
          description: `Desbaniu @${user.username}`,
        });
        return { status: "success", message: `✅ @${user.username} desbanido.` };
      }
      case "/mute": {
        requireModAction("mute", roles);
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const duration = parseDuration(tokens[2]);
        const reason = parseQuoted(tokens.slice(3).join(" ")) || "Sem motivo informado";
        await prisma.userMute.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false, liftedAt: new Date(), liftedById: moderatorId },
        });
        await prisma.userMute.create({
          data: { userId: user.id, moderatorId, reason, expiresAt: duration, isActive: true },
        });
        await writeModerationLog({
          moderatorId,
          targetUserId: user.id,
          action: "MUTE",
          description: `Silenciou @${user.username}: ${reason}`,
        });
        return {
          status: "success",
          message: `✅ @${user.username} silenciado${duration ? ` até ${duration.toLocaleString("pt-BR")}` : ""}. Motivo: "${reason}"`,
        };
      }
      case "/unmute": {
        requireModAction("unmute", roles);
        const user = await findUserByUsername(parseUsername(tokens[1]));
        await prisma.userMute.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false, liftedAt: new Date(), liftedById: moderatorId },
        });
        await writeModerationLog({
          moderatorId,
          targetUserId: user.id,
          action: "UNMUTE",
          description: `Removeu silêncio de @${user.username}`,
        });
        return { status: "success", message: `✅ Silêncio removido de @${user.username}.` };
      }
      case "/warn": {
        requireModAction("warn", roles);
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const reason = parseQuoted(tokens.slice(2).join(" ")) || "Sem motivo informado";
        await prisma.userWarning.create({ data: { userId: user.id, moderatorId, reason } });
        await writeModerationLog({
          moderatorId,
          targetUserId: user.id,
          action: "WARN",
          description: `Advertiu @${user.username}: ${reason}`,
        });
        await createNotification({
          userId: user.id,
          type: "MODERATION_ACTION",
          title: "Advertência recebida",
          message: reason,
        });
        return {
          status: "success",
          message: `✅ Advertência aplicada a @${user.username}: "${reason}"`,
        };
      }
      case "/stats": {
        requireModAction("stats", roles);
        const stats = await getPlatformModerationStats();
        return {
          status: "info",
          message: [
            `Usuários: ${stats.totalUsers} (${stats.activeToday} ativos hoje)`,
            `Bans ativos: ${stats.activeBans} · Mutes: ${stats.activeMutes}`,
            `XP distribuído hoje: ${stats.xpToday}`,
            `Moedas em circulação: ${stats.totalCoins}`,
            `Cursos pendentes: ${stats.pendingCourses} · Instrutores: ${stats.pendingApplications}`,
          ].join("\n"),
          data: stats,
        };
      }
      case "/broadcast": {
        requireModAction("broadcast", roles);
        const message = parseQuoted(tokens.slice(1).join(" ")) || tokens.slice(1).join(" ");
        if (!message) throw new Error("Informe a mensagem entre aspas.");
        const users = await prisma.user.findMany({ select: { id: true } });
        await prisma.notification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            type: "SYSTEM_ANNOUNCEMENT" as const,
            title: "Aviso da plataforma",
            message,
          })),
        });
        await writeModerationLog({
          moderatorId,
          action: "BROADCAST",
          description: `Broadcast: ${message.slice(0, 120)}`,
          metadata: { recipients: users.length },
        });
        return {
          status: "success",
          message: `✅ Notificação enviada para ${users.length} usuários.`,
        };
      }
      case "/manutencao": {
        requireModAction("manutencao", roles);
        const mode = tokens[1]?.toLowerCase();
        const message =
          parseQuoted(tokens.slice(2).join(" ")) || "Estamos em manutenção. Voltamos em breve!";
        const enabled = mode === "on" || mode === "true" || mode === "1";
        await prisma.platformSetting.upsert({
          where: { key: "maintenance" },
          create: { key: "maintenance", value: { enabled, message }, updatedById: moderatorId },
          update: { value: { enabled, message }, updatedById: moderatorId },
        });
        await writeModerationLog({
          moderatorId,
          action: "MAINTENANCE",
          description: `Manutenção ${enabled ? "ativada" : "desativada"}`,
          metadata: { enabled, message },
        });
        invalidatePlatformSettingsCache();
        return {
          status: "success",
          message: `✅ Modo manutenção ${enabled ? "ATIVADO" : "DESATIVADO"}.`,
        };
      }
      case "/booster": {
        requireModAction("boosterglobal", roles);
        const multiplier = Number(tokens[1]?.replace(/x/i, "")) || 2;
        const duration = parseDuration(tokens[2] ?? "24h");
        if (!duration) throw new Error("Informe duração (ex: 24h, 7d).");
        await prisma.platformSetting.upsert({
          where: { key: "global_booster" },
          create: {
            key: "global_booster",
            value: { multiplier, expiresAt: duration.toISOString() },
            updatedById: moderatorId,
          },
          update: {
            value: { multiplier, expiresAt: duration.toISOString() },
            updatedById: moderatorId,
          },
        });
        await writeModerationLog({
          moderatorId,
          action: "GLOBAL_BOOSTER",
          description: `Booster global x${multiplier} até ${duration.toISOString()}`,
        });
        invalidatePlatformSettingsCache();
        return {
          status: "success",
          message: `✅ Booster global x${multiplier} ativado até ${duration.toLocaleString("pt-BR")}.`,
        };
      }
      case "/logs": {
        requireModAction("logs", roles);
        const logs = await listModerationLogs({
          type: tokens[1] ?? "all",
          search: tokens[2],
          limit: 15,
        });
        if (!logs.length) return { status: "info", message: "Nenhum log encontrado." };
        return {
          status: "info",
          message: logs
            .map((l) => `[${l.createdAt.toLocaleString("pt-BR")}] ${l.action} · ${l.description}`)
            .join("\n"),
          data: logs,
        };
      }
      case "/cursos": {
        requireModAction("cursos", roles);
        const sub = tokens[1]?.toLowerCase();
        if (sub === "list") {
          const courses = await prisma.course.findMany({
            take: 20,
            orderBy: { updatedAt: "desc" },
            select: { id: true, title: true, status: true, slug: true },
          });
          return {
            status: "info",
            message: courses.map((c) => `${c.id.slice(0, 8)}… ${c.title} [${c.status}]`).join("\n"),
            data: courses,
          };
        }
        if (sub === "publish" || sub === "unpublish") {
          const course = await prisma.course.findFirst({
            where: { OR: [{ id: tokens[2] }, { slug: tokens[2] }] },
          });
          if (!course) throw new Error("Curso não encontrado.");
          const status = sub === "publish" ? "APPROVED" : "PENDING_REVIEW";
          await prisma.course.update({ where: { id: course.id }, data: { status } });
          await writeModerationLog({
            moderatorId,
            action: sub === "publish" ? "COURSE_PUBLISH" : "COURSE_UNPUBLISH",
            description: `${sub === "publish" ? "Publicou" : "Despublicou"} curso ${course.title}`,
            metadata: { courseId: course.id },
          });
          return {
            status: "success",
            message: `✅ Curso "${course.title}" ${sub === "publish" ? "publicado" : "despublicado"}.`,
          };
        }
        throw new Error("Use: /cursos list | publish <id> | unpublish <id>");
      }
      case "/simulado": {
        requireModAction("simulado", roles);
        if (tokens[1]?.toLowerCase() === "list") {
          const exams = await prisma.exam.findMany({
            take: 20,
            orderBy: { createdAt: "desc" },
            select: { id: true, title: true, slug: true, isPublished: true },
          });
          return {
            status: "info",
            message: exams
              .map(
                (e) =>
                  `${e.id.slice(0, 8)}… ${e.title} [${e.isPublished ? "publicado" : "rascunho"}]`,
              )
              .join("\n"),
            data: exams,
          };
        }
        if (tokens[1]?.toLowerCase() === "reset") {
          const user = await findUserByUsername(parseUsername(tokens[2]));
          const exam = await prisma.exam.findFirst({
            where: { OR: [{ id: tokens[3] }, { slug: tokens[3] }] },
          });
          if (!exam) throw new Error("Simulado não encontrado.");
          const deleted = await prisma.examAttempt.deleteMany({
            where: { userId: user.id, examId: exam.id },
          });
          await writeModerationLog({
            moderatorId,
            targetUserId: user.id,
            action: "EXAM_RESET",
            description: `Resetou tentativas de @${user.username} no simulado ${exam.title}`,
          });
          return {
            status: "success",
            message: `✅ ${deleted.count} tentativa(s) resetada(s) para @${user.username}.`,
          };
        }
        throw new Error("Use: /simulado list | reset @user <id>");
      }
      case "/tutorials": {
        requireModAction("tutorials", roles);
        const sub = tokens[1]?.toLowerCase();
        if (sub === "list") {
          const tutorials = await prisma.tutorial.findMany({
            take: 20,
            orderBy: { createdAt: "desc" },
            select: { id: true, title: true, slug: true, isPublished: true, viewCount: true },
          });
          return {
            status: "info",
            message: tutorials
              .map(
                (t) =>
                  `${t.id.slice(0, 8)}… ${t.title} [${t.isPublished ? "publicado" : "rascunho"}] · ${t.viewCount} views`,
              )
              .join("\n"),
            data: tutorials,
          };
        }
        if (sub === "publish" || sub === "unpublish") {
          const tutorial = await prisma.tutorial.findFirst({
            where: { OR: [{ id: tokens[2] }, { slug: tokens[2] }] },
          });
          if (!tutorial) throw new Error("Tutorial não encontrado.");
          const publish = sub === "publish";
          await prisma.tutorial.update({ where: { id: tutorial.id }, data: { isPublished: publish } });
          await writeModerationLog({
            moderatorId,
            action: publish ? "COURSE_PUBLISH" : "COURSE_UNPUBLISH",
            description: `${publish ? "Publicou" : "Despublicou"} tutorial ${tutorial.title}`,
            metadata: { tutorialId: tutorial.id },
          });
          return {
            status: "success",
            message: `✅ Tutorial "${tutorial.title}" ${publish ? "publicado" : "despublicado"}.`,
          };
        }
        if (sub === "delete") {
          const tutorial = await prisma.tutorial.findFirst({
            where: { OR: [{ id: tokens[2] }, { slug: tokens[2] }] },
          });
          if (!tutorial) throw new Error("Tutorial não encontrado.");
          await prisma.tutorial.delete({ where: { id: tutorial.id } });
          await writeModerationLog({
            moderatorId,
            action: "OTHER",
            description: `Excluiu tutorial ${tutorial.title}`,
            metadata: { tutorialId: tutorial.id },
          });
          return {
            status: "success",
            message: `✅ Tutorial "${tutorial.title}" excluído.`,
          };
        }
        throw new Error("Use: /tutorials list | publish <id> | unpublish <id> | delete <id>");
      }
      case "/resetpass": {
        requireModAction("resetpass", roles);
        return {
          status: "info",
          message:
            "ℹ️ Use a página de recuperação de senha ou implemente token por email. Log registrado.",
        };
      }
      case "/impersonate": {
        requireModAction("impersonate", roles);
        const user = await findUserByUsername(parseUsername(tokens[1]));
        const targetRoles = [user.role.toUpperCase(), ...user.roles.map((r) => r.role.name)];
        if (targetRoles.some((r) => ["MODERATOR", "ADMIN", "SUPERADMIN"].includes(r))) {
          throw new Error("Não é permitido impersonar staff.");
        }
        return {
          status: "success",
          message: `✅ Iniciando visualização como @${user.username}...`,
          data: { action: "impersonate", userId: user.id, username: user.username },
        };
      }
      default:
        return { status: "error", message: `Comando desconhecido: ${cmd}. Use /help.` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao executar comando.";
    return { status: "error", message: `❌ ${message}` };
  }
}

function tokenizeCommand(raw: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    tokens.push(match[1] ?? match[2]);
  }
  return tokens;
}

function showHelp(roles: string[]): CommandResult {
  const lines = [
    "Comandos disponíveis:",
    "/help · /user @u · /stats · /logs [tipo] [user]",
    "/addxp · /removexp · /setxp · /setlevel @u <n>",
    "/addmoedas · /removemoedas · /setmoedas @u <n>",
    "/addcargo · /removecargo @u <cargo>",
    "/ban · /unban · /mute · /unmute · /warn @u",
    '/broadcast "msg" · /manutencao on|off "msg"',
    "/booster <2x|3x> <24h|7d> · /cursos list|publish|unpublish",
    "/tutorials list|publish|unpublish|delete",
    "/simulado list|reset @u <id> · /clear",
  ];
  if (!roles.includes("ADMIN") && !roles.includes("SUPERADMIN")) {
    lines.push("(Alguns comandos requerem cargo ADMIN ou superior)");
  }
  return { status: "info", message: lines.join("\n") };
}

export const ALL_TERMINAL_COMMANDS = [
  "/help",
  "/user",
  "/addxp",
  "/removexp",
  "/setxp",
  "/setlevel",
  "/addmoedas",
  "/removemoedas",
  "/setmoedas",
  "/addcargo",
  "/removecargo",
  "/ban",
  "/unban",
  "/mute",
  "/unmute",
  "/warn",
  "/stats",
  "/broadcast",
  "/manutencao",
  "/booster",
  "/logs",
  "/cursos",
  "/tutorials",
  "/simulado",
  "/clear",
];

// Importações necessárias para o serviço de salas ao vivo
import {
  enforceCleanContent,
  enforceCleanMessageSequence,
  filterProfanity,
} from "@/services/content-policy.service";
import { TASK_PREFIX } from "@/lib/live-task";
import { prisma } from "@/lib/prisma"; // Cliente Prisma para banco de dados
import type { LiveRoomStatus } from "@prisma/client"; // Tipo de status de sala ao vivo

// Função para listar salas ao vivo do instrutor
// Retorna todas as salas criadas pelo instrutor
export async function listInstructorLiveRooms(instructorId: string) {
  return prisma.liveRoom.findMany({
    where: { instructorId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      instructor: { select: { id: true, username: true, fullName: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
}

export type LiveRoomListFilter = "scheduled" | "live" | "ended" | "all";

const FILTER_STATUS: Record<LiveRoomListFilter, ("SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED")[]> =
  {
    scheduled: ["SCHEDULED"],
    live: ["LIVE"],
    ended: ["ENDED"],
    all: ["SCHEDULED", "LIVE", "ENDED"],
  };

export async function listAvailableLiveRooms(filter: LiveRoomListFilter = "all") {
  return prisma.liveRoom.findMany({
    where: {
      status: { in: FILTER_STATUS[filter] },
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      instructor: { select: { id: true, username: true, fullName: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function listInstructorApprovedCourses(instructorId: string) {
  return prisma.course.findMany({
    where: {
      status: "APPROVED",
      instructors: { some: { userId: instructorId } },
    },
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  });
}

// Função para obter sala ao vivo por ID
// Retorna sala com detalhes completos
export async function getLiveRoom(roomId: string) {
  return prisma.liveRoom.findUnique({
    where: { id: roomId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      instructor: { select: { id: true, username: true, fullName: true } },
      participants: {
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
      },
    },
  });
}

// Função para criar sala ao vivo
// Cria nova sala ao vivo para instrutor
export async function createLiveRoom(
  instructorId: string,
  data: {
    title: string;
    description?: string;
    courseId?: string;
    videoUrl?: string;
    videoProvider?: string;
    scheduledAt: Date;
    maxParticipants?: number;
  },
) {
  if (data.courseId) {
    const course = await prisma.course.findFirst({
      where: {
        id: data.courseId,
        status: "APPROVED",
        instructors: { some: { userId: instructorId } },
      },
    });
    if (!course) {
      throw new Error("Curso não encontrado ou sem permissão.");
    }
  }

  await enforceCleanContent({
    userId: instructorId,
    text: data.title,
    fieldLabel: "título",
    context: "LIVE_ROOM",
  });
  if (data.description) {
    await enforceCleanContent({
      userId: instructorId,
      text: data.description,
      fieldLabel: "descrição",
      context: "LIVE_ROOM",
    });
  }

  return prisma.liveRoom.create({
    data: {
      instructorId,
      title: data.title,
      description: data.description,
      courseId: data.courseId || null,
      videoUrl: data.videoUrl,
      videoProvider: data.videoProvider,
      scheduledAt: data.scheduledAt,
      maxParticipants: data.maxParticipants,
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      instructor: { select: { id: true, username: true, fullName: true } },
    },
  });
}

// Função para atualizar sala ao vivo
// Atualiza dados da sala ao vivo
export async function updateLiveRoom(
  roomId: string,
  instructorId: string,
  data: {
    title?: string;
    description?: string;
    courseId?: string | null;
    videoUrl?: string;
    videoProvider?: string;
    scheduledAt?: Date;
    maxParticipants?: number;
    status?: LiveRoomStatus;
  },
) {
  const room = await prisma.liveRoom.findFirst({
    where: { id: roomId, instructorId },
  });
  if (!room) {
    throw new Error("Sala não encontrada ou você não é o instrutor.");
  }

  if (room.status !== "SCHEDULED") {
    throw new Error("Só é possível editar salas agendadas.");
  }

  if (data.courseId) {
    const course = await prisma.course.findFirst({
      where: {
        id: data.courseId,
        status: "APPROVED",
        instructors: { some: { userId: instructorId } },
      },
    });
    if (!course) {
      throw new Error("Curso não encontrado ou sem permissão.");
    }
  }

  if (data.title) {
    await enforceCleanContent({
      userId: instructorId,
      text: data.title,
      fieldLabel: "título",
      context: "LIVE_ROOM",
    });
  }
  if (data.description) {
    await enforceCleanContent({
      userId: instructorId,
      text: data.description,
      fieldLabel: "descrição",
      context: "LIVE_ROOM",
    });
  }

  return prisma.liveRoom.update({
    where: { id: roomId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.courseId !== undefined ? { courseId: data.courseId || null } : {}),
      ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl || null } : {}),
      ...(data.videoProvider !== undefined ? { videoProvider: data.videoProvider || null } : {}),
      ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}),
      ...(data.maxParticipants !== undefined
        ? { maxParticipants: data.maxParticipants ?? null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      instructor: { select: { id: true, username: true, fullName: true } },
    },
  });
}

export async function cancelLiveRoom(roomId: string, instructorId: string) {
  const room = await prisma.liveRoom.findFirst({
    where: { id: roomId, instructorId, status: "SCHEDULED" },
  });
  if (!room) {
    throw new Error("Só é possível cancelar salas agendadas.");
  }

  return prisma.liveRoom.update({
    where: { id: roomId },
    data: { status: "CANCELLED" },
  });
}

// Função para iniciar sala ao vivo
// Muda status para LIVE e registra horário de início
export async function startLiveRoom(roomId: string, instructorId: string) {
  const room = await prisma.liveRoom.findFirst({
    where: { id: roomId, instructorId },
  });
  if (!room) {
    throw new Error("Sala não encontrada ou você não é o instrutor.");
  }
  if (room.status !== "SCHEDULED") {
    throw new Error("Só é possível iniciar salas agendadas.");
  }

  return prisma.liveRoom.update({
    where: { id: roomId },
    data: {
      status: "LIVE",
      startedAt: new Date(),
    },
  });
}

// Função para encerrar sala ao vivo
// Muda status para ENDED e registra horário de término
export async function endLiveRoom(roomId: string, instructorId: string) {
  const room = await prisma.liveRoom.findFirst({
    where: { id: roomId, instructorId },
  });
  if (!room) {
    throw new Error("Sala não encontrada ou você não é o instrutor.");
  }
  if (room.status !== "LIVE") {
    throw new Error("Só é possível encerrar salas em transmissão.");
  }

  return prisma.liveRoom.update({
    where: { id: roomId },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });
}

// Função para entrar na sala ao vivo
// Adiciona usuário como participante
export async function joinLiveRoom(roomId: string, userId: string) {
  const room = await prisma.liveRoom.findUnique({
    where: { id: roomId },
  });
  if (!room) {
    throw new Error("Sala não encontrada.");
  }

  if (room.status !== "LIVE" && room.status !== "SCHEDULED") {
    throw new Error("Esta sala não está disponível para entrada.");
  }

  // Verifica se já é participante
  const existing = await prisma.liveRoomParticipant.findUnique({
    where: {
      roomId_userId: { roomId, userId },
    },
  });
  if (existing) {
    if (existing.leftAt) {
      return prisma.liveRoomParticipant.update({
        where: { id: existing.id },
        data: { leftAt: null, joinedAt: new Date() },
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
      });
    }
    return existing;
  }

  // Verifica limite de participantes
  if (room.maxParticipants) {
    const participantCount = await prisma.liveRoomParticipant.count({
      where: { roomId, leftAt: null },
    });
    if (participantCount >= room.maxParticipants) {
      throw new Error("Sala lotada.");
    }
  }

  return prisma.liveRoomParticipant.create({
    data: { roomId, userId },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
    },
  });
}

// Função para sair da sala ao vivo
// Remove usuário como participante
export async function leaveLiveRoom(roomId: string, userId: string) {
  return prisma.liveRoomParticipant.updateMany({
    where: {
      roomId,
      userId,
      leftAt: null,
    },
    data: { leftAt: new Date() },
  });
}

// Função para obter mensagens do chat
// Retorna mensagens da sala ao vivo
export async function getLatestLiveTask(roomId: string, instructorId: string) {
  return prisma.liveChatMessage.findFirst({
    where: { roomId, userId: instructorId, message: { startsWith: TASK_PREFIX } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { userId: true, message: true },
  });
}

export async function getLiveChatMessages(roomId: string, limit = 50) {
  const rows = await prisma.liveChatMessage.findMany({
    where: { roomId },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
  return rows.reverse().map((row) => ({ ...row, message: filterProfanity(row.message) }));
}

export async function canAccessLiveChat(roomId: string, userId: string) {
  const room = await prisma.liveRoom.findUnique({
    where: { id: roomId },
    select: { instructorId: true },
  });
  if (!room) return false;
  if (room.instructorId === userId) return true;

  const participant = await prisma.liveRoomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { leftAt: true },
  });

  return Boolean(participant && !participant.leftAt);
}

export async function getLiveChatMessagesSince(roomId: string, userId: string, since?: Date) {
  const allowed = await canAccessLiveChat(roomId, userId);
  if (!allowed) {
    throw new Error("Você não tem acesso ao chat desta sala.");
  }

  const rows = await prisma.liveChatMessage.findMany({
    where: {
      roomId,
      ...(since ? { createdAt: { gt: since } } : {}),
    },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return rows.map((row) => ({ ...row, message: filterProfanity(row.message) }));
}

// Função para enviar mensagem no chat
// Cria nova mensagem no chat da sala
export async function sendLiveChatMessage(roomId: string, userId: string, message: string) {
  const room = await prisma.liveRoom.findUnique({
    where: { id: roomId },
  });
  if (!room) {
    throw new Error("Sala não encontrada.");
  }

  if (room.status !== "LIVE") {
    throw new Error("O chat só está disponível durante a transmissão ao vivo.");
  }

  // Verifica se usuário é participante
  const participant = await prisma.liveRoomParticipant.findUnique({
    where: {
      roomId_userId: { roomId, userId },
    },
  });
  if (!participant || participant.leftAt) {
    throw new Error("Você precisa estar na sala para enviar mensagens.");
  }

  const trimmed = message.trim();

  const sequenceWindowMs = 5 * 60 * 1000;
  const since = new Date(Date.now() - sequenceWindowMs);
  const recentFromSender = await prisma.liveChatMessage.findMany({
    where: {
      roomId,
      userId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
    take: 8,
    select: { message: true },
  });

  const recentFragments = recentFromSender
    .map((row) => row.message.trim())
    .filter((body) => body.length > 0 && body.length <= 24 && body.split(/\s+/).length <= 3);

  await enforceCleanMessageSequence({
    userId,
    text: trimmed,
    recentFragments,
    fieldLabel: "mensagem",
    context: "LIVE_CHAT",
  });

  return prisma.liveChatMessage.create({
    data: { roomId, userId, message: filterProfanity(trimmed) },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
    },
  });
}

// Função para obter participantes ativos da sala
// Retorna participantes que ainda não saíram
export async function getActiveParticipants(roomId: string) {
  return prisma.liveRoomParticipant.findMany({
    where: { roomId, leftAt: null },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
}

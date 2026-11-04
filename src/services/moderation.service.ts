// Importações necessárias para o serviço de moderação
import { prisma } from "@/lib/prisma"; // Cliente Prisma para banco de dados
import type {
  CourseModerationInput,
  InstructorApplicationInput,
} from "@/lib/validations/moderation"; // Tipos de entrada para validação
import { enforceCleanContent } from "@/services/content-policy.service";
import { createNotification } from "@/services/notification.service";

// Função para obter última aplicação de instrutor do usuário
// Retorna a aplicação mais recente do usuário
export async function getLatestInstructorApplication(userId: string) {
  return prisma.instructorApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }, // Mais recente primeiro
  });
}

// Função para submeter aplicação de instrutor
// Cria nova aplicação se não houver pendência e usuário não for instrutor
export async function submitInstructorApplication(
  userId: string,
  data: InstructorApplicationInput,
) {
  // Verifica se já existe aplicação pendente
  const pending = await prisma.instructorApplication.findFirst({
    where: { userId, status: "PENDING" },
  });

  if (pending) {
    throw new Error("Você já possui uma solicitação pendente de análise.");
  }

  // Busca papéis do usuário
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  // Verifica se usuário já é instrutor
  if (userRoles.some((r) => ["INSTRUCTOR", "TEACHER"].includes(r.role.name))) {
    throw new Error("Você já é instrutor na plataforma.");
  }

  await enforceCleanContent({
    userId,
    text: data.motivation,
    fieldLabel: "motivação",
    context: "INSTRUCTOR_APPLICATION",
  });
  await enforceCleanContent({
    userId,
    text: data.experience,
    fieldLabel: "experiência",
    context: "INSTRUCTOR_APPLICATION",
  });

  return prisma.instructorApplication.create({
    data: {
      userId,
      motivation: data.motivation,
      experience: data.experience,
      portfolioUrl: data.portfolioUrl || null,
    },
  });
}

// Função para listar aplicações de instrutor pendentes
// Retorna todas as aplicações com status PENDING
export async function listPendingInstructorApplications() {
  return prisma.instructorApplication.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, fullName: true, username: true, email: true } },
    },
    orderBy: { createdAt: "asc" }, // Mais antigas primeiro
  });
}

// Função para revisar aplicação de instrutor
// Aprova ou rejeita aplicação e atribui papel se aprovado
export async function reviewInstructorApplication(
  applicationId: string,
  moderatorId: string,
  approve: boolean,
  reviewNotes?: string,
) {
  // Busca aplicação
  const application = await prisma.instructorApplication.findUnique({
    where: { id: applicationId },
  });

  // Verifica se aplicação existe e está pendente
  if (!application || application.status !== "PENDING") {
    throw new Error("Solicitação não encontrada ou já analisada.");
  }

  // Busca papel de instrutor
  const instructorRole = await prisma.role.findUnique({ where: { name: "INSTRUCTOR" } })
    ?? await prisma.role.findUnique({ where: { name: "TEACHER" } });
  if (!instructorRole) throw new Error("Papel INSTRUCTOR não encontrado.");

  if (approve) {
    // Aprova aplicação e atribui papel de instrutor em transação
    await prisma.$transaction([
      prisma.instructorApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewedById: moderatorId,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null,
        },
      }),
      prisma.userRole.upsert({
        where: {
          userId_roleId: { userId: application.userId, roleId: instructorRole.id },
        },
        create: {
          userId: application.userId,
          roleId: instructorRole.id,
          assignedBy: moderatorId,
        },
        update: {},
      }),
    ]);

    await createNotification({
      userId: application.userId,
      type: "INSTRUCTOR_APPROVED",
      title: "Solicitação aprovada",
      message: "Sua solicitação para ser instrutor foi aprovada. Bem-vindo!",
      link: "/instructor/courses",
    });
  } else {
    // Rejeita aplicação
    await prisma.instructorApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        reviewedById: moderatorId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    await createNotification({
      userId: application.userId,
      type: "INSTRUCTOR_REJECTED",
      title: "Solicitação não aprovada",
      message: reviewNotes
        ? `Sua solicitação foi analisada. Motivo: ${reviewNotes}`
        : "Sua solicitação para ser instrutor não foi aprovada desta vez.",
      link: "/instructor/apply",
    });
  }
}

// Função para listar cursos pendentes de moderação
// Retorna cursos com status PENDING_REVIEW
export async function listPendingCourses() {
  return prisma.course.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      category: true,
      instructors: {
        include: { user: { select: { fullName: true, username: true, email: true } } },
      },
      _count: { select: { modules: true } },
    },
    orderBy: { updatedAt: "asc" }, // Mais antigos primeiro
  });
}

// Função para obter curso para moderação
// Retorna curso com todos os dados incluindo histórico de moderação
export async function getCourseForModeration(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      instructors: {
        include: { user: { select: { fullName: true, username: true, email: true } } },
      },
      modules: {
        orderBy: { orderNumber: "asc" },
        include: {
          lessons: { orderBy: { orderNumber: "asc" } },
          materials: true,
        },
      },
      moderations: {
        orderBy: { reviewedAt: "desc" }, // Mais recentes primeiro
        take: 5, // Últimas 5 moderações
        include: {
          moderator: { select: { fullName: true } },
        },
      },
    },
  });
}

// Função para moderar curso
// Cria registro de moderação e atualiza status do curso
export async function moderateCourse(moderatorId: string, data: CourseModerationInput) {
  const course = await prisma.course.findUnique({ where: { id: data.courseId } });

  if (!course) {
    throw new Error("Curso não encontrado.");
  }

  if (course.status === data.status) {
    throw new Error("O curso já está com este status.");
  }

  const instructors = await prisma.courseInstructor.findMany({
    where: { courseId: data.courseId },
    select: { userId: true },
  });

  await prisma.$transaction([
    prisma.courseModeration.create({
      data: {
        courseId: data.courseId,
        moderatorId,
        status: data.status,
        reviewNotes: data.reviewNotes || null,
      },
    }),
    prisma.course.update({
      where: { id: data.courseId },
      data: {
        status: data.status,
        ...(data.status === "APPROVED" ? { isPublished: true } : { isPublished: false }),
      },
    }),
  ]);

  const notificationType =
    data.status === "APPROVED"
      ? "COURSE_APPROVED"
      : data.status === "REVISION_REQUIRED"
        ? "COURSE_REJECTED"
        : "COURSE_REJECTED";

  const defaultMessage =
    data.status === "APPROVED"
      ? `Seu curso "${course.title}" foi publicado na plataforma.`
      : data.status === "REVISION_REQUIRED"
        ? `Seu curso "${course.title}" foi devolvido para revisão.`
        : `Seu curso "${course.title}" foi rejeitado.`;

  if (instructors.length > 0) {
    await prisma.notification.createMany({
      data: instructors.map((instructor) => ({
        userId: instructor.userId,
        type: notificationType,
        title:
          data.status === "APPROVED"
            ? "Curso aprovado"
            : data.status === "REVISION_REQUIRED"
              ? "Curso devolvido para revisão"
              : "Curso rejeitado",
        message: data.reviewNotes ?? defaultMessage,
        link: `/instructor/courses/${data.courseId}/edit`,
      })),
    });
  }
}

export async function setCoursePublished(courseId: string, moderatorId: string, publish: boolean) {
  return moderateCourse(moderatorId, {
    courseId,
    status: publish ? "APPROVED" : "REVISION_REQUIRED",
    reviewNotes: publish ? "Publicado pelo painel de conteúdo." : "Despublicado pelo painel de conteúdo.",
  });
}

// Função para submeter curso para revisão
// Reenvia curso que foi rejeitado ou precisa de revisão
export async function submitCourseForReview(courseId: string, userId: string) {
  // Busca curso onde usuário é instrutor e status permite reenvio
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      instructors: { some: { userId } },
      status: { in: ["REVISION_REQUIRED", "REJECTED"] },
    },
  });

  if (!course) {
    throw new Error("Curso não encontrado ou não pode ser reenviado.");
  }

  // Atualiza status para PENDING_REVIEW
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "PENDING_REVIEW" },
  });
}

// Função para obter contagens de moderação
// Retorna número de aplicações e cursos pendentes
export async function getModerationCounts() {
  const [pendingApplications, pendingCourses] = await Promise.all([
    prisma.instructorApplication.count({ where: { status: "PENDING" } }),
    prisma.course.count({ where: { status: "PENDING_REVIEW" } }),
  ]);
  return { pendingApplications, pendingCourses };
}

export async function listModerationHistory(limit = 15) {
  const [courseDecisions, instructorDecisions] = await Promise.all([
    prisma.courseModeration.findMany({
      orderBy: { reviewedAt: "desc" },
      take: limit,
      include: {
        course: { select: { id: true, title: true } },
        moderator: { select: { fullName: true } },
      },
    }),
    prisma.instructorApplication.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: limit,
      include: {
        user: { select: { fullName: true, username: true } },
        reviewedBy: { select: { fullName: true } },
      },
    }),
  ]);

  const items = [
    ...courseDecisions.map((item) => ({
      id: item.id,
      type: "course" as const,
      title: item.course.title,
      status: item.status,
      notes: item.reviewNotes,
      moderatorName: item.moderator.fullName,
      reviewedAt: item.reviewedAt,
    })),
    ...instructorDecisions.map((item) => ({
      id: item.id,
      type: "instructor" as const,
      title: item.user.fullName,
      status: item.status,
      notes: item.reviewNotes,
      moderatorName: item.reviewedBy?.fullName ?? "Moderador",
      reviewedAt: item.reviewedAt ?? item.createdAt,
    })),
  ];

  return items.sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime()).slice(0, limit);
}

// Função para verificar se usuário tem papel de instrutor
// Retorna true se usuário for instrutor ou admin
export async function userHasInstructorRole(userId: string) {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return roles.some((r) => ["INSTRUCTOR", "TEACHER", "ADMIN"].includes(r.role.name));
}

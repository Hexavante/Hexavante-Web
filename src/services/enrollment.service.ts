// Importações necessárias para o serviço de matrícula
import { isPrismaUniqueViolation } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma"; // Cliente Prisma para banco de dados
import { countTotalLessons } from "@/services/course.service"; // Função para contar aulas
import { COIN_REWARDS } from "@/lib/gamification";
import { awardCoins } from "@/services/wallet.service";
import { awardXp, type XpAward, XP_REWARDS } from "@/services/xp.service";
import { issueCertificate } from "@/services/certificate.service"; // Serviço de certificados
import { recordStudyVisit } from "@/services/study-continuation.service";
import { buildLessonProgressContext } from "@/services/lesson-learning.service";

// Tipo para resultado de conclusão de aula
export type LessonCompleteResult = {
  progress: number; // Progresso do curso em porcentagem
  xpAwards: XpAward[]; // Lista de prêmios de XP ganhos
  totalXpEarned: number; // Total de XP ganho
  /** true quando ESTA conclusão levou o curso a 100% (1ª vez). */
  courseCompleted: boolean;
  /** Chaves de conquistas recém-desbloqueadas nesta conclusão. */
  newAchievementKeys: string[];
};

// Função para obter matrícula do usuário no curso
// Retorna matrícula com progresso das aulas
export async function getEnrollment(userId: string, courseId: string) {
  return prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId }, // Chave composta
    },
    include: {
      lessonProgresses: true, // Inclui progresso das aulas
    },
  });
}

// Função para matricular usuário em curso
// Verifica se curso está aprovado e cria matrícula se não existir
export async function enrollInCourse(userId: string, courseId: string) {
  // Busca curso com status APPROVED
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: "APPROVED" },
  });

  // Verifica se curso está disponível
  if (!course) {
    throw new Error("Curso não disponível para matrícula.");
  }

  if (course.courseType !== "FREE") {
    throw new Error("Cursos pagos ainda não estão disponíveis. Em breve.");
  }

  // Verifica se já está matriculado
  const existing = await getEnrollment(userId, courseId);
  if (existing) return existing;

  try {
    return await prisma.courseEnrollment.create({
      data: { userId, courseId },
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      const existing = await getEnrollment(userId, courseId);
      if (existing) return existing;
    }
    throw error;
  }
}

// Função para marcar aula como concluída
// Atualiza progresso da aula, do curso e concede XP
export async function markLessonComplete(
  userId: string,
  lessonId: string,
  courseId: string,
): Promise<LessonCompleteResult> {
  // Busca matrícula do usuário
  const enrollment = await getEnrollment(userId, courseId);
  if (!enrollment) {
    throw new Error("Você precisa estar matriculado no curso.");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { orderNumber: "asc" },
        include: { lessons: { orderBy: { orderNumber: "asc" } } },
      },
    },
  });

  if (!course) {
    throw new Error("Curso não encontrado.");
  }

  const allLessons = course.modules.flatMap((module) => module.lessons);
  const lessonIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex === -1) {
    throw new Error("Aula não pertence a este curso.");
  }

  if (course.progressionType === "PROGRESSIVE" && lessonIndex > 0) {
    const previousLesson = allLessons[lessonIndex - 1];
    const previousCompleted = enrollment.lessonProgresses.some(
      (progress) => progress.lessonId === previousLesson.id && progress.completed,
    );
    if (!previousCompleted) {
      throw new Error("Conclua a aula anterior para desbloquear esta.");
    }
  }

  // Busca progresso existente da aula
  const existingProgress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId, lessonId },
    },
  });

  // Verifica se aula já estava concluída e se curso já estava completo
  const alreadyCompleted = existingProgress?.completed === true;
  const wasCourseComplete = enrollment.completedAt !== null;

  // Cria ou atualiza progresso da aula como concluído
  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId, lessonId },
    },
    create: {
      userId,
      lessonId,
      enrollmentId: enrollment.id,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
  });

  // Calcula total de aulas e aulas concluídas
  const totalLessons = countTotalLessons(course.modules);
  const completedCount = await prisma.lessonProgress.count({
    where: {
      userId,
      completed: true,
      lesson: { module: { courseId } },
    },
  });

  // Calcula progresso em porcentagem
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Conclusão do curso: esta aula levou o progresso a 100% e o curso ainda
  // não estava completo (mesma condição do bônus de curso lá embaixo).
  const courseCompleted = !alreadyCompleted && progress >= 100 && !wasCourseComplete;

  // Atualiza progresso da matrícula
  await prisma.courseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      progress,
      completedAt: progress >= 100 ? new Date() : null, // Marca como completo se 100%
    },
  });

  const xpAwards: XpAward[] = [];
  const newAchievementKeys: string[] = [];

  // Concede XP apenas se aula não estava concluída
  if (!alreadyCompleted) {
    // Busca título da aula
    const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
    const lessonTitle = lesson?.title ?? "Aula";

    // Concede XP por concluir aula
    const lessonAward = await awardXp(
      userId,
      XP_REWARDS.LESSON,
      "LESSON",
      lessonId,
      `Aula concluída: ${lessonTitle}`,
    );
    if (lessonAward) xpAwards.push(lessonAward);

    await awardCoins(
      userId,
      COIN_REWARDS.LESSON,
      "LESSON",
      lessonId,
      `Aula concluída: ${lessonTitle}`,
    );

    // Busca módulo da aula
    const lessonModule = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId));

    // Verifica se módulo foi concluído e concede XP
    if (lessonModule && lessonModule.lessons.length > 0) {
      const moduleLessonIds = lessonModule.lessons.map((l) => l.id);
      const moduleCompletedCount = await prisma.lessonProgress.count({
        where: {
          userId,
          completed: true,
          lessonId: { in: moduleLessonIds },
        },
      });

      // Se todas as aulas do módulo foram concluídas, concede XP
      if (moduleCompletedCount === moduleLessonIds.length) {
        const moduleAward = await awardXp(
          userId,
          XP_REWARDS.MODULE,
          "MODULE",
          lessonModule.id,
          `Módulo concluído: ${lessonModule.title}`,
        );
        if (moduleAward) xpAwards.push(moduleAward);
        await awardCoins(
          userId,
          COIN_REWARDS.MODULE,
          "MODULE",
          lessonModule.id,
          `Módulo concluído: ${lessonModule.title}`,
        );
      }
    }

    // Verifica se curso foi concluído e concede XP
    if (courseCompleted) {
      const courseAward = await awardXp(
        userId,
        XP_REWARDS.COURSE,
        "COURSE",
        courseId,
        `Curso concluído: ${course.title}`,
      );
      if (courseAward) xpAwards.push(courseAward);

      await awardCoins(
        userId,
        COIN_REWARDS.COURSE,
        "COURSE",
        courseId,
        `Curso concluído: ${course.title}`,
      );

      // Emite certificado automaticamente quando o curso é concluído
      try {
        const certificate = await issueCertificate(userId, courseId);
        if (certificate) {
          const { recordSocialActivity } = await import("@/services/social.service");
          await recordSocialActivity(
            userId,
            "COURSE_COMPLETED",
            { course: course.title, courseSlug: course.slug },
            `cert:${certificate.id}`,
          );
        }
      } catch (error) {
        // Se o certificado já existe, ignora o erro
        console.error("Erro ao emitir certificado (pode já existir):", error);
      }

      const { syncUserAchievements } = await import("@/services/achievement.service");
      try {
        const keys = await syncUserAchievements(userId);
        for (const k of keys) {
          if (!newAchievementKeys.includes(k)) newAchievementKeys.push(k);
        }
      } catch {
        // Falha silenciosa: a action tenta sincronizar de novo.
      }
    }
  }

  if (!alreadyCompleted) {
    const { syncUserAchievements } = await import("@/services/achievement.service");
    try {
      const keys = await syncUserAchievements(userId);
      for (const k of keys) {
        if (!newAchievementKeys.includes(k)) newAchievementKeys.push(k);
      }
    } catch {
      // Falha silenciosa: a action tenta sincronizar de novo.
    }
  }

  // Calcula total de XP ganho
  const totalXpEarned = xpAwards.reduce((sum, award) => sum + award.amount, 0);

  return { progress, xpAwards, totalXpEarned, courseCompleted, newAchievementKeys };
}

// Função para obter aula com verificação de acesso
// Verifica matrícula e progressão progressiva
export async function getLessonWithAccess(userId: string, courseSlug: string, lessonId: string) {
  // Busca curso pelo slug com módulos, aulas e materiais
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      modules: {
        orderBy: { orderNumber: "asc" },
        include: {
          lessons: { orderBy: { orderNumber: "asc" } },
          materials: true,
        },
      },
    },
  });

  // Verifica se curso existe e está aprovado
  if (!course || course.status !== "APPROVED") return null;

  // Verifica se usuário está matriculado
  const enrollment = await getEnrollment(userId, course.id);
  if (!enrollment) return null;

  // Cria lista plana de todas as aulas com informações do módulo
  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleOrder: m.orderNumber })),
  );

  // Busca índice da aula na lista
  const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) return null;

  const lesson = allLessons[lessonIndex];

  // Verifica progressão progressiva: aula anterior deve estar concluída
  if (course.progressionType === "PROGRESSIVE" && lessonIndex > 0) {
    const previous = allLessons[lessonIndex - 1];
    const prevProgress = enrollment.lessonProgresses.find(
      (p) => p.lessonId === previous.id && p.completed,
    );
    if (!prevProgress) {
      throw new Error("Conclua a aula anterior para desbloquear esta.");
    }
  }

  // Busca módulo da aula
  const courseModule = course.modules.find((m) => m.id === lesson.moduleId);
  const progresses = enrollment.lessonProgresses;

  await recordStudyVisit(userId, courseSlug, lessonId);

  const completedIds = new Set(
    progresses.filter((p) => p.completed).map((p) => p.lessonId),
  );

  const learning = await buildLessonProgressContext(
    userId,
    lessonId,
    { estimatedHours: course.estimatedHours },
    allLessons.map((l) => ({ id: l.id, title: l.title, duration: l.duration })),
    completedIds,
    enrollment.progress,
  );

  return {
    course,
    enrollment,
    lesson,
    module: courseModule,
    allLessons,
    progresses,
    lessonIndex,
    learning,
  };
}

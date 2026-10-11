"use server";

import { auth } from "@/auth";
import { enrollInCourse, markLessonComplete } from "@/services/enrollment.service";
import { syncUserAchievements } from "@/services/achievement.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = {
  success: boolean;
  error?: string;
  totalXpEarned?: number;
  xpMessages?: string[];
  leveledUp?: boolean;
  newLevel?: number;
  /** true quando esta conclusão completou o curso (100%) — vira selo na UI. */
  courseCompleted?: boolean;
  /** Chaves de conquistas recém-desbloqueadas nesta ação. O cliente dispara o evento. */
  newAchievementKeys?: string[];
};

export async function enrollAction(courseId: string, courseSlug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/courses/${courseSlug}`);
  }

  await enrollInCourse(session.user.id, courseId);
  revalidatePath(`/courses/${courseSlug}`);
  redirect(`/courses/${courseSlug}/learn`);
}

export async function completeLessonAction(
  courseSlug: string,
  lessonId: string,
  courseId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    const result = await markLessonComplete(session.user.id, lessonId, courseId);

    // O serviço já sincroniza e devolve as chaves novas. Fazemos um sync
    // complementar por segurança (ex.: mocks antigos sem o campo) e unimos
    // sem duplicar — erros nunca bloqueiam o fluxo principal.
    const fromService = Array.isArray(result.newAchievementKeys)
      ? result.newAchievementKeys
      : [];
    let extraKeys: string[] = [];
    try {
      extraKeys = await syncUserAchievements(session.user.id);
    } catch {
      // Falha silenciosa: conquistas virão na próxima sincronização.
    }
    const newAchievementKeys = [...new Set([...fromService, ...extraKeys])];

    revalidatePath("/");
    revalidatePath(`/courses/${courseSlug}/learn`);
    revalidatePath(`/courses/${courseSlug}/learn/${lessonId}`);
    revalidatePath("/perfil");
    revalidatePath("/ranking");

    const xpMessages = result.xpAwards.map((award) => {
      const levelMsg = award.leveledUp ? ` — Nível ${award.newLevel}!` : "";
      return `+${award.amount} XP: ${award.description}${levelMsg}`;
    });

    const levelUpAward = result.xpAwards.find((award) => award.leveledUp);

    return {
      success: true,
      totalXpEarned: result.totalXpEarned,
      xpMessages,
      leveledUp: Boolean(levelUpAward),
      newLevel: levelUpAward?.newLevel,
      courseCompleted: result.courseCompleted,
      newAchievementKeys,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao marcar aula",
    };
  }
}

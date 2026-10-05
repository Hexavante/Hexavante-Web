"use server";

import { auth } from "@/auth";
import { enrollInCourse, markLessonComplete } from "@/services/enrollment.service";
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
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao marcar aula",
    };
  }
}

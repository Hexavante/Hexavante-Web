"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { saveLessonNote, toggleLessonFavorite } from "@/services/lesson-learning.service";

export type LessonLearningActionResult = {
  success: boolean;
  error?: string;
  isFavorite?: boolean;
};

export async function toggleLessonFavoriteAction(
  courseSlug: string,
  lessonId: string,
): Promise<LessonLearningActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    const isFavorite = await toggleLessonFavorite(session.user.id, lessonId);
    revalidatePath(`/courses/${courseSlug}/learn/${lessonId}`);
    revalidatePath("/");
    return { success: true, isFavorite };
  } catch {
    return { success: false, error: "Não foi possível atualizar o favorito." };
  }
}

export async function saveLessonNoteAction(
  courseSlug: string,
  lessonId: string,
  content: string,
): Promise<LessonLearningActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  if (content.length > 5000) {
    return { success: false, error: "A nota pode ter no máximo 5.000 caracteres." };
  }

  try {
    await saveLessonNote(session.user.id, lessonId, content);
    revalidatePath(`/courses/${courseSlug}/learn/${lessonId}`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível salvar a nota." };
  }
}

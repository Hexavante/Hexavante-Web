"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setExamQuestionFavorite } from "@/services/exam-learning.service";

export type ExamLearningActionResult = {
  success: boolean;
  error?: string;
  isFavorite?: boolean;
};

export async function setExamQuestionFavoriteAction(
  examSlug: string,
  questionId: string,
  favorite: boolean,
  attemptId?: string,
): Promise<ExamLearningActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    if (typeof favorite !== "boolean") return { success: false, error: "Opção de favorito inválida." };
    await setExamQuestionFavorite(session.user.id, questionId, favorite);
    revalidatePath(`/simulados/${examSlug}`);
    if (attemptId) {
      revalidatePath(`/simulados/${examSlug}/resultado/${attemptId}`);
    }
    return { success: true, isFavorite: favorite };
  } catch {
    return { success: false, error: "Não foi possível atualizar o favorito." };
  }
}

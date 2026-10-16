"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { toggleExamQuestionFavorite } from "@/services/exam-learning.service";

export type ExamLearningActionResult = {
  success: boolean;
  error?: string;
  isFavorite?: boolean;
};

export async function toggleExamQuestionFavoriteAction(
  examSlug: string,
  questionId: string,
  attemptId?: string,
): Promise<ExamLearningActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    const isFavorite = await toggleExamQuestionFavorite(session.user.id, questionId);
    revalidatePath(`/simulados/${examSlug}`);
    if (attemptId) {
      revalidatePath(`/simulados/${examSlug}/resultado/${attemptId}`);
    }
    return { success: true, isFavorite };
  } catch {
    return { success: false, error: "Não foi possível atualizar o favorito." };
  }
}

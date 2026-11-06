"use server";

import { auth } from "@/auth";
import { requireModeratorAccount } from "@/lib/moderation/guards";
import { isInstructor } from "@/lib/permissions";
import { essayGradeSchema } from "@/lib/validations/exam";
import { gradeEssayAnswer } from "@/services/exam-grading.service";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: boolean; error?: string };

async function requireInstructor() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Faça login para continuar.");
  }
  if (!isInstructor(session.user.roles)) {
    throw new Error("Você precisa do papel INSTRUCTOR para corrigir simulados.");
  }
  return session.user;
}

export async function gradeEssayAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const moderator = await requireModeratorAccount();
    const parsed = essayGradeSchema.safeParse({
      answerId: formData.get("answerId"),
      status: formData.get("status"),
      comment: formData.get("comment") || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    await gradeEssayAnswer(parsed.data, moderator.id);
    revalidatePath("/admin/simulados/correcoes");
    revalidatePath("/simulados");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao corrigir resposta",
    };
  }
}

export async function gradeEssayAsInstructorAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const instructor = await requireInstructor();
    const parsed = essayGradeSchema.safeParse({
      answerId: formData.get("answerId"),
      status: formData.get("status"),
      comment: formData.get("comment") || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    await gradeEssayAnswer(parsed.data, instructor.id, { instructorId: instructor.id });
    revalidatePath("/instructor/simulados/correcoes");
    revalidatePath("/instructor/simulados");
    revalidatePath("/simulados");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao corrigir resposta",
    };
  }
}

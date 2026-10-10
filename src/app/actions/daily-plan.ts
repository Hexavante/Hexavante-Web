"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { completeDailyTask, getOrCreateDailyPlan } from "@/services/daily-plan.service";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export async function completeDailyTaskAction(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    const updatedPlan = await completeDailyTask(session.user.id, taskId);
    revalidatePath("/plano-diario");
    revalidatePath("/app");
    return { success: true, plan: updatedPlan };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return { success: false, error: "migration_pending" };
    }
    logger.error("Erro ao completar tarefa do plano diário", err, { taskId, userId: session.user.id });
    return { success: false, error: "Erro ao atualizar tarefa" };
  }
}

export async function refreshDailyPlanAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    const plan = await getOrCreateDailyPlan(session.user.id);
    revalidatePath("/plano-diario");
    revalidatePath("/app");
    return { success: true, plan };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return { success: false, error: "migration_pending" };
    }
    logger.error("Erro ao atualizar plano diário", err, { userId: session.user.id });
    return { success: false, error: "Erro ao carregar plano" };
  }
}

"use server";

import { auth } from "@/auth";
import { submitExamSchema } from "@/lib/validations/exam";
import { getActiveAttempt, startAttempt, submitAttempt } from "@/services/exam.service";
import { syncUserAchievements } from "@/services/achievement.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { success: boolean; error?: string };
const MARATHON_ACHIEVEMENT_KEY = "maratona_100";

function parseExamSubmission(formData: FormData) {
  const answers: Record<string, string> = {};
  const essays: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("q_")) {
      answers[key.replace("q_", "")] = value as string;
    }
    if (key.startsWith("essay_")) {
      essays[key.replace("essay_", "")] = value as string;
    }
  }

  return { answers, essays };
}

export async function startExamAction(examId: string, slug: string, mode?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/simulados/${slug}`);
  }

  const studyMode =
    mode === "REINFORCEMENT" || mode === "FAVORITES" ? mode : ("FULL" as const);

  const active = await getActiveAttempt(session.user.id, examId);
  if (active) {
    redirect(`/simulados/${slug}/fazer?attempt=${active.id}`);
  }

  let attempt;
  try {
    attempt = await startAttempt(session.user.id, examId, studyMode);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível iniciar o simulado.";
    redirect(`/simulados/${slug}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/simulados/${slug}/fazer?attempt=${attempt.id}`);
}

export async function submitExamAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  const attemptId = formData.get("attemptId") as string;
  const slug = formData.get("slug") as string;
  const { answers, essays } = parseExamSubmission(formData);

  const parsed = submitExamSchema.safeParse({ attemptId, answers, essays });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let celebrateMarathon = false;
  let serviceAchievementKeys: string[] = [];
  try {
    const result = await submitAttempt(session.user.id, parsed.data.attemptId, {
      answers: parsed.data.answers,
      essays: parsed.data.essays,
    });
    celebrateMarathon = result.celebrateMarathon;
    serviceAchievementKeys = Array.isArray(result.newAchievements)
      ? result.newAchievements
      : [];
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao enviar simulado",
    };
  }

  // Sincroniza conquistas após submissão. Erros não bloqueiam o redirect.
  // `submitAttempt` já sincroniza e devolve as chaves — unimos com um sync
  // complementar (normalmente vazio) para não perder nenhum desbloqueio.
  let syncedKeys: string[] = [];
  try {
    syncedKeys = await syncUserAchievements(session.user.id);
  } catch {
    // Falha silenciosa.
  }
  const newAchievementKeys = [...new Set([...serviceAchievementKeys, ...syncedKeys])];

  revalidatePath("/simulados");
  revalidatePath("/historico");
  revalidatePath("/perfil");
  revalidatePath("/ranking");

  // Monta a query string para o resultado:
  // - `conquista` mantém o comportamento legado (animação da Pantera)
  // - `achievements` passa as chaves novas para o toast de conquista
  const query = new URLSearchParams();
  if (celebrateMarathon) {
    query.set("conquista", MARATHON_ACHIEVEMENT_KEY);
  }
  // Remove a maratona das keys extras (já tratada pelo PanteraConquista)
  const extraKeys = newAchievementKeys.filter((k) => k !== MARATHON_ACHIEVEMENT_KEY);
  if (extraKeys.length > 0) {
    query.set("achievements", extraKeys.join(","));
  }
  const qs = query.toString() ? `?${query.toString()}` : "";
  redirect(`/simulados/${slug}/resultado/${parsed.data.attemptId}${qs}`);
}

export async function submitExamTimeoutAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  const attemptId = formData.get("attemptId") as string;
  const slug = formData.get("slug") as string;
  const { answers, essays } = parseExamSubmission(formData);

  let celebrateMarathon = false;
  let serviceAchievementKeys: string[] = [];
  try {
    const result = await submitAttempt(
      session.user.id,
      attemptId,
      { answers, essays },
      { allowPartial: true },
    );
    celebrateMarathon = result.celebrateMarathon;
    serviceAchievementKeys = Array.isArray(result.newAchievements)
      ? result.newAchievements
      : [];
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao enviar simulado",
    };
  }

  // Sincroniza conquistas após submissão por timeout (complementar ao sync
  // interno de `submitAttempt`).
  let syncedKeys: string[] = [];
  try {
    syncedKeys = await syncUserAchievements(session.user.id);
  } catch {
    // Falha silenciosa.
  }
  const newAchievementKeys = [...new Set([...serviceAchievementKeys, ...syncedKeys])];

  revalidatePath("/simulados");
  revalidatePath("/historico");
  revalidatePath("/perfil");
  revalidatePath("/ranking");

  const query = new URLSearchParams();
  if (celebrateMarathon) {
    query.set("conquista", MARATHON_ACHIEVEMENT_KEY);
  }
  const extraKeys = newAchievementKeys.filter((k) => k !== MARATHON_ACHIEVEMENT_KEY);
  if (extraKeys.length > 0) {
    query.set("achievements", extraKeys.join(","));
  }
  const qs = query.toString() ? `?${query.toString()}` : "";
  redirect(`/simulados/${slug}/resultado/${attemptId}${qs}`);
}

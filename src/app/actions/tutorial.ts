"use server";

import { canPublishTutorialVideo } from "@/lib/video";
import { lessonContent } from "@/lib/mind-map";
import { auth } from "@/auth";
import { isInstructor } from "@/lib/permissions";
import {
  createTutorial,
  updateTutorial,
  deleteTutorial,
  setTutorialTags,
} from "@/services/tutorial.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { success: boolean; error?: string };

async function requireInstructor() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Faça login para continuar.");
  }
  if (!isInstructor(session.user.roles)) {
    throw new Error("Você precisa do papel INSTRUCTOR para gerenciar tutoriais.");
  }
  return session.user;
}

export async function createTutorialAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let user;
  try {
    user = await requireInstructor();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sem permissão",
    };
  }

  let tutorialId: string | null = null;

  try {
    const title = formData.get("title")?.toString().trim();
    if (!title || title.length < 3) {
      return { success: false, error: "Título muito curto (mínimo 3 caracteres)" };
    }

    const videoUrl = formData.get("videoUrl")?.toString().trim() ?? "";
    const isPublished = formData.get("isPublished") === "true";
    if (isPublished && !canPublishTutorialVideo(videoUrl)) {
      return { success: false, error: "Para publicar, informe um link de vídeo do YouTube, Vimeo, TeraBox ou um arquivo de vídeo. Você também pode salvar um rascunho." };
    }

    const durationRaw = formData.get("duration")?.toString().trim();
    const duration = durationRaw ? Number(durationRaw) : undefined;
    if (duration !== undefined && (isNaN(duration) || duration < 1)) {
      return { success: false, error: "Duração inválida" };
    }

    const tutorial = await createTutorial(user.id, {
      title,
      categoryId: formData.get("categoryId")?.toString().trim() || undefined,
      description: lessonContent(formData),
      videoUrl,
      thumbnailUrl: formData.get("thumbnailUrl")?.toString() || undefined,
      duration,
      isPublished,
    });

    const tagNames = (formData.get("tags")?.toString() ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (tagNames.length > 0) await setTutorialTags(tutorial.id, tagNames);

    tutorialId = tutorial.id;
    revalidatePath("/tutorials");
    revalidatePath("/instructor/tutorials");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar tutorial",
    };
  }

  redirect(`/instructor/tutorials`);
}

export async function updateTutorialAction(
  tutorialId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let user;
  try {
    user = await requireInstructor();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sem permissão",
    };
  }

  try {
    const title = formData.get("title")?.toString().trim();
    if (!title || title.length < 3) {
      return { success: false, error: "Título muito curto (mínimo 3 caracteres)" };
    }

    const videoUrl = formData.get("videoUrl")?.toString().trim() ?? "";
    const isPublished = formData.get("isPublished") === "true";
    if (isPublished && !canPublishTutorialVideo(videoUrl)) {
      return { success: false, error: "Para publicar, informe um link de vídeo do YouTube, Vimeo, TeraBox ou um arquivo de vídeo. Você também pode salvar um rascunho." };
    }

    const durationRaw = formData.get("duration")?.toString().trim();
    const duration = durationRaw ? Number(durationRaw) : undefined;
    if (duration !== undefined && (isNaN(duration) || duration < 1)) {
      return { success: false, error: "Duração inválida" };
    }

    await updateTutorial(tutorialId, user.id, {
      title,
      categoryId: formData.get("categoryId")?.toString().trim() || undefined,
      description: lessonContent(formData),
      videoUrl,
      thumbnailUrl:
        formData.get("removeThumbnail") === "true"
          ? null
          : formData.get("thumbnailUrl")?.toString() || undefined,
      duration,
      isPublished,
    });

    const tagNames = (formData.get("tags")?.toString() ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await setTutorialTags(tutorialId, tagNames);

    revalidatePath("/tutorials");
    revalidatePath("/instructor/tutorials");
    revalidatePath(`/instructor/tutorials/${tutorialId}/edit`);
    revalidatePath("/instructor/gerenciar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar tutorial",
    };
  }
}

export async function deleteTutorialAction(tutorialId: string) {
  try {
    const user = await requireInstructor();
    await deleteTutorial(tutorialId, user.id);
    revalidatePath("/tutorials");
    revalidatePath("/instructor/tutorials");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir tutorial",
    };
  }
}

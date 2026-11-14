"use server";
import { auth } from "@/auth";
import {
  getNotebook,
  saveNotebookPage,
  NotebookError,
} from "@/services/notebook.service";
import type { NotebookData, NotebookResult, NotebookSaveData } from "@/lib/notebook";

export async function loadNotebookAction(): Promise<
  NotebookResult<NotebookData>
> {
  const session = await auth();
  if (!session?.user?.id)
    return {
      success: false,
      error: "Entre na sua conta para abrir o caderno.",
    };
  try {
    return { success: true, data: await getNotebook(session.user.id) };
  } catch (error) {
    console.error("[caderno] Falha ao carregar:", error);
    return {
      success: false,
      error: "Não foi possível abrir o caderno. Tente novamente em instantes.",
    };
  }
}
export async function saveNotebookPageAction(
  input: unknown,
): Promise<NotebookResult<NotebookSaveData>> {
  const session = await auth();
  if (!session?.user?.id)
    return {
      success: false,
      error: "Sua sessão expirou. Copie seu texto antes de entrar novamente.",
    };
  try {
    return {
      success: true,
      data: await saveNotebookPage(session.user.id, input),
    };
  } catch (error) {
    console.error("[caderno] Falha ao salvar:", error);
    return {
      success: false,
      error:
        error instanceof NotebookError
          ? error.message
          : "Não foi possível salvar. Seu texto continua aqui; tente novamente.",
    };
  }
}

"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  updateUserNotificationSettings,
  type UserNotificationSettingsView,
} from "@/services/notification-preferences.service";

export type ActionResult = { success: boolean; error?: string };

export async function updateNotificationPreferencesAction(
  settings: UserNotificationSettingsView,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    await updateUserNotificationSettings(session.user.id, settings);
    revalidatePath("/configuracoes/notificacoes");
    revalidatePath("/notificacoes");
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível salvar as preferências." };
  }
}

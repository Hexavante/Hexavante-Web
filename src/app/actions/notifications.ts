"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import type { NotificationType } from "@prisma/client";

export type ActionResult = { success: boolean; error?: string };

export type WebNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listRecentNotificationsAction(): Promise<{
  notifications: WebNotification[];
  unreadCount: number;
}> {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(session.user.id, 10),
    getUnreadNotificationCount(session.user.id),
  ]);

  return {
    notifications: notifications.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      link: row.link,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    unreadCount,
  };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  await markAllNotificationsRead(session.user.id);
  revalidatePath("/notificacoes");
  return { success: true };
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  await markNotificationRead(notificationId, session.user.id);
  revalidatePath("/notificacoes");
  return { success: true };
}

import type { NotificationType } from "@prisma/client";
import {
  getPreferenceKeyForType,
  isRankingSeasonNotification,
  type NotificationPreferenceKey,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type UserNotificationSettingsView = Record<NotificationPreferenceKey, boolean>;

const DEFAULT_SETTINGS: UserNotificationSettingsView = {
  learningProgress: true,
  certificates: true,
  courseUpdates: true,
  messages: true,
  community: true,
  moderation: true,
  coinsAndRewards: true,
  rankingSeason: true,
  systemAnnouncements: true,
};

export async function getUserNotificationSettings(
  userId: string,
): Promise<UserNotificationSettingsView> {
  const row = await prisma.userNotificationSettings.findUnique({ where: { userId } });
  if (!row) return { ...DEFAULT_SETTINGS };

  return {
    learningProgress: row.learningProgress,
    certificates: row.certificates,
    courseUpdates: row.courseUpdates,
    messages: row.messages,
    community: row.community,
    moderation: row.moderation,
    coinsAndRewards: row.coinsAndRewards,
    rankingSeason: row.rankingSeason,
    systemAnnouncements: row.systemAnnouncements,
  };
}

export async function updateUserNotificationSettings(
  userId: string,
  input: Partial<UserNotificationSettingsView>,
): Promise<UserNotificationSettingsView> {
  const row = await prisma.userNotificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_SETTINGS,
      ...input,
    },
    update: input,
  });

  return {
    learningProgress: row.learningProgress,
    certificates: row.certificates,
    courseUpdates: row.courseUpdates,
    messages: row.messages,
    community: row.community,
    moderation: row.moderation,
    coinsAndRewards: row.coinsAndRewards,
    rankingSeason: row.rankingSeason,
    systemAnnouncements: row.systemAnnouncements,
  };
}

export async function isNotificationTypeEnabled(
  userId: string,
  type: NotificationType,
  link: string | null,
): Promise<boolean> {
  const settings = await getUserNotificationSettings(userId);

  if (isRankingSeasonNotification(type, link)) {
    return settings.rankingSeason;
  }

  const key = getPreferenceKeyForType(type);
  return settings[key];
}

import type { NotificationType } from "@prisma/client";
import {
  Award,
  Bell,
  BookOpen,
  Coins,
  GraduationCap,
  MessageCircle,
  Shield,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NotificationPreferenceKey =
  | "learningProgress"
  | "certificates"
  | "courseUpdates"
  | "messages"
  | "community"
  | "moderation"
  | "coinsAndRewards"
  | "rankingSeason"
  | "systemAnnouncements";

export type NotificationPreferenceDef = {
  key: NotificationPreferenceKey;
  title: string;
  description: string;
};

export const NOTIFICATION_PREFERENCE_GROUPS: {
  title: string;
  items: NotificationPreferenceDef[];
}[] = [
  {
    title: "Aprendizado",
    items: [
      {
        key: "learningProgress",
        title: "XP e nível",
        description: "Quando você sobe de nível ou ganha marcos importantes.",
      },
      {
        key: "certificates",
        title: "Certificados",
        description: "Emissão de certificados ao concluir cursos.",
      },
      {
        key: "courseUpdates",
        title: "Cursos atualizados",
        description: "Novas aulas, módulos ou materiais nos cursos matriculados.",
      },
    ],
  },
  {
    title: "Social",
    items: [
      {
        key: "community",
        title: "Comunidade",
        description: "Respostas em suas publicações e soluções aceitas.",
      },
    ],
  },
  {
    title: "Conta e sistema",
    items: [
      {
        key: "coinsAndRewards",
        title: "Moedas e recompensas",
        description: "Ganhos de moedas e recompensas da plataforma.",
      },
      {
        key: "rankingSeason",
        title: "Temporada de ranking",
        description: "Resultado das ligas e fim de temporada.",
      },
      {
        key: "moderation",
        title: "Moderação",
        description: "Aprovações, rejeições e avisos da equipe.",
      },
      {
        key: "systemAnnouncements",
        title: "Anúncios",
        description: "Comunicados gerais da plataforma.",
      },
    ],
  },
];

const PREFERENCE_BY_TYPE: Record<NotificationType, NotificationPreferenceKey> = {
  XP_EARNED: "learningProgress",
  LEVEL_UP: "learningProgress",
  CERTIFICATE_ISSUED: "certificates",
  COURSE_UPDATED: "courseUpdates",
  NEW_MESSAGE: "messages",
  COMMUNITY_REPLY: "community",
  SOLUTION_ACCEPTED: "community",
  COIN_EARNED: "coinsAndRewards",
  COURSE_APPROVED: "moderation",
  COURSE_REJECTED: "moderation",
  INSTRUCTOR_APPROVED: "moderation",
  INSTRUCTOR_REJECTED: "moderation",
  MODERATION_ACTION: "moderation",
  SYSTEM_ANNOUNCEMENT: "systemAnnouncements",
};

export function getPreferenceKeyForType(type: NotificationType): NotificationPreferenceKey {
  return PREFERENCE_BY_TYPE[type];
}

export function isRankingSeasonNotification(type: NotificationType, link: string | null): boolean {
  return type === "XP_EARNED" && link === "/ranking";
}

export const NOTIFICATION_DEDUPE_MINUTES: Partial<Record<NotificationType, number>> = {
  XP_EARNED: 60,
  COIN_EARNED: 30,
  NEW_MESSAGE: 10,
  COMMUNITY_REPLY: 15,
  COURSE_UPDATED: 24 * 60,
};

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; accent: string }
> = {
  XP_EARNED: { icon: Sparkles, accent: "text-sky-300" },
  LEVEL_UP: { icon: Trophy, accent: "text-amber-300" },
  CERTIFICATE_ISSUED: { icon: GraduationCap, accent: "text-amber-200" },
  COURSE_UPDATED: { icon: BookOpen, accent: "text-teal-300" },
  COURSE_APPROVED: { icon: BookOpen, accent: "text-emerald-300" },
  COURSE_REJECTED: { icon: BookOpen, accent: "text-rose-300" },
  INSTRUCTOR_APPROVED: { icon: Award, accent: "text-emerald-300" },
  INSTRUCTOR_REJECTED: { icon: Award, accent: "text-rose-300" },
  COIN_EARNED: { icon: Coins, accent: "text-amber-300" },
  NEW_MESSAGE: { icon: MessageCircle, accent: "text-violet-300" },
  COMMUNITY_REPLY: { icon: Users, accent: "text-sky-300" },
  SOLUTION_ACCEPTED: { icon: Award, accent: "text-emerald-300" },
  MODERATION_ACTION: { icon: Shield, accent: "text-orange-300" },
  SYSTEM_ANNOUNCEMENT: { icon: Bell, accent: "text-slate-300" },
};

export function resolveNotificationLink(link: string | null): string | null {
  if (!link) return null;
  if (link === "/mensagens" || link.startsWith("/mensagens/")) {
    return "/";
  }
  return link;
}

export function formatNotificationRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

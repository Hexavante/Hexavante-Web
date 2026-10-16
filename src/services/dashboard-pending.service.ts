import { getStudyContinuation } from "@/services/study-continuation.service";
import { getUnreadNotificationCount } from "@/services/notification.service";
import { getPersonalStats } from "@/services/personal-stats.service";

export type DashboardPendingItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  tone: "sky" | "violet" | "amber" | "orange" | "emerald";
  priority: number;
};

export async function getDashboardPendingItems(userId: string): Promise<DashboardPendingItem[]> {
  const [continuation, unreadNotifs, stats] = await Promise.all([
    getStudyContinuation(userId),
    getUnreadNotificationCount(userId),
    getPersonalStats(userId),
  ]);

  const items: DashboardPendingItem[] = [];

  if (continuation) {
    items.push({
      id: "continue",
      label: continuation.type === "exam" ? "Retomar simulado" : "Retomar estudo",
      description:
        continuation.type === "exam"
          ? (continuation.examTitle ?? "Simulado em andamento")
          : `${continuation.courseTitle} · ${continuation.lessonTitle}`,
      href: continuation.href,
      tone: "sky",
      priority: 0,
    });
  }

  if (unreadNotifs > 0) {
    items.push({
      id: "notifications",
      label: "Notificações",
      description: `${unreadNotifs} pendente${unreadNotifs > 1 ? "s" : ""}`,
      href: "/notificacoes",
      tone: "violet",
      priority: 1,
    });
  }

  if (stats.studyStreakDays >= 2) {
    items.push({
      id: "streak",
      label: "Sequência ativa",
      description: `${stats.studyStreakDays} dias seguidos`,
      href: "/ranking",
      tone: "emerald",
      priority: 4,
    });
  } else if (!continuation) {
    items.push({
      id: "start-today",
      label: "Estudar hoje",
      description: "Comece ou retome um curso",
      href: "/courses",
      tone: "orange",
      priority: 3,
    });
  }

  if (stats.coursesCompleted > 0 && stats.certificatesCount < stats.coursesCompleted) {
    items.push({
      id: "certificates",
      label: "Certificados",
      description: "Veja conquistas para compartilhar",
      href: "/certificados",
      tone: "amber",
      priority: 5,
    });
  }

  return items.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

export type DashboardQuickAction = {
  href: string;
  label: string;
};

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  { href: "/courses", label: "Cursos" },
  { href: "/simulados", label: "Simulados" },
  { href: "/historico", label: "Histórico" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/ranking", label: "Ranking" },
  { href: "/certificados", label: "Certificados" },
  { href: "/live-rooms", label: "Ao vivo" },
];

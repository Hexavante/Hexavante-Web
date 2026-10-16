import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Settings2 } from "lucide-react";
import { auth } from "@/auth";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type { NotificationView } from "@/components/notifications/notification-item";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import {
  getNotificationsPage,
  getUnreadNotificationCount,
} from "@/services/notification.service";

function serializeNotifications(
  rows: Awaited<ReturnType<typeof getNotificationsPage>>,
): NotificationView[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export default async function NotificacoesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/notificacoes");

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsPage(session.user.id, { limit: 40 }),
    getUnreadNotificationCount(session.user.id),
  ]);

  return (
    <PageShell size="md">
      <PageHeader
        badge="Conta"
        icon={Bell}
        title="Notificações"
        description="Alertas sobre cursos, mensagens, certificados e progresso."
        action={
          <Link
            href="/configuracoes/notificacoes"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-400/30 hover:text-white"
          >
            <Settings2 className="h-4 w-4" />
            Preferências
          </Link>
        }
      />

      <div className="mt-6">
        <NotificationCenter
          initialNotifications={serializeNotifications(notifications)}
          initialUnreadCount={unreadCount}
        />
      </div>
    </PageShell>
  );
}

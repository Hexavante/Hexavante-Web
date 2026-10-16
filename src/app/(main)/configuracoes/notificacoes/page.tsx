import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { auth } from "@/auth";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { PageShell } from "@/components/ui/page-shell";
import { getUserNotificationSettings } from "@/services/notification-preferences.service";

export default async function ConfiguracoesNotificacoesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/configuracoes/notificacoes");

  const settings = await getUserNotificationSettings(session.user.id);

  return (
    <PageShell size="md">
      <Link
        href="/configuracoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 transition hx-accent-link"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às configurações
      </Link>

      <div className="flex items-center gap-3">
        <span className="hx-icon-box">
          <Bell className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black text-white">Notificações</h1>
          <p className="mt-1 text-sm text-slate-400">
            Escolha o que vale a pena te avisar. Só eventos que mudam sua jornada.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <NotificationPreferencesForm initialSettings={settings} />
      </div>
    </PageShell>
  );
}

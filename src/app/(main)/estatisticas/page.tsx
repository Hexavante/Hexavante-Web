import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { auth } from "@/auth";
import { PersonalStatsView } from "@/components/stats/personal-stats-view";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { getPersonalStats, getPersonalStatsCharts } from "@/services/personal-stats.service";

export default async function StatisticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/estatisticas");

  const [stats, charts] = await Promise.all([
    getPersonalStats(session.user.id),
    getPersonalStatsCharts(session.user.id),
  ]);

  return (
    <PageShell>
      <div className="anim-enter anim-d1">
        <PageHeader
          badge="Progresso"
          icon={BarChart3}
          title="Estatísticas"
          description="Visão completa do seu desempenho: XP, cursos, simulados, sequência e conquistas."
        />
      </div>

      <div className="anim-enter anim-d2">
        <PersonalStatsView stats={stats} charts={charts} variant="full" showHeader={false} />
      </div>
    </PageShell>
  );
}
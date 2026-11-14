import { redirect } from "next/navigation";
import { BarChart3, BookOpen, Target } from "lucide-react";
import { auth } from "@/auth";
import { PersonalStatsView } from "@/components/stats/personal-stats-view";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { LinkButton } from "@/components/ui/button";
import { getPersonalStats, getPersonalStatsCharts } from "@/services/personal-stats.service";
import { logger } from "@/lib/logger";

export default async function StatisticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/estatisticas");

  const userId = session.user.id;
  let stats = null;
  let charts = null;
  let loadError = false;

  try {
    [stats, charts] = await Promise.all([
      getPersonalStats(userId),
      getPersonalStatsCharts(userId),
    ]);
  } catch (err) {
    logger.error("Erro ao carregar estatísticas pessoais", err, { userId });
    loadError = true;
  }

  return (
    <PageShell>
      <div className=" ">
        <PageHeader
          badge="Progresso"
          icon={BarChart3}
          title="Estatísticas"
          description="Visão completa do seu desempenho: XP, cursos, simulados, sequência e conquistas."
        />
      </div>

      {loadError ? (
        <div className=" mt-8 flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
          <BarChart3 className="h-10 w-10 text-red-400" aria-hidden />
          <p className="text-lg font-semibold text-white">Não foi possível carregar as estatísticas</p>
          <p className="max-w-md text-sm text-slate-400">
            Houve um problema ao buscar seus dados. Tente novamente em alguns instantes. Se o erro
            persistir, entre em contato com o suporte.
          </p>
          <LinkButton href="/app" variant="outline" size="sm">
            Voltar ao painel
          </LinkButton>
        </div>
      ) : stats && charts ? (
        /* Usuário com dados */
        <div className=" ">
          <PersonalStatsView stats={stats} charts={charts} variant="full" showHeader={false} />
        </div>
      ) : (
        /* Usuário novo sem histórico — estado vazio útil */
        <div className=" mt-8 flex flex-col items-center gap-6 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-14 text-center">
          <BarChart3 className="h-12 w-12 text-slate-500" aria-hidden />
          <div>
            <p className="text-xl font-bold text-white">Nada por aqui ainda</p>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Comece a estudar para ver suas estatísticas de XP, aulas, simulados e sequência de dias
              aparecerem aqui.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/courses" size="sm">
              <BookOpen className="h-4 w-4" />
              Explorar cursos
            </LinkButton>
            <LinkButton href="/simulados" variant="outline" size="sm">
              <Target className="h-4 w-4" />
              Fazer um simulado
            </LinkButton>
          </div>
        </div>
      )}
    </PageShell>
  );
}

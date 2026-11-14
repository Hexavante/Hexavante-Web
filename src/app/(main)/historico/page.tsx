import { Suspense } from "react";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { auth } from "@/auth";
import { ExamEvolutionChart } from "@/components/exams/exam-evolution-chart";
import { ExamSubjectStatsPanel } from "@/components/exams/exam-subject-stats-panel";
import { AtividadesTab } from "@/components/historico/atividades-tab";
import { CursosTab } from "@/components/historico/cursos-tab";
import { HistoricoTabs } from "@/components/historico/historico-tabs";
import {
  CursosProgressoPanel,
  DistribuicaoResultadosPanel,
} from "@/components/historico/overview-panels";
import { OverviewTab } from "@/components/historico/overview-tab";
import { SimuladosTab } from "@/components/historico/simulados-tab";
import { AppLink } from "@/components/ui/app-link";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import {
  buildHistoricoLoginCallback,
  parseAtividadeTipo,
  parseCursoOrdenacao,
  parseCursoStatus,
  parseHistoricoAba,
  parsePageNumber,
  parsePeriodo,
  parseSimuladoOrdenacao,
  parseSimuladoTipo,
  pickQuery,
} from "@/lib/historico";
import { getUserExamEvolution } from "@/services/exam.service";
import { getUserGlobalSubjectStats } from "@/services/exam-learning.service";
import {
  getHistoricoAtividades,
  getHistoricoCursos,
  getHistoricoOverview,
  getHistoricoSimulados,
} from "@/services/historico.service";

type SearchParams = {
  aba?: string;
  q?: string;
  search?: string;
  page?: string;
  tipo?: string;
  examType?: string;
  filter?: string;
  filtro?: string;
  status?: string;
  periodo?: string;
  ordenacao?: string;
  ordem?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function HistoricoPage({ searchParams }: Props) {
  const params = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect(buildHistoricoLoginCallback(params));

  const userId = session.user.id;
  const aba = parseHistoricoAba(params.aba);
  const q = pickQuery(params.q, params.search);
  const page = parsePageNumber(params.page);
  const periodo = parsePeriodo(params.periodo);

  let content: React.ReactNode;

  if (aba === "cursos") {
    const filter = parseCursoStatus(pickQuery(params.filter, params.filtro, params.status));
    const ordenacao = parseCursoOrdenacao(params.ordenacao ?? params.ordem);
    const data = await getHistoricoCursos(userId, { page, q, filter, periodo, ordenacao });
    content = (
      <CursosTab
        data={data}
        currentPage={page}
        q={q}
        filter={filter}
        periodo={periodo}
        ordenacao={ordenacao}
      />
    );
  } else if (aba === "simulados") {
    const tipo = parseSimuladoTipo(params.tipo ?? params.examType);
    const ordenacao = parseSimuladoOrdenacao(params.ordenacao ?? params.ordem);
    const data = await getHistoricoSimulados(userId, { page, q, tipo, periodo, ordenacao });
    content = (
      <SimuladosTab
        data={data}
        currentPage={page}
        q={q}
        tipo={tipo}
        periodo={periodo}
        ordenacao={ordenacao}
      />
    );
  } else if (aba === "atividades") {
    const tipoFiltro = parseAtividadeTipo(params.tipo);
    const data = await getHistoricoAtividades(userId, { page, q, tipo: tipoFiltro, periodo });
    content = (
      <AtividadesTab data={data} currentPage={page} q={q} tipoFiltro={tipoFiltro} periodo={periodo} />
    );
  } else {
    const [overview, evolution, subjectStats, emAndamento] = await Promise.all([
      getHistoricoOverview(userId),
      getUserExamEvolution(userId, 12),
      getUserGlobalSubjectStats(userId),
      getHistoricoCursos(userId, { page: 1, filter: "inProgress", ordenacao: "progresso_desc" }),
    ]);
    content = (
      <div className="space-y-6">
        <OverviewTab data={overview} />

        <ExamEvolutionChart data={evolution} />

        {subjectStats.length > 0 && (
          <ExamSubjectStatsPanel
            stats={subjectStats}
            title="Desempenho por assunto (todos os simulados)"
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <CursosProgressoPanel items={emAndamento.items.slice(0, 5)} />
          <DistribuicaoResultadosPanel
            distribution={overview.scoreDistribution}
            total={overview.totalExams}
          />
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <div className=" ">
        <PageHeader
          badge="Minha jornada"
          icon={History}
          title="Histórico"
          description="Cursos, simulados e atividades em um só lugar."
          action={
            <div className="flex flex-wrap gap-2">
              <AppLink href="/courses" muted>
                Explorar cursos
              </AppLink>
              <AppLink href="/simulados" muted>
                Ver simulados
              </AppLink>
            </div>
          }
        />
      </div>

      <div className="mb-6 ">
        <Suspense>
          <HistoricoTabs activeTab={aba} />
        </Suspense>
      </div>

      <div className=" ">{content}</div>
    </PageShell>
  );
}

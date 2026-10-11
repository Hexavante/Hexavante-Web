import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { EXAM_PASS_SCORE } from "@/lib/gamification";
import { EXAM_TYPE_LABELS } from "@/lib/validations/exam";
import { PERIODO_OPTIONS, SIMULADO_ORDENACAO_OPTIONS } from "@/lib/historico";
import type { HistoricoSimuladosResult } from "@/services/historico.service";

type Props = {
  data: HistoricoSimuladosResult;
  currentPage: number;
  q?: string;
  tipo?: string;
  periodo?: string;
  ordenacao?: string;
};

type FilterState = {
  q?: string;
  tipo?: string;
  periodo?: string;
  ordenacao?: string;
};

function buildPageUrl(page: number, filters: FilterState) {
  const params = new URLSearchParams({ aba: "simulados", page: String(page) });
  if (filters.q) params.set("q", filters.q);
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.periodo && filters.periodo !== "all") params.set("periodo", filters.periodo);
  if (filters.ordenacao && filters.ordenacao !== "recentes") {
    params.set("ordenacao", filters.ordenacao);
  }
  return `/historico?${params.toString()}`;
}

function ScoreLabel({ score }: { score: number }) {
  const isPassing = score >= EXAM_PASS_SCORE;
  return (
    <span
      className={`text-lg font-bold ${isPassing ? "text-emerald-400" : "text-amber-400"}`}
      aria-label={`Nota: ${Math.round(score)}%`}
    >
      {Math.round(score)}%
    </span>
  );
}

export function SimuladosTab({ data, currentPage, q, tipo, periodo, ordenacao }: Props) {
  const { items, totalCount, totalPages, averageScore, bestScore } = data;
  const filters: FilterState = { q, tipo, periodo, ordenacao };

  return (
    <div id="panel-simulados" role="tabpanel" className="space-y-6">
      {/* Stats globais no topo */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-xs text-slate-400">Total de tentativas</p>
          <p className="mt-0.5 text-2xl font-bold text-white">{totalCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-400">Média geral</p>
          <p
            className={`mt-0.5 text-2xl font-bold ${
              averageScore >= EXAM_PASS_SCORE ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {averageScore > 0 ? `${averageScore}%` : "—"}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-400">Melhor nota</p>
          <p className="mt-0.5 text-2xl font-bold text-emerald-400">
            {bestScore > 0 ? `${bestScore}%` : "—"}
          </p>
        </Card>
      </div>

      {/* Busca + filtros */}
      <Card padding="md">
        <form method="get" action="/historico" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <input type="hidden" name="aba" value="simulados" />
          <div className="min-w-40 flex-1">
            <label htmlFor="historico-simulados-q" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Buscar
            </label>
            <input
              id="historico-simulados-q"
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar simulado…"
              className="hx-input min-h-10 w-full rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-simulados-tipo" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Tipo
            </label>
            <NativeSelect id="historico-simulados-tipo" name="tipo" defaultValue={tipo ?? ""}>
              <option value="">Todos os tipos</option>
              {Object.entries(EXAM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-simulados-periodo" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Período
            </label>
            <NativeSelect id="historico-simulados-periodo" name="periodo" defaultValue={periodo ?? "all"}>
              {PERIODO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-simulados-ordenacao" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Ordenar
            </label>
            <NativeSelect id="historico-simulados-ordenacao" name="ordenacao" defaultValue={ordenacao ?? "recentes"}>
              {SIMULADO_ORDENACAO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <button
            type="submit"
            className="hx-btn-secondary min-h-10 px-4 py-2 text-sm font-semibold"
          >
            Filtrar
          </button>
        </form>
      </Card>

      {/* Lista de tentativas */}
      {items.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nenhuma tentativa encontrada."
          description="Faça um simulado para ver seu histórico aqui."
        >
          <LinkButton href="/simulados" size="sm" className="mt-4">
            Ver simulados
          </LinkButton>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/simulados/${item.exam.slug}/resultado/${item.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-sky-400/35"
                aria-label={`Ver resultado de ${item.exam.title}: ${Math.round(item.score)}%`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{item.exam.examType}</Badge>
                  </div>
                  <p className="mt-1 truncate font-semibold text-white">{item.exam.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {item.correctAnswers}/{item.totalQuestions} acertos ·{" "}
                    {item.finishedAt.toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <ScoreLabel score={item.score} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <nav
          aria-label="Paginação de simulados"
          className="flex items-center justify-center gap-3"
        >
          {currentPage > 1 && (
            <Link
              href={buildPageUrl(currentPage - 1, filters)}
              className="hx-btn-secondary min-h-9 px-3 py-1.5 text-sm"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-slate-400">
            Página {currentPage} de {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={buildPageUrl(currentPage + 1, filters)}
              className="hx-btn-secondary min-h-9 px-3 py-1.5 text-sm"
            >
              Próxima →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

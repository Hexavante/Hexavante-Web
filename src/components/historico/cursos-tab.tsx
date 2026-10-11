import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import {
  CURSO_ORDENACAO_OPTIONS,
  CURSO_STATUS_OPTIONS,
  PERIODO_OPTIONS,
} from "@/lib/historico";
import type { HistoricoCursosResult } from "@/services/historico.service";

type Props = {
  data: HistoricoCursosResult;
  currentPage: number;
  q?: string;
  filter?: string;
  periodo?: string;
  ordenacao?: string;
};

type FilterState = {
  q?: string;
  filter?: string;
  periodo?: string;
  ordenacao?: string;
};

function buildPageUrl(page: number, filters: FilterState) {
  const params = new URLSearchParams({ aba: "cursos", page: String(page) });
  if (filters.q) params.set("q", filters.q);
  if (filters.filter && filters.filter !== "all") params.set("filter", filters.filter);
  if (filters.periodo && filters.periodo !== "all") params.set("periodo", filters.periodo);
  if (filters.ordenacao && filters.ordenacao !== "recentes") {
    params.set("ordenacao", filters.ordenacao);
  }
  return `/historico?${params.toString()}`;
}

export function CursosTab({ data, currentPage, q, filter, periodo, ordenacao }: Props) {
  const { items, totalCount, totalPages } = data;
  const filters: FilterState = { q, filter, periodo, ordenacao };

  return (
    <div id="panel-cursos" role="tabpanel" className="space-y-6">
      {/* Busca + filtros */}
      <Card padding="md">
        <form method="get" action="/historico" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <input type="hidden" name="aba" value="cursos" />
          <div className="min-w-40 flex-1">
            <label htmlFor="historico-cursos-q" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Buscar
            </label>
            <input
              id="historico-cursos-q"
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar curso…"
              className="hx-input min-h-10 w-full rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-cursos-filter" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Status
            </label>
            <NativeSelect id="historico-cursos-filter" name="filter" defaultValue={filter ?? "all"}>
              {CURSO_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-cursos-periodo" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Período
            </label>
            <NativeSelect id="historico-cursos-periodo" name="periodo" defaultValue={periodo ?? "all"}>
              {PERIODO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-cursos-ordenacao" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Ordenar
            </label>
            <NativeSelect id="historico-cursos-ordenacao" name="ordenacao" defaultValue={ordenacao ?? "recentes"}>
              {CURSO_ORDENACAO_OPTIONS.map((option) => (
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

      <p className="text-sm text-slate-400" role="status">
        {totalCount === 0
          ? "Nenhum curso encontrado"
          : `${totalCount} ${totalCount === 1 ? "curso" : "cursos"}`}
      </p>

      {/* Lista */}
      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum curso encontrado."
          description="Quando você se matricular em um curso, ele aparecerá aqui."
        >
          <LinkButton href="/courses" size="sm" className="mt-4">
            Explorar cursos
          </LinkButton>
        </EmptyState>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => {
            const complete = item.progress >= 100;
            const progressPct = Math.min(100, Math.max(0, Math.round(item.progress)));

            return (
              <li key={item.id}>
                <Card
                  padding="md"
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Thumbnail */}
                  <div className="flex min-w-0 gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {item.course.thumbnailUrl ? (
                        <Image
                          src={item.course.thumbnailUrl}
                          alt={item.course.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-6 w-6 text-slate-500" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-sky-300">
                          {item.course.category.name}
                        </span>
                        {complete && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                            <Award className="h-3 w-3" aria-hidden />
                            Concluído
                          </span>
                        )}
                      </div>

                      <h2 className="mt-0.5 truncate text-sm font-semibold text-white">
                        {item.course.title}
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Matrícula: {item.enrolledAt.toLocaleDateString("pt-BR")}
                        {item.completedAt && (
                          <> · Concluído: {item.completedAt.toLocaleDateString("pt-BR")}</>
                        )}
                        {" · "}
                        {item.completedLessons} / {item.lessonCount} aulas
                      </p>

                      {/* Barra de progresso */}
                      <div
                        className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-slate-800"
                        aria-label={`Progresso: ${progressPct}%`}
                        role="progressbar"
                        aria-valuenow={progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{progressPct}% concluído</p>
                    </div>
                  </div>

                  {/* Ação */}
                  <Link
                    href={`/courses/${item.course.slug}/learn`}
                    className="hx-btn-secondary inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm"
                  >
                    <GraduationCap className="h-4 w-4" aria-hidden />
                    {complete ? "Revisar" : "Continuar"}
                  </Link>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <nav
          aria-label="Paginação de cursos"
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

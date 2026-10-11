import Link from "next/link";
import { Award, BookOpen, History, Target, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientRelativeTime } from "@/components/ui/client-relative-time";
import { LinkButton } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { ATIVIDADE_TIPO_OPTIONS, PERIODO_OPTIONS } from "@/lib/historico";
import type { AtividadeItem, HistoricoAtividadesResult } from "@/services/historico.service";

type Props = {
  data: HistoricoAtividadesResult;
  currentPage: number;
  q?: string;
  tipoFiltro?: string;
  periodo?: string;
};

type FilterState = {
  q?: string;
  tipoFiltro?: string;
  periodo?: string;
};

const ITEM_ICONS: Record<AtividadeItem["type"], React.ElementType> = {
  lesson: BookOpen,
  exam: Target,
  certificate: Award,
  xp: Zap,
};

const ITEM_COLORS: Record<AtividadeItem["type"], string> = {
  lesson: "text-sky-400 bg-sky-400/10",
  exam: "text-amber-400 bg-amber-400/10",
  certificate: "text-emerald-400 bg-emerald-400/10",
  xp: "text-violet-400 bg-violet-400/10",
};

function buildPageUrl(page: number, filters: FilterState) {
  const params = new URLSearchParams({ aba: "atividades", page: String(page) });
  if (filters.q) params.set("q", filters.q);
  if (filters.tipoFiltro && filters.tipoFiltro !== "all") params.set("tipo", filters.tipoFiltro);
  if (filters.periodo && filters.periodo !== "all") params.set("periodo", filters.periodo);
  return `/historico?${params.toString()}`;
}

export function AtividadesTab({ data, currentPage, q, tipoFiltro, periodo }: Props) {
  const { items, totalCount, totalPages } = data;
  const filters: FilterState = { q, tipoFiltro, periodo };

  return (
    <div id="panel-atividades" role="tabpanel" className="space-y-4">
      {/* Busca + filtros */}
      <Card padding="md">
        <form method="get" action="/historico" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <input type="hidden" name="aba" value="atividades" />
          <div className="min-w-40 flex-1">
            <label htmlFor="historico-atividades-q" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Buscar
            </label>
            <input
              id="historico-atividades-q"
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar atividade…"
              className="hx-input min-h-10 w-full rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-atividades-tipo" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Tipo
            </label>
            <NativeSelect id="historico-atividades-tipo" name="tipo" defaultValue={tipoFiltro ?? "all"}>
              {ATIVIDADE_TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="historico-atividades-periodo" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Período
            </label>
            <NativeSelect id="historico-atividades-periodo" name="periodo" defaultValue={periodo ?? "all"}>
              {PERIODO_OPTIONS.map((option) => (
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
          ? "Nenhuma atividade encontrada"
          : `${totalCount} ${totalCount === 1 ? "atividade" : "atividades"}`}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhuma atividade registrada ainda."
          description="Comece a estudar para ver seu histórico de XP, aulas e simulados aqui."
        >
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <LinkButton href="/courses" size="sm">
              Explorar cursos
            </LinkButton>
            <LinkButton href="/simulados" variant="outline" size="sm">
              Ver simulados
            </LinkButton>
          </div>
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = ITEM_ICONS[item.type];
            const colorClass = ITEM_COLORS[item.type];

            const content = (
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{item.label}</p>
                  {item.amount !== undefined && (
                    <p className="text-xs text-violet-400">+{item.amount} XP</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  <ClientRelativeTime date={item.date} />
                </span>
              </div>
            );

            return (
              <li
                key={item.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
              >
                {item.href ? (
                  <Link href={item.href} className="block hover:opacity-80">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <nav
          aria-label="Paginação de atividades"
          className="flex items-center justify-center gap-3 pt-2"
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

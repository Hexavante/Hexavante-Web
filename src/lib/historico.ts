/**
 * Helpers da área unificada de Histórico (`/historico`).
 *
 * Centraliza o parsing/validação dos query params (`aba`, `q`, `page`,
 * `tipo`, `filter`, `periodo`, `ordenacao`) e a construção dos redirects das
 * rotas legadas (`/courses/history` e `/simulados/historico`).
 *
 * Funções puras — cobertas por testes em `src/lib/__tests__/historico.test.ts`.
 */

export const HISTORICO_ABAS = ["overview", "cursos", "simulados", "atividades"] as const;

export type HistoricoAba = (typeof HISTORICO_ABAS)[number];

export type PeriodoFiltro = "all" | "7d" | "30d" | "90d" | "12m";

export type CursoStatusFiltro = "all" | "completed" | "inProgress";

export type CursoOrdenacao = "recentes" | "antigos" | "progresso_desc" | "progresso_asc" | "titulo";

export type SimuladoOrdenacao = "recentes" | "antigos" | "nota_desc" | "nota_asc";

export type AtividadeTipoFiltro = "all" | "xp" | "lesson" | "exam" | "certificate";

const EXAM_TYPES = ["ENEM", "VESTIBULAR", "TECNOLOGIA"] as const;

/** Milissegundos aproximados de cada janela (12m ≈ 365 dias). */
const PERIODO_WINDOW_MS: Record<Exclude<PeriodoFiltro, "all">, number> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "12m": 365 * 24 * 60 * 60 * 1000,
};

export const PERIODO_OPTIONS: { value: PeriodoFiltro; label: string }[] = [
  { value: "all", label: "Todo o período" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "12m", label: "Últimos 12 meses" },
];

export const CURSO_STATUS_OPTIONS: { value: CursoStatusFiltro; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "completed", label: "Concluídos" },
  { value: "inProgress", label: "Em andamento" },
];

export const CURSO_ORDENACAO_OPTIONS: { value: CursoOrdenacao; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "progresso_desc", label: "Maior progresso" },
  { value: "progresso_asc", label: "Menor progresso" },
  { value: "titulo", label: "Título (A–Z)" },
];

export const SIMULADO_ORDENACAO_OPTIONS: { value: SimuladoOrdenacao; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "nota_desc", label: "Maior nota" },
  { value: "nota_asc", label: "Menor nota" },
];

export const ATIVIDADE_TIPO_OPTIONS: { value: AtividadeTipoFiltro; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "xp", label: "XP" },
  { value: "lesson", label: "Aulas" },
  { value: "exam", label: "Simulados" },
  { value: "certificate", label: "Certificados" },
];

/** Devolve o primeiro valor não-vazio (usado para aliases como `q`/`search`). */
export function pickQuery(...values: (string | null | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function parseHistoricoAba(value?: string | null): HistoricoAba {
  if (value && (HISTORICO_ABAS as readonly string[]).includes(value)) {
    return value as HistoricoAba;
  }
  return "overview";
}

export function parsePageNumber(value?: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export function parsePeriodo(value?: string | null): PeriodoFiltro {
  if (value === "7d" || value === "30d" || value === "90d" || value === "12m") return value;
  return "all";
}

/** Data de corte (inclusive) para o filtro de período — `undefined` = sem filtro. */
export function resolvePeriodoSince(periodo: PeriodoFiltro, now: Date = new Date()): Date | undefined {
  if (periodo === "all") return undefined;
  return new Date(now.getTime() - PERIODO_WINDOW_MS[periodo]);
}

export function parseCursoStatus(value?: string | null): CursoStatusFiltro {
  if (value === "completed" || value === "inProgress") return value;
  return "all";
}

export function parseCursoOrdenacao(value?: string | null): CursoOrdenacao {
  if (
    value === "antigos" ||
    value === "progresso_desc" ||
    value === "progresso_asc" ||
    value === "titulo"
  ) {
    return value;
  }
  return "recentes";
}

export function parseSimuladoOrdenacao(value?: string | null): SimuladoOrdenacao {
  if (value === "antigos" || value === "nota_desc" || value === "nota_asc") return value;
  return "recentes";
}

export function parseSimuladoTipo(value?: string | null): string | undefined {
  if (value && (EXAM_TYPES as readonly string[]).includes(value)) return value;
  return undefined;
}

export function parseAtividadeTipo(value?: string | null): AtividadeTipoFiltro {
  if (value === "xp" || value === "lesson" || value === "exam" || value === "certificate") {
    return value;
  }
  return "all";
}

/** Redirect da rota legada `/courses/history` → `/historico?aba=cursos`. */
export function buildCoursesHistoryRedirect(params: { page?: string | null }): string {
  const qs = new URLSearchParams({ aba: "cursos" });
  const page = parsePageNumber(params.page);
  if (page > 1) qs.set("page", String(page));
  return `/historico?${qs.toString()}`;
}

/** Redirect da rota legada `/simulados/historico` → `/historico?aba=simulados`. */
export function buildSimuladosHistoryRedirect(params: {
  tipo?: string | null;
  examType?: string | null;
  page?: string | null;
}): string {
  const qs = new URLSearchParams({ aba: "simulados" });
  const tipo = parseSimuladoTipo(params.tipo ?? params.examType);
  if (tipo) qs.set("tipo", tipo);
  const page = parsePageNumber(params.page);
  if (page > 1) qs.set("page", String(page));
  return `/historico?${qs.toString()}`;
}

const CALLBACK_KEYS = [
  "aba",
  "q",
  "search",
  "page",
  "tipo",
  "examType",
  "filter",
  "filtro",
  "status",
  "periodo",
  "ordenacao",
  "ordem",
] as const;

/**
 * Monta o `/login?callbackUrl=…` preservando os filtros atuais do `/historico`,
 * para o usuário voltar exatamente onde estava após autenticar.
 */
export function buildHistoricoLoginCallback(
  raw: Partial<Record<(typeof CALLBACK_KEYS)[number], string | null | undefined>>,
): string {
  const qs = new URLSearchParams();
  for (const key of CALLBACK_KEYS) {
    const value = raw[key]?.trim();
    if (value) qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return `/login?callbackUrl=${encodeURIComponent(`/historico${suffix}`)}`;
}

import type { ExamType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EXAM_PASS_SCORE } from "@/lib/gamification";
import {
  parseAtividadeTipo,
  parseCursoOrdenacao,
  parseCursoStatus,
  parsePeriodo,
  parseSimuladoOrdenacao,
  parseSimuladoTipo,
  resolvePeriodoSince,
  type AtividadeTipoFiltro,
  type CursoOrdenacao,
  type CursoStatusFiltro,
  type PeriodoFiltro,
  type SimuladoOrdenacao,
} from "@/lib/historico";
import { EXAM_TYPE_LABELS } from "@/lib/validations/exam";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type RecentActivityItem = {
  type: "lesson" | "exam" | "certificate" | "xp";
  label: string;
  date: Date;
  href?: string;
};

export type ScoreDistributionBucket = {
  faixa: string;
  min: number;
  max: number;
  count: number;
};

export type HistoricoOverview = {
  totalLessons: number;
  totalCourses: number;
  completedCourses: number;
  totalExams: number;
  passedExams: number;
  averageExamScore: number;
  totalXpEarned: number;
  studyTimeMinutes: number;
  activeDays: number;
  recentActivity: RecentActivityItem[];
  /** Distribuição das notas dos simulados por faixa (soma = totalExams). */
  scoreDistribution: ScoreDistributionBucket[];
};

export type HistoricoCursoItem = {
  id: string;
  progress: number;
  enrolledAt: Date;
  completedAt: Date | null;
  lessonCount: number;
  completedLessons: number;
  course: {
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    category: { name: string };
  };
};

export type HistoricoCursosResult = {
  items: HistoricoCursoItem[];
  totalCount: number;
  page: number;
  totalPages: number;
};

export type HistoricoSimuladoItem = {
  id: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  finishedAt: Date;
  exam: {
    title: string;
    slug: string;
    examType: string;
  };
};

export type HistoricoSimuladosResult = {
  items: HistoricoSimuladoItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  averageScore: number;
  bestScore: number;
};

export type AtividadeItem = {
  id: string;
  type: "xp" | "lesson" | "exam" | "certificate";
  label: string;
  amount?: number;
  date: Date;
  href?: string;
};

export type HistoricoAtividadesResult = {
  items: AtividadeItem[];
  totalCount: number;
  page: number;
  totalPages: number;
};

// ─── Overview ──────────────────────────────────────────────────────────────

export async function getHistoricoOverview(userId: string): Promise<HistoricoOverview> {
  const [
    lessonCount,
    enrollments,
    examAttempts,
    xpTotal,
    recentLessons,
    recentExams,
    recentCerts,
  ] = await Promise.all([
    // Total de aulas concluídas
    prisma.lessonProgress.count({ where: { userId, completed: true } }),

    // Matrículas do usuário
    prisma.courseEnrollment.findMany({
      where: { userId },
      select: { progress: true },
    }),

    // Tentativas de simulados finalizadas
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { score: true },
    }),

    // XP total ganho
    prisma.xpTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),

    // Atividades recentes: aulas
    prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        id: true,
        completedAt: true,
        lesson: {
          select: {
            title: true,
            module: { select: { course: { select: { slug: true } } } },
          },
        },
      },
    }),

    // Atividades recentes: simulados
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      take: 5,
      select: {
        id: true,
        finishedAt: true,
        exam: { select: { title: true, slug: true } },
      },
    }),

    // Atividades recentes: certificados
    prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      take: 5,
      select: {
        id: true,
        issuedAt: true,
        code: true,
        course: { select: { title: true } },
      },
    }),
  ]);

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.progress >= 100).length;
  const totalExams = examAttempts.length;
  const passedExams = examAttempts.filter((a) => a.score >= EXAM_PASS_SCORE).length;
  const averageExamScore =
    totalExams > 0
      ? Math.round(examAttempts.reduce((sum, a) => sum + a.score, 0) / totalExams)
      : 0;
  const totalXpEarned = xpTotal._sum.amount ?? 0;

  // Dias ativos: contagem de dias distintos com atividade de aula
  const activeDaysRows = await prisma.$queryRaw<{ day: string }[]>`
    SELECT DATE(completed_at) AS day
    FROM lesson_progress
    WHERE user_id = ${userId} AND completed = true AND completed_at IS NOT NULL
    GROUP BY DATE(completed_at)
  `;
  const activeDays = activeDaysRows.length;

  // Montar lista de atividades recentes mesclada e ordenada
  const activityList: RecentActivityItem[] = [];

  for (const l of recentLessons) {
    if (!l.completedAt) continue;
    activityList.push({
      type: "lesson",
      label: `Aula concluída: ${l.lesson.title}`,
      date: l.completedAt,
      href: `/courses/${l.lesson.module.course.slug}/learn`,
    });
  }

  for (const e of recentExams) {
    if (!e.finishedAt) continue;
    activityList.push({
      type: "exam",
      label: `Simulado finalizado: ${e.exam.title}`,
      date: e.finishedAt,
      href: `/simulados/${e.exam.slug}/resultado/${e.id}`,
    });
  }

  for (const c of recentCerts) {
    activityList.push({
      type: "certificate",
      label: `Certificado emitido: ${c.course.title}`,
      date: c.issuedAt,
      href: `/certificados/c/${c.code}`,
    });
  }

  activityList.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivity = activityList.slice(0, 5);

  // Tempo de estudo estimado: 5 min por aula
  const studyTimeMinutes = lessonCount * 5;

  // Distribuição das notas por faixa (para o gráfico da visão geral)
  const scoreDistribution: ScoreDistributionBucket[] = [
    { faixa: "0–49%", min: 0, max: 49, count: 0 },
    { faixa: "50–69%", min: 50, max: 69, count: 0 },
    { faixa: "70–89%", min: 70, max: 89, count: 0 },
    { faixa: "90–100%", min: 90, max: 100, count: 0 },
  ];
  for (const attempt of examAttempts) {
    const bucket = scoreDistribution.find((b) => attempt.score >= b.min && attempt.score <= b.max);
    if (bucket) bucket.count += 1;
  }

  return {
    totalLessons: lessonCount,
    totalCourses,
    completedCourses,
    totalExams,
    passedExams,
    averageExamScore,
    totalXpEarned,
    studyTimeMinutes,
    activeDays,
    recentActivity,
    scoreDistribution,
  };
}

// ─── Cursos ────────────────────────────────────────────────────────────────

const CURSOS_PAGE_SIZE = 10;

export type HistoricoCursosOpts = {
  page?: number;
  /** Alias legado — prefira `q`. */
  search?: string;
  q?: string;
  /** Alias legado — prefira `filter`. */
  status?: string;
  filter?: string;
  /** `all` | `7d` | `30d` | `90d` | `12m` — filtra por data da matrícula. */
  periodo?: string;
  /** `recentes` | `antigos` | `progresso_desc` | `progresso_asc` | `titulo`. */
  ordenacao?: string;
};

function resolveCursosOrderBy(
  ordenacao: CursoOrdenacao,
): Prisma.CourseEnrollmentOrderByWithRelationInput[] {
  switch (ordenacao) {
    case "antigos":
      return [{ enrolledAt: "asc" }];
    case "progresso_desc":
      return [{ progress: "desc" }];
    case "progresso_asc":
      return [{ progress: "asc" }];
    case "titulo":
      return [{ course: { title: "asc" } }];
    case "recentes":
    default:
      return [{ completedAt: "desc" }, { enrolledAt: "desc" }];
  }
}

export async function getHistoricoCursos(
  userId: string,
  opts: HistoricoCursosOpts = {},
): Promise<HistoricoCursosResult> {
  const { page = 1 } = opts;

  const query = (opts.q ?? opts.search)?.trim() || undefined;
  const status: CursoStatusFiltro = parseCursoStatus(opts.filter ?? opts.status);
  const periodo: PeriodoFiltro = parsePeriodo(opts.periodo);
  const ordenacao: CursoOrdenacao = parseCursoOrdenacao(opts.ordenacao);

  const progressFilter =
    status === "completed"
      ? { progress: { gte: 100 } }
      : status === "inProgress"
        ? { progress: { lt: 100 } }
        : {};

  const searchFilter = query ? { course: { title: { contains: query } } } : {};

  const since = resolvePeriodoSince(periodo);
  const periodoFilter = since ? { enrolledAt: { gte: since } } : {};

  const where = { userId, ...progressFilter, ...searchFilter, ...periodoFilter };

  const [enrollments, totalCount] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where,
      orderBy: resolveCursosOrderBy(ordenacao),
      skip: (page - 1) * CURSOS_PAGE_SIZE,
      take: CURSOS_PAGE_SIZE,
      include: {
        course: {
          select: {
            title: true,
            slug: true,
            thumbnailUrl: true,
            category: { select: { name: true } },
            modules: { select: { _count: { select: { lessons: true } } } },
          },
        },
        lessonProgresses: {
          where: { completed: true },
          select: { id: true },
        },
      },
    }),
    prisma.courseEnrollment.count({ where }),
  ]);

  const items: HistoricoCursoItem[] = enrollments.map((e) => {
    const lessonCount = e.course.modules.reduce(
      (sum, m) => sum + m._count.lessons,
      0,
    );
    return {
      id: e.id,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      lessonCount,
      completedLessons: e.lessonProgresses.length,
      course: {
        title: e.course.title,
        slug: e.course.slug,
        thumbnailUrl: e.course.thumbnailUrl,
        category: e.course.category,
      },
    };
  });

  return {
    items,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / CURSOS_PAGE_SIZE)),
  };
}

// ─── Simulados ─────────────────────────────────────────────────────────────

const SIMULADOS_PAGE_SIZE = 10;

export type HistoricoSimuladosOpts = {
  page?: number;
  /** Alias legado — prefira `q`. */
  search?: string;
  q?: string;
  /** Alias legado — prefira `tipo`. */
  examType?: string;
  tipo?: string;
  /** `all` | `7d` | `30d` | `90d` | `12m` — filtra por data de conclusão. */
  periodo?: string;
  /** `recentes` | `antigos` | `nota_desc` | `nota_asc`. */
  ordenacao?: string;
};

function resolveSimuladosOrderBy(
  ordenacao: SimuladoOrdenacao,
): Prisma.ExamAttemptOrderByWithRelationInput {
  switch (ordenacao) {
    case "antigos":
      return { finishedAt: "asc" };
    case "nota_desc":
      return { score: "desc" };
    case "nota_asc":
      return { score: "asc" };
    case "recentes":
    default:
      return { finishedAt: "desc" };
  }
}

export async function getHistoricoSimulados(
  userId: string,
  opts: HistoricoSimuladosOpts = {},
): Promise<HistoricoSimuladosResult> {
  const { page = 1 } = opts;

  const query = (opts.q ?? opts.search)?.trim() || undefined;
  const rawExamType = parseSimuladoTipo(opts.tipo ?? opts.examType);
  const validExamType: ExamType | undefined =
    rawExamType === "ENEM" || rawExamType === "VESTIBULAR" || rawExamType === "TECNOLOGIA"
      ? rawExamType
      : undefined;
  const periodo: PeriodoFiltro = parsePeriodo(opts.periodo);
  const ordenacao: SimuladoOrdenacao = parseSimuladoOrdenacao(opts.ordenacao);

  const examFilter: Prisma.ExamWhereInput = {
    ...(query ? { title: { contains: query } } : {}),
    ...(validExamType ? { examType: validExamType } : {}),
  };

  const since = resolvePeriodoSince(periodo);

  const where: Prisma.ExamAttemptWhereInput = {
    userId,
    finishedAt: since ? { not: null, gte: since } : { not: null },
    ...(Object.keys(examFilter).length > 0 ? { exam: examFilter } : {}),
  };

  const [attempts, totalCount, allStats] = await Promise.all([
    prisma.examAttempt.findMany({
      where,
      orderBy: resolveSimuladosOrderBy(ordenacao),
      skip: (page - 1) * SIMULADOS_PAGE_SIZE,
      take: SIMULADOS_PAGE_SIZE,
      include: {
        exam: {
          select: { title: true, slug: true, examType: true },
        },
      },
    }),
    prisma.examAttempt.count({ where }),
    // Stats globais (sem filtro de busca/tipo para mostrar média/melhor geral)
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { score: true },
    }),
  ]);

  const scores = allStats.map((a) => a.score);
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  const items: HistoricoSimuladoItem[] = attempts
    .filter((a) => a.finishedAt !== null)
    .map((a) => ({
      id: a.id,
      score: a.score,
      correctAnswers: a.correctAnswers,
      totalQuestions: a.totalQuestions,
      finishedAt: a.finishedAt as Date,
      exam: {
        title: a.exam.title,
        slug: a.exam.slug,
        examType: EXAM_TYPE_LABELS[a.exam.examType] ?? a.exam.examType,
      },
    }));

  return {
    items,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / SIMULADOS_PAGE_SIZE)),
    averageScore,
    bestScore,
  };
}

// ─── Atividades ────────────────────────────────────────────────────────────

const ATIVIDADES_PAGE_SIZE = 20;

export type HistoricoAtividadesOpts = {
  page?: number;
  /** `all` | `xp` | `lesson` | `exam` | `certificate`. */
  tipo?: string;
  /** Alias legado — prefira `q`. */
  search?: string;
  q?: string;
  /** `all` | `7d` | `30d` | `90d` | `12m`. */
  periodo?: string;
};

export async function getHistoricoAtividades(
  userId: string,
  opts: HistoricoAtividadesOpts = {},
): Promise<HistoricoAtividadesResult> {
  const { page = 1 } = opts;

  const tipoFiltro: AtividadeTipoFiltro = parseAtividadeTipo(opts.tipo);
  const query = (opts.q ?? opts.search)?.trim().toLowerCase() || undefined;
  const since = resolvePeriodoSince(parsePeriodo(opts.periodo));

  // Buscar todas as atividades para ordenar e paginar
  const [xpRows, lessonRows, examRows, certRows] = await Promise.all([
    prisma.xpTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, amount: true, description: true, createdAt: true, source: true, sourceId: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      orderBy: { completedAt: "desc" },
      take: 200,
      select: {
        id: true,
        completedAt: true,
        lesson: {
          select: {
            title: true,
            module: { select: { course: { select: { slug: true } } } },
          },
        },
      },
    }),
    prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      take: 200,
      select: {
        id: true,
        finishedAt: true,
        exam: { select: { title: true, slug: true } },
      },
    }),
    prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      take: 50,
      select: {
        id: true,
        issuedAt: true,
        code: true,
        course: { select: { title: true } },
      },
    }),
  ]);

  const allItems: AtividadeItem[] = [];

  for (const x of xpRows) {
    allItems.push({
      id: `xp-${x.id}`,
      type: "xp",
      label: x.description ?? `+${x.amount} XP`,
      amount: x.amount,
      date: x.createdAt,
    });
  }

  for (const l of lessonRows) {
    if (!l.completedAt) continue;
    allItems.push({
      id: `lesson-${l.id}`,
      type: "lesson",
      label: `Aula concluída: ${l.lesson.title}`,
      date: l.completedAt,
      href: `/courses/${l.lesson.module.course.slug}/learn`,
    });
  }

  for (const e of examRows) {
    if (!e.finishedAt) continue;
    allItems.push({
      id: `exam-${e.id}`,
      type: "exam",
      label: `Simulado finalizado: ${e.exam.title}`,
      date: e.finishedAt,
      href: `/simulados/${e.exam.slug}/resultado/${e.id}`,
    });
  }

  for (const c of certRows) {
    allItems.push({
      id: `cert-${c.id}`,
      type: "certificate",
      label: `Certificado emitido: ${c.course.title}`,
      date: c.issuedAt,
      href: `/certificados/c/${c.code}`,
    });
  }

  allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  const filtered = allItems.filter((item) => {
    if (tipoFiltro !== "all" && item.type !== tipoFiltro) return false;
    if (since && item.date < since) return false;
    if (query && !item.label.toLowerCase().includes(query)) return false;
    return true;
  });

  const totalCount = filtered.length;
  const start = (page - 1) * ATIVIDADES_PAGE_SIZE;
  const items = filtered.slice(start, start + ATIVIDADES_PAGE_SIZE);

  return {
    items,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / ATIVIDADES_PAGE_SIZE)),
  };
}

import { auth } from "@/auth";
import { startExamAction } from "@/app/actions/exam";
import { AppLink } from "@/components/ui/app-link";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { PageShell } from "@/components/ui/page-shell";
import { ExamDailyRewardPreview } from "@/components/exams/exam-daily-reward-preview";
import { ExamSubjectStatsPanel } from "@/components/exams/exam-subject-stats-panel";
import { ExamThumbnail } from "@/components/exams/exam-thumbnail";
import { EXAM_PASS_SCORE } from "@/lib/gamification";
import { EXAM_TYPE_LABELS } from "@/lib/validations/exam";
import {
  EXAM_STUDY_MODE_LABELS,
  getDifficultyLabel,
  REINFORCEMENT_QUESTION_LIMIT,
} from "@/lib/exam-learning";
import { getExamBySlug, getUserExamPerformance } from "@/services/exam.service";
import {
  canStartReinforcement,
  getFavoriteQuestionCount,
  getRecommendedDifficulty,
  getUserSubjectStats,
} from "@/services/exam-learning.service";
import { getUserDailyExamRewardStatus } from "@/services/exam-daily-rewards.service";
import { canAccessPremiumExam } from "@/services/premium.service";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Clock3, ClipboardList, Crown, Sparkles, Star, Trophy } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ExamDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error } = await searchParams;
  const session = await auth();
  const exam = await getExamBySlug(slug);

  if (!exam || !exam.isPublished) notFound();

  const questionRefs = exam.questions.map((q) => ({
    id: q.id,
    type: q.type,
    subject: q.subject,
    difficulty: q.difficulty,
  }));

  const performance = session?.user?.id
    ? await getUserExamPerformance(session.user.id, exam.id)
    : null;

  const canAccess =
    !exam.isPremiumOnly ||
    (session?.user?.id && (await canAccessPremiumExam(session.user.id, exam)));

  const mcQuestionCount = exam.questions.filter((q) => q.type !== "ESSAY").length;
  const dailyRewardPreview =
    session?.user?.id && canAccess
      ? await getUserDailyExamRewardStatus(session.user.id, mcQuestionCount)
      : null;

  const [subjectStats, recommendedDifficulty, favoriteCount, canReinforce] = session?.user?.id
    ? await Promise.all([
        getUserSubjectStats(session.user.id, exam.id),
        getRecommendedDifficulty(session.user.id, exam.id),
        getFavoriteQuestionCount(session.user.id, exam.id),
        canStartReinforcement(session.user.id, exam.id, questionRefs),
      ])
    : [null, null, 0, false];

  return (
    <PageShell size="md">
      <AppLink href="/simulados" muted className="mb-4 inline-flex items-center gap-1">
        ← Simulados
      </AppLink>

      {error && (
        <Alert variant="warning" className="mb-4">
          {decodeURIComponent(error)}
        </Alert>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <ExamThumbnail
          url={exam.coverImage}
          title={exam.title}
          className="h-52 w-full sm:h-64"
          priority
        />
        <div className="border-t border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="teal">{EXAM_TYPE_LABELS[exam.examType] ?? exam.examType}</Badge>
            {exam.isPremiumOnly && (
              <Badge variant="violet">
                <Crown className="h-3.5 w-3.5" />
                Exclusivo Premium
              </Badge>
            )}
          </div>
          <h1 className="hx-page-title">{exam.title}</h1>

          {exam.description && <p className="mt-4 text-slate-300">{exam.description}</p>}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-teal-300" />
              {exam._count.questions} questões
            </span>
            {exam.timeLimit && (
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-sky-300" />
                {exam.timeLimit} minutos
              </span>
            )}
            {session?.user && recommendedDifficulty != null && (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Dificuldade sugerida: {getDifficultyLabel(recommendedDifficulty)}
              </span>
            )}
          </div>
        </div>
      </div>

      {exam.questions.length >= 100 && (
        <Card padding="md" className="mt-6 border-amber-400/25 bg-amber-400/[0.06]">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-200">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-amber-100">Conquista especial: Maratona Hexavante</h2>
              <p className="mt-1 text-sm text-amber-100/75">
                Finalize este simulado de 100 questões ou mais para desbloquear a conquista no seu perfil.
              </p>
            </div>
          </div>
        </Card>
      )}

      {performance && performance.attemptCount > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card padding="sm">
            <p className="text-sm text-slate-400">Suas tentativas</p>
            <p className="text-2xl font-bold text-white">{performance.attemptCount}</p>
          </Card>
          <Card padding="sm">
            <p className="text-sm text-slate-400">Média pessoal</p>
            <p className="text-2xl font-bold text-white">{performance.averageScore}%</p>
          </Card>
          <Card padding="sm">
            <p className="flex items-center gap-1.5 text-sm text-slate-400">
              <Trophy className="h-4 w-4 text-amber-300" />
              Melhor nota
            </p>
            <p
              className={`text-2xl font-bold ${
                performance.bestScore >= EXAM_PASS_SCORE ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {Math.round(performance.bestScore)}%
            </p>
          </Card>
        </div>
      )}

      {subjectStats && subjectStats.length > 0 && (
        <div className="mt-6">
          <ExamSubjectStatsPanel stats={subjectStats} title="Seus pontos fortes e fracos" />
        </div>
      )}

      {performance && performance.recentAttempts.length > 0 && (
        <Card padding="md" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-300" />
            <h2 className="font-semibold text-white">Histórico rápido</h2>
          </div>
          <ul className="space-y-2">
            {performance.recentAttempts.map((attempt) => (
              <li key={attempt.id}>
                <Link
                  href={`/simulados/${slug}/resultado/${attempt.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm hover:border-sky-400/30"
                >
                  <span className="text-slate-300">
                    {attempt.finishedAt?.toLocaleDateString("pt-BR")}
                  </span>
                  <span
                    className={`font-semibold ${
                      attempt.score >= EXAM_PASS_SCORE ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {Math.round(attempt.score)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {dailyRewardPreview && <ExamDailyRewardPreview preview={dailyRewardPreview} />}

      <div className="mt-8 space-y-4">
        {session?.user ? (
          canAccess ? (
            <>
              <form action={startExamAction.bind(null, exam.id, slug, "FULL")}>
                <Button type="submit" size="lg">
                  {performance?.attemptCount
                    ? "Fazer nova tentativa completa"
                    : "Iniciar simulado completo"}
                </Button>
              </form>

              <div className="grid gap-3 sm:grid-cols-2">
                <Card padding="md" className="flex flex-col">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <h3 className="font-semibold text-white">
                      {EXAM_STUDY_MODE_LABELS.REINFORCEMENT}
                    </h3>
                  </div>
                  <p className="mb-4 flex-1 text-sm text-slate-400">
                    Foque em questões que você errou e nos assuntos com menor desempenho (até{" "}
                    {REINFORCEMENT_QUESTION_LIMIT} questões).
                  </p>
                  <form action={startExamAction.bind(null, exam.id, slug, "REINFORCEMENT")}>
                    <Button type="submit" variant="outline" disabled={!canReinforce}>
                      {canReinforce ? "Iniciar reforço" : "Faça uma tentativa antes"}
                    </Button>
                  </form>
                </Card>

                <Card padding="md" className="flex flex-col">
                  <div className="mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-300" />
                    <h3 className="font-semibold text-white">
                      {EXAM_STUDY_MODE_LABELS.FAVORITES}
                    </h3>
                  </div>
                  <p className="mb-4 flex-1 text-sm text-slate-400">
                    Revise apenas as questões que você marcou como favoritas neste simulado (
                    {favoriteCount} salvas).
                  </p>
                  <form action={startExamAction.bind(null, exam.id, slug, "FAVORITES")}>
                    <Button type="submit" variant="outline" disabled={favoriteCount === 0}>
                      {favoriteCount > 0 ? "Estudar favoritas" : "Favorite questões no resultado"}
                    </Button>
                  </form>
                </Card>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-fuchsia-200">
                Este simulado é exclusivo para assinantes Premium.
              </p>
              <LinkButton href="/shop" size="lg">
                Conhecer o Premium
              </LinkButton>
            </div>
          )
        ) : (
          <LinkButton
            href={`/login?callbackUrl=/simulados/${slug}`}
            size="lg"
            aria-label="Entrar para iniciar simulado"
          >
            Entrar para iniciar
          </LinkButton>
        )}
      </div>
    </PageShell>
  );
}

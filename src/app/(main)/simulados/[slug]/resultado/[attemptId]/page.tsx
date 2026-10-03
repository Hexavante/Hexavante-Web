import { auth } from "@/auth";
import { getAttemptResult } from "@/services/exam.service";
import { getCoinsForSource } from "@/services/wallet.service";
import { getXpForSource } from "@/services/xp.service";
import {
  compareWithPreviousAttempt,
  getExamQuestionFavoriteIds,
  getUserSubjectStats,
} from "@/services/exam-learning.service";
import { AppLink } from "@/components/ui/app-link";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { ExamQuestionImage } from "@/components/exams/exam-question-image";
import { ExamQuestionFavoriteButton } from "@/components/exams/exam-question-favorite-button";
import { ExamSubjectStatsPanel } from "@/components/exams/exam-subject-stats-panel";
import { ExamAttemptComparisonPanel } from "@/components/exams/exam-attempt-comparison-panel";
import { AchievementCelebrationTrigger } from "@/components/achievements/achievement-celebration-trigger";
import { EXAM_PASS_SCORE } from "@/lib/gamification";
import {
  EXAM_STUDY_MODE_LABELS,
  formatSubjectLabel,
  getDifficultyLabel,
  type ExamStudyMode,
} from "@/lib/exam-learning";
import { getDailyRewardTierLabel } from "@/lib/exam-daily-rewards";
import { getUserAchievements } from "@/services/achievement.service";
import { notFound, redirect } from "next/navigation";

const ESSAY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando correção",
  CORRECT: "Correta",
  PARTIAL: "Parcialmente correta",
  INCORRECT: "Incorreta",
};

type Props = {
  params: Promise<{ slug: string; attemptId: string }>;
  searchParams: Promise<{ conquista?: string }>;
};

export default async function ExamResultPage({ params, searchParams }: Props) {
  const [{ slug, attemptId }, query] = await Promise.all([params, searchParams]);
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/simulados/${slug}`);

  const attempt = await getAttemptResult(session.user.id, attemptId);
  if (!attempt || !attempt.finishedAt || attempt.exam.slug !== slug) notFound();

  const [comparison, subjectStats, favoriteIds, achievements] = await Promise.all([
    compareWithPreviousAttempt(session.user.id, attempt.examId, attemptId),
    getUserSubjectStats(session.user.id, attempt.examId),
    getExamQuestionFavoriteIds(
      session.user.id,
      attempt.answers.map((a) => a.questionId),
    ),
    query.conquista === "maratona_100"
      ? getUserAchievements(session.user.id)
      : Promise.resolve([]),
  ]);
  const shouldCelebrateMarathon = achievements.some(
    (achievement) => achievement.key === "maratona_100" && achievement.unlocked,
  );

  const pendingEssays = attempt.answers.filter((a) => a.essayStatus === "PENDING").length;
  const mcAnswers = attempt.answers.filter((a) => a.alternativeId);
  const passed = attempt.score >= EXAM_PASS_SCORE && pendingEssays === 0;

  const correctAnswers = attempt.answers.filter((a) => a.isCorrect && a.alternativeId);
  const coinEntries = await Promise.all(
    correctAnswers.map((answer) =>
      getCoinsForSource(session.user!.id, "EXAM_CORRECT", `${attemptId}-q-${answer.questionId}`),
    ),
  );
  const totalCoinsEarned = coinEntries.reduce((sum, entry) => sum + (entry?.amount ?? 0), 0);

  const [baseXp, passXp] = await Promise.all([
    getXpForSource(session.user.id, "EXAM", attemptId),
    getXpForSource(session.user.id, "EXAM", `${attemptId}-pass`),
  ]);
  const totalXpEarned = (baseXp?.amount ?? 0) + (passXp?.amount ?? 0);
  const dailyTierLabel =
    attempt.dailyAttemptIndex != null ? getDailyRewardTierLabel(attempt.dailyAttemptIndex) : null;

  const answeredQuestionIds = new Set(attempt.answers.map((a) => a.questionId));
  const unanswered = attempt.exam.questions.filter((q) => !answeredQuestionIds.has(q.id));

  const modeLabel =
    EXAM_STUDY_MODE_LABELS[attempt.studyMode as ExamStudyMode] ?? attempt.studyMode;

  return (
    <PageShell size="md">
      {shouldCelebrateMarathon && (
        <AchievementCelebrationTrigger
          achievementKey="maratona_100"
          attemptId={attemptId}
        />
      )}
      <AppLink href="/simulados/historico" muted className="mb-4 inline-flex items-center gap-1">
        ← Meu histórico
      </AppLink>

      <Alert
        variant={passed ? "success" : pendingEssays > 0 ? "warning" : "warning"}
        className="p-6"
      >
        <h1 className="text-2xl font-bold">Resultado</h1>
        <p className="mt-1 opacity-90">{attempt.exam.title}</p>
        <p className="mt-1 text-sm opacity-75">{modeLabel}</p>
        <p className="mt-4 text-4xl font-bold">
          {pendingEssays > 0 ? "—" : `${Math.round(attempt.score)}%`}
        </p>
        <p className="mt-2 opacity-90">
          {attempt.correctAnswers} de {mcAnswers.length || attempt.totalQuestions} questões
          automáticas corretas
        </p>
        {pendingEssays > 0 && (
          <p className="mt-2 text-sm text-amber-200">
            {pendingEssays} questão(ões) dissertativa(s) aguardando correção do professor.
          </p>
        )}
        {(totalXpEarned > 0 || totalCoinsEarned > 0) && (
          <div className="mt-3 space-y-1 text-sm font-medium">
            {dailyTierLabel &&
              attempt.dailyRewardMultiplier != null &&
              attempt.dailyRewardMultiplier < 1 && (
                <p className="text-amber-200">
                  Recompensa diária {dailyTierLabel.toLowerCase()} (
                  {Math.round(attempt.dailyRewardMultiplier * 100)}% do valor cheio —{" "}
                  {attempt.dailyAttemptIndex}º simulado do dia)
                </p>
              )}
            {totalXpEarned > 0 && (
              <p className="text-sky-200">+{totalXpEarned} XP ganhos neste simulado</p>
            )}
            {totalCoinsEarned > 0 && (
              <p className="text-amber-200">+{totalCoinsEarned} moedas por questões corretas</p>
            )}
          </div>
        )}
      </Alert>

      {comparison && (
        <div className="mt-6">
          <ExamAttemptComparisonPanel comparison={comparison} />
        </div>
      )}

      {subjectStats.length > 0 && (
        <div className="mt-6">
          <ExamSubjectStatsPanel stats={subjectStats} />
        </div>
      )}

      <div className="mt-8 space-y-4">
        <h2 className="font-semibold text-white">Revisão com gabarito e explicações</h2>
        {attempt.answers
          .sort((a, b) => a.question.orderNumber - b.question.orderNumber)
          .map((answer) => {
            if (answer.question.type === "ESSAY") {
              return (
                <Card key={answer.id} padding="md" className="border-amber-400/30 bg-amber-400/5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-white">
                      {answer.question.orderNumber}. {answer.question.statement}
                    </p>
                    <ExamQuestionFavoriteButton
                      examSlug={slug}
                      questionId={answer.questionId}
                      attemptId={attemptId}
                      initialFavorite={favoriteIds.has(answer.questionId)}
                      compact
                    />
                  </div>
                  <ExamQuestionImage
                    url={answer.question.imageUrl}
                    naturalWidth={answer.question.imageWidth}
                    naturalHeight={answer.question.imageHeight}
                    displaySize={answer.question.imageDisplaySize}
                    alt={`Imagem da questão ${answer.question.orderNumber}`}
                  />
                  <p className="mt-2 text-sm text-slate-300">Sua resposta: {answer.essayAnswer}</p>
                  {answer.question.expectedAnswer && (
                    <p className="mt-2 text-sm font-medium text-emerald-300">
                      Gabarito de referência: {answer.question.expectedAnswer}
                    </p>
                  )}
                  {answer.question.explanation && (
                    <div className="mt-3 rounded-lg border border-sky-400/20 bg-sky-400/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                        Explicação
                      </p>
                      <p className="mt-1 text-sm text-slate-200">{answer.question.explanation}</p>
                    </div>
                  )}
                  <p className="mt-2 text-sm font-medium text-amber-300">
                    {ESSAY_STATUS_LABELS[answer.essayStatus ?? "PENDING"]}
                  </p>
                  {answer.essayComment && (
                    <p className="mt-2 text-sm text-slate-400">
                      Comentário do professor: {answer.essayComment}
                    </p>
                  )}
                </Card>
              );
            }

            const correctAlternative = answer.question.alternatives.find((alt) => alt.isCorrect);

            return (
              <Card
                key={answer.id}
                padding="md"
                className={
                  answer.isCorrect
                    ? "border-emerald-400/30 bg-emerald-400/5"
                    : "border-red-400/30 bg-red-400/5"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap gap-2 text-xs text-slate-400">
                      {answer.question.subject && (
                        <span className="rounded-full border border-white/10 px-2 py-0.5">
                          {formatSubjectLabel(answer.question.subject)}
                        </span>
                      )}
                      <span className="rounded-full border border-white/10 px-2 py-0.5">
                        {getDifficultyLabel(answer.question.difficulty)}
                      </span>
                    </div>
                    <p className="font-medium text-white">
                      {answer.question.orderNumber}. {answer.question.statement}
                    </p>
                  </div>
                  <ExamQuestionFavoriteButton
                    examSlug={slug}
                    questionId={answer.questionId}
                    attemptId={attemptId}
                    initialFavorite={favoriteIds.has(answer.questionId)}
                    compact
                  />
                </div>
                <ExamQuestionImage
                  url={answer.question.imageUrl}
                  naturalWidth={answer.question.imageWidth}
                  naturalHeight={answer.question.imageHeight}
                  displaySize={answer.question.imageDisplaySize}
                  alt={`Imagem da questão ${answer.question.orderNumber}`}
                />
                <p className="mt-2 text-sm text-slate-300">
                  Sua resposta: {answer.alternative?.text ?? "—"}
                </p>
                {!answer.isCorrect && correctAlternative && (
                  <p className="mt-2 text-sm font-medium text-emerald-300">
                    Gabarito: {correctAlternative.text}
                  </p>
                )}
                {answer.question.explanation && (
                  <div className="mt-3 rounded-lg border border-sky-400/20 bg-sky-400/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                      Explicação
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{answer.question.explanation}</p>
                  </div>
                )}
                <p
                  className={`mt-2 text-sm font-medium ${
                    answer.isCorrect ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {answer.isCorrect ? "Correta" : "Incorreta"}
                </p>
              </Card>
            );
          })}

        {unanswered.map((question) => (
          <Card key={question.id} padding="md" className="border-slate-500/30 bg-slate-500/5">
            <p className="font-medium text-white">
              {question.orderNumber}. {question.statement}
            </p>
            <ExamQuestionImage
              url={question.imageUrl}
              naturalWidth={question.imageWidth}
              naturalHeight={question.imageHeight}
              displaySize={question.imageDisplaySize}
              alt={`Imagem da questão ${question.orderNumber}`}
            />
            <p className="mt-2 text-sm text-slate-400">Não respondida (tempo esgotado).</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href={`/simulados/${slug}`} variant="outline" aria-label="Refazer simulado">
          Refazer simulado
        </LinkButton>
        <LinkButton href="/simulados" aria-label="Ver outros simulados">
          Ver outros simulados
        </LinkButton>
      </div>
    </PageShell>
  );
}

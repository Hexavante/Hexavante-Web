import { Card } from "@/components/ui/card";
import { EXAM_STUDY_MODE_LABELS, type ExamStudyMode } from "@/lib/exam-learning";
import type { AttemptComparison } from "@/services/exam-learning.service";
import { TrendingDown, TrendingUp } from "lucide-react";

type Props = {
  comparison: AttemptComparison;
};

export function ExamAttemptComparisonPanel({ comparison }: Props) {
  const { current, previous, scoreDelta, correctDelta, improved } = comparison;

  if (!previous) {
    return (
      <Card padding="md" className="border-sky-400/20 bg-sky-400/5">
        <p className="text-sm text-sky-200">Primeira tentativa registrada neste simulado.</p>
        <p className="mt-1 text-xs text-slate-400">
          Modo: {EXAM_STUDY_MODE_LABELS[current.studyMode as ExamStudyMode] ?? current.studyMode}
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <h2 className="font-semibold text-white">Comparado à tentativa anterior</h2>
      <p className="mt-1 text-xs text-slate-400">
        {previous.finishedAt?.toLocaleDateString("pt-BR")} →{" "}
        {current.finishedAt?.toLocaleDateString("pt-BR")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-slate-400">Nota</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-white">{Math.round(previous.score)}%</span>
            <span className="text-slate-500">→</span>
            <span className="text-lg font-bold text-white">{Math.round(current.score)}%</span>
            {scoreDelta != null && (
              <span
                className={`flex items-center gap-0.5 text-sm font-semibold ${
                  improved ? "text-emerald-400" : scoreDelta < 0 ? "text-red-400" : "text-slate-400"
                }`}
              >
                {improved ? (
                  <TrendingUp className="h-4 w-4" />
                ) : scoreDelta < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}%
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-slate-400">Acertos</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-white">{previous.correctAnswers}</span>
            <span className="text-slate-500">→</span>
            <span className="text-lg font-bold text-white">{current.correctAnswers}</span>
            {correctDelta != null && correctDelta !== 0 && (
              <span
                className={`text-sm font-semibold ${
                  correctDelta > 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {correctDelta > 0 ? `+${correctDelta}` : correctDelta}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

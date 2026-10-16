import { Card } from "@/components/ui/card";
import { formatSubjectLabel } from "@/lib/exam-learning";
import type { SubjectStat } from "@/services/exam-learning.service";
import { BarChart3 } from "lucide-react";

type Props = {
  stats: SubjectStat[];
  title?: string;
};

export function ExamSubjectStatsPanel({ stats, title = "Desempenho por assunto" }: Props) {
  if (stats.length === 0) return null;

  return (
    <Card padding="md">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-teal-300" />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <ul className="space-y-3">
        {stats.map((stat) => (
          <li key={stat.subject}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-300">{formatSubjectLabel(stat.subject)}</span>
              <span
                className={`font-semibold ${
                  stat.accuracy >= 70
                    ? "text-emerald-400"
                    : stat.accuracy >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {stat.accuracy}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${
                  stat.accuracy >= 70
                    ? "bg-emerald-400"
                    : stat.accuracy >= 50
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
                style={{ width: `${Math.max(stat.accuracy, 4)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {stat.correct} de {stat.total} questões corretas
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

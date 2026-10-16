import { Clock, ListChecks } from "lucide-react";
import { CourseProgressBar } from "@/components/courses/course-progress-bar";
import type { LessonProgressContext } from "@/services/lesson-learning.service";

type Props = {
  progress: number;
  learning: LessonProgressContext;
};

export function LessonProgressHeader({ progress, learning }: Props) {
  const subtitle = `Aula ${learning.currentLessonNumber} de ${learning.totalLessons} · ~${learning.remainingLabel} restantes`;

  return (
    <div className="space-y-4">
      <CourseProgressBar
        progress={progress}
        label="Seu progresso neste curso"
        prominent
        subtitle={subtitle}
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-300">
          <ListChecks className="h-4 w-4 text-sky-300" />
          {learning.completedLessons}/{learning.totalLessons} aulas concluídas
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-300">
          <Clock className="h-4 w-4 text-teal-300" />
          ~{learning.remainingLabel} para terminar
        </span>
      </div>
    </div>
  );
}

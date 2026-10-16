import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

type Props = {
  courseSlug: string;
  nextLesson: { id: string; title: string };
  completed?: boolean;
};

export function NextLessonCard({ courseSlug, nextLesson, completed = false }: Props) {
  return (
    <Card
      padding="md"
      className="border-teal-400/25 bg-gradient-to-r from-teal-500/10 to-transparent"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-200">
            <BookOpen className="h-4 w-4" />
            {completed ? "Próxima aula recomendada" : "Continue sua trilha"}
          </div>
          <p className="mt-2 font-semibold text-white">{nextLesson.title}</p>
          {completed && (
            <p className="mt-1 text-sm text-slate-400">
              Ótimo progresso! Siga para a próxima aula sem perder o ritmo.
            </p>
          )}
        </div>
        <Link
          href={`/courses/${courseSlug}/learn/${nextLesson.id}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-400"
        >
          Ir para aula
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}

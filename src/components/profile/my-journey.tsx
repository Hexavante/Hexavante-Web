import Link from "next/link";
import { Award, BookOpen, Clock3, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AppLink } from "@/components/ui/app-link";
import type { listUserEnrollments } from "@/services/student.service";

type Enrollment = Awaited<ReturnType<typeof listUserEnrollments>>[number];

type Props = {
  enrollments: Enrollment[];
};

export function MyJourney({ enrollments }: Props) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Minha jornada</h2>
          <p className="mt-1 text-sm text-slate-400">Cursos matriculados e progresso.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <AppLink href="/courses/history" muted className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4" />
            Histórico de cursos
          </AppLink>
          <AppLink href="/certificados" muted className="inline-flex items-center gap-1">
            <Award className="h-4 w-4" />
            Certificados
          </AppLink>
          <AppLink href="/simulados/historico" muted className="inline-flex items-center gap-1">
            <Target className="h-4 w-4" />
            Simulados
          </AppLink>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Você ainda não está matriculado em nenhum curso."
          description="Explore o catálogo e comece sua primeira trilha."
        >
          <AppLink href="/courses" className="mt-4 inline-block">
            Ver cursos →
          </AppLink>
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {enrollments.map((enrollment) => {
            const done = enrollment.progress >= 100;
            return (
              <Card key={enrollment.id} padding="md" className="transition hover:border-sky-400/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-sky-300">{enrollment.course.category.name}</p>
                    <h3 className="mt-1 font-semibold text-white">{enrollment.course.title}</h3>
                  </div>
                  {done && (
                    <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                      Concluído
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Progresso</span>
                    <span>{Math.round(enrollment.progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400 transition-all"
                      style={{ width: `${Math.min(enrollment.progress, 100)}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/courses/${enrollment.course.slug}/learn`}
                  className="mt-4 inline-block text-sm font-semibold text-sky-300 hover:text-sky-200"
                >
                  {done ? "Revisar curso →" : "Continuar →"}
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, Clock3, GraduationCap } from "lucide-react";
import { auth } from "@/auth";
import { AppLink } from "@/components/ui/app-link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { listUserCourseHistory } from "@/services/student.service";

export default async function CourseHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/courses/history");

  const history = await listUserCourseHistory(session.user.id);
  const completedCount = history.filter((item) => item.progress >= 100).length;

  return (
    <PageShell>
      <div className="anim-enter anim-d1">
        <PageHeader
          badge="Minha jornada"
          icon={Clock3}
          title="Histórico de cursos"
          description="Veja seus cursos, progresso e datas de conclusão."
          action={
            <div className="flex flex-wrap gap-2">
              <AppLink href="/courses" muted>Explorar cursos</AppLink>
              <AppLink href="/certificados" muted>Certificados</AppLink>
            </div>
          }
        />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 anim-enter anim-d2">
        <Card padding="sm">
          <p className="text-sm text-slate-400">Cursos na sua jornada</p>
          <p className="mt-1 text-2xl font-bold text-white">{history.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-400">Cursos concluídos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{completedCount}</p>
        </Card>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Seu histórico ainda está vazio."
          description="Quando você se matricular, seus cursos e seu progresso aparecerão aqui."
        >
          <AppLink href="/courses" className="mt-4 inline-block">Encontrar um curso →</AppLink>
        </EmptyState>
      ) : (
        <ol className="space-y-3 anim-enter anim-d3">
          {history.map((item) => {
            const totalLessons = item.course.modules.reduce(
              (sum, module) => sum + module._count.lessons,
              0,
            );
            const complete = item.progress >= 100;

            return (
              <li key={item.id}>
                <Card padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-sky-300">{item.course.category.name}</span>
                      {complete && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                          <Award className="h-3.5 w-3.5" /> Concluído
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 text-base font-semibold text-white">{item.course.title}</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Matriculado em {item.enrolledAt.toLocaleDateString("pt-BR")}
                      {item.completedAt && <> · Concluído em {item.completedAt.toLocaleDateString("pt-BR")}</>}
                      {" · "}{item.lessonProgresses.length} de {totalLessons} aulas concluídas
                    </p>
                    <div className="mt-3 h-2 max-w-xl overflow-hidden rounded-full bg-slate-800" aria-label={`Progresso: ${Math.round(item.progress)}%`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400"
                        style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{Math.round(item.progress)}% concluído</p>
                  </div>
                  <Link
                    href={`/courses/${item.course.slug}/learn`}
                    className="hx-btn-secondary inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-sm"
                  >
                    <GraduationCap className="h-4 w-4" />
                    {complete ? "Revisar curso" : "Continuar curso"}
                  </Link>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </PageShell>
  );
}

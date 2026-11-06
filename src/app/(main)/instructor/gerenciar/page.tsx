import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Video, Radio, Plus, Settings, Target, Pencil } from "lucide-react";
import { canModerate, isInstructor } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { ScrollReveal } from "@/components/scroll-reveal";
import { prisma } from "@/lib/prisma";
import { listInstructorCourses } from "@/services/course.service";
import { listInstructorLiveRooms } from "@/services/live-room.service";
import { listExamsForAdmin } from "@/services/exam-admin.service";
import { ManageDeleteButton } from "@/components/instructor/manage-delete-button";
import { deleteCourseAction } from "@/app/actions/course";
import { deleteTutorialAction } from "@/app/actions/tutorial";
import { deleteExamByIdAction } from "@/app/actions/exam-admin";

type ManageItem = {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  href: string;
  onDelete?: () => Promise<{ success: boolean; error?: string }>;
};

export default async function GerenciarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/instructor/gerenciar");
  const instructor = isInstructor(session.user.roles);
  const moderator = canModerate(session.user.roles);
  if (!instructor && !moderator) redirect("/instructor/apply");

  const [courses, tutorials, rooms, exams] = await Promise.all([
    instructor
      ? listInstructorCourses(session.user.id)
      : Promise.resolve([] as Awaited<ReturnType<typeof listInstructorCourses>>),
    instructor
      ? prisma.tutorial.findMany({
          where: { authorId: session.user.id },
          include: { category: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    instructor ? listInstructorLiveRooms(session.user.id) : Promise.resolve([]),
    moderator ? listExamsForAdmin() : prisma.exam.findMany({
      where: { submission: { authorId: session.user.id } }, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, isPublished: true },
    }),
  ]);

  const courseItems: ManageItem[] = courses.slice(0, 4).map((c) => ({
    id: c.id,
    name: c.title,
    status: c.status === "APPROVED" ? (c.isPublished ? "Publicado" : "Aprovado") : c.status === "PENDING_REVIEW" ? "Pendente" : "Rascunho",
    statusColor: c.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-400" : c.status === "PENDING_REVIEW" ? "bg-amber-500/15 text-amber-400" : "bg-slate-500/15 text-slate-400",
    href: `/instructor/courses/${c.id}/edit`,
    onDelete: deleteCourseAction.bind(null, c.id),
  }));

  const tutorialItems: ManageItem[] = tutorials.slice(0, 4).map((t) => ({
    id: t.id,
    name: t.title,
    status: t.isPublished ? "Publicado" : "Rascunho",
    statusColor: t.isPublished ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400",
    href: `/instructor/tutorials/${t.id}/edit`,
    onDelete: deleteTutorialAction.bind(null, t.id),
  }));

  const examItems: ManageItem[] = exams.slice(0, 4).map((e) => ({
    id: e.id,
    name: e.title,
    status: e.isPublished ? "Publicado" : moderator ? "Rascunho" : "Na moderação",
    statusColor: e.isPublished ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400",
    href: moderator ? `/admin/simulados/${e.id}/edit` : `/instructor/simulados/${e.id}/edit`,
    onDelete: moderator ? deleteExamByIdAction.bind(null, e.id) : undefined,
  }));

  return (
    <PageShell>
      <ScrollReveal>
        <PageHeader
          badge="Instrutor"
          icon={Settings}
          title="Painel do instrutor"
          description="Prepare suas aulas, acompanhe seus simulados e organize as próximas transmissões."
          action={<Link href="/app?modo=estudo" className="hx-btn-secondary">Abrir meu painel de estudos</Link>}
        />
      </ScrollReveal>

      {instructor && (
        <section aria-label="Resumo do professor" className="mb-6 rounded-2xl border border-cyan-400/25 bg-[var(--surface)] p-5">
          <p className="hx-accent-text text-xs font-bold uppercase tracking-wide">Mesa de trabalho</p>
          <h2 className="mt-2 text-xl font-bold">O que você vai ensinar hoje?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link className="hx-btn-secondary" href="/instructor/courses">Cursos em análise · {courses.filter(c => c.status === "PENDING_REVIEW").length}</Link>
            <Link className="hx-btn-secondary" href="/instructor/tutorials">Tutoriais em rascunho · {tutorials.filter(t => !t.isPublished).length}</Link>
            <Link className="hx-btn-secondary" href="/instructor/live-rooms">Salas agendadas · {rooms.filter(r => r.status === "SCHEDULED").length}</Link>
          </div>
        </section>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {instructor && (
          <ScrollReveal delay={0}>
            <SectionCard
              icon={BookOpen}
              title="Cursos"
              count={courses.length}
              color="text-sky-400 bg-sky-400/10 border-sky-400/20"
              href="/instructor/courses"
              createHref="/instructor/courses/new"
              createLabel="Novo curso"
              items={courseItems}
            />
          </ScrollReveal>
        )}

        {instructor && (
          <ScrollReveal delay={100}>
            <SectionCard
              icon={Video}
              title="Tutoriais"
              count={tutorials.length}
              color="text-cyan-400 bg-cyan-400/10 border-cyan-400/20"
              href="/instructor/tutorials"
              createHref="/instructor/tutorials/new"
              createLabel="Novo tutorial"
              items={tutorialItems}
            />
          </ScrollReveal>
        )}

        {(moderator || instructor) && (
          <ScrollReveal delay={instructor ? 200 : 0}>
            <SectionCard
              icon={Target}
              title="Simulados"
              count={exams.length}
              color="text-teal-400 bg-teal-400/10 border-teal-400/20"
              href={moderator ? "/admin/simulados" : "/instructor/simulados"}
              createHref={moderator ? "/admin/simulados/new" : "/instructor/simulados/new"}
              createLabel="Novo simulado"
              items={examItems}
            />
          </ScrollReveal>
        )}

        {instructor && (
          <ScrollReveal delay={moderator ? 300 : 200}>
            <SectionCard
              icon={Radio}
              title="Salas ao vivo"
              count={rooms.length}
              color="text-violet-400 bg-violet-400/10 border-violet-400/20"
              href="/instructor/live-rooms"
              createHref="/instructor/live-rooms/new"
              createLabel="Nova sala"
              items={rooms.slice(0, 4).map((r) => ({
                id: r.id,
                name: r.title,
                status: r.status === "LIVE" ? "Ao vivo" : r.status === "SCHEDULED" ? "Agendada" : "Finalizada",
                statusColor: r.status === "LIVE" ? "bg-red-500/15 text-red-400" : r.status === "SCHEDULED" ? "bg-sky-500/15 text-sky-400" : "bg-slate-500/15 text-slate-400",
                href: `/live-rooms/${r.id}`,
              }))}
            />
          </ScrollReveal>
        )}
      </div>
    </PageShell>
  );
}

function SectionCard({
  icon: Icon,
  title,
  count,
  color,
  href,
  createHref,
  createLabel,
  items,
}: {
  icon: typeof BookOpen;
  title: string;
  count: number;
  color: string;
  href: string;
  createHref: string;
  createLabel: string;
  items: ManageItem[];
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/[0.12]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-lg border ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs text-slate-400">{count} itens</p>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 transition hover:bg-white/[0.05]"
            >
              <Link href={item.href} className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-slate-300">{item.name}</span>
                <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${item.statusColor}`}>
                  <Pencil className="h-2.5 w-2.5" />
                  {item.status}
                </span>
              </Link>
              {item.onDelete && <ManageDeleteButton title={item.name} onDelete={item.onDelete} />}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link
          href={createHref}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
        >
          <Plus className="h-3 w-3" />
          {createLabel}
        </Link>
        <Link
          href={href}
          className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
        >
          Ver todos
        </Link>
      </div>
    </div>
  );
}

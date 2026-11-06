import { Video, Plus } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isInstructor } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export default async function InstructorTutorialsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/instructor/tutorials");
  if (!isInstructor(session.user.roles)) redirect("/app");

  const tutorials = await prisma.tutorial.findMany({
    where: { authorId: session.user.id },
    include: {
      category: { select: { name: true } },
      _count: { select: { tags: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageShell>
      <PageHeader
        badge="Instrutor"
        icon={Video}
        title="Meus Tutoriais"
        description="Gerencie seus tutoriais em vídeo."
        action={
          <Link
            href="/instructor/tutorials/new"
            className="hx-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo tutorial
          </Link>
        }
      />

      {tutorials.length === 0 ? (
        <EmptyState
          icon={Video}
          title="Nenhum tutorial criado."
          description="Comece criando seu primeiro tutorial."
        />
      ) : (
        <div className="grid gap-3">
          {tutorials.map((t) => (
            <Link
              key={t.id}
              href={`/instructor/tutorials/${t.id}/edit`}
              aria-label={`Editar tutorial ${t.title}`}
              className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-cyan-400/30 hover:bg-white/[0.04]"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Video className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">{t.title}</h3>
                <p className="text-xs text-slate-400">
                  Editar tutorial · {t.category?.name ?? "Sem categoria"} · {t._count.tags} tags
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.isPublished
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {t.isPublished ? "Publicado" : "Rascunho"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

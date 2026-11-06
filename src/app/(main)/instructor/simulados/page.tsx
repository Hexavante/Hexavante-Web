import Link from "next/link";
import { auth } from "@/auth";
import { isInstructor } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/page-shell";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; novaVersao?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/instructor/simulados");
  if (!isInstructor(session.user.roles)) redirect("/instructor/apply");
  const exams = await prisma.exam.findMany({
    where: { submission: { authorId: session.user.id } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, isPublished: true, slug: true },
  });
  const pendingEssays = await prisma.examAnswer.count({
    where: {
      essayStatus: "PENDING",
      essayAnswer: { not: null },
      attempt: { exam: { submission: { authorId: session.user.id } } },
    },
  });
  const query = await searchParams;
  return (
    <PageShell>
      <Link href="/instructor/gerenciar">← Gerenciar conteúdo</Link>
      <h1 className="my-4 text-3xl font-bold">Meus simulados</h1>
      {query.enviado === "1" && (
        <p role="status" className="mb-4">
          {query.novaVersao === "1"
            ? "Nova versão enviada para revisão. A prova anterior foi preservada."
            : "Simulado enviado para revisão."}
        </p>
      )}
      <div className="my-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3">
          <p className="text-2xl font-bold text-violet-100">{pendingEssays}</p>
          <p className="text-sm text-violet-200/90">Dissertativas pendentes</p>
        </div>
        <Link
          href="/instructor/simulados/correcoes"
          className="rounded-xl border border-[hsl(var(--sidebar-highlight)/0.22)] bg-[hsl(var(--sidebar-highlight)/0.1)] px-4 py-3 transition hover:border-[hsl(var(--sidebar-highlight)/0.4)]"
        >
          <p className="text-sm font-semibold text-[hsl(var(--sidebar-foreground)/0.92)]">
            Corrigir dissertativas →
          </p>
          <p className="mt-1 text-xs hx-accent-text-muted">Fila de correção manual</p>
        </Link>
      </div>
      <Link href="/instructor/simulados/new" className="hx-btn-primary">
        Novo simulado
      </Link>
      <ul className="my-5 space-y-3">
        {exams.map((exam) => (
          <li
            key={exam.id}
            className="rounded-xl border border-[var(--border)] p-4"
          >
            <strong>{exam.title}</strong>
            <Link
              href={`/instructor/simulados/${exam.id}/edit`}
              className="hx-btn-secondary ml-4 inline-flex"
              aria-label={`Editar ${exam.title}`}
            >
              Editar simulado
            </Link>
            <p>
              {exam.isPublished ? (
                <Link href={"/simulados/" + exam.slug}>
                  Publicado · Abrir simulado
                </Link>
              ) : (
                "Na moderação"
              )}
            </p>
          </li>
        ))}
      </ul>
      {!exams.length && <p>Seus simulados enviados aparecerão aqui.</p>}
    </PageShell>
  );
}

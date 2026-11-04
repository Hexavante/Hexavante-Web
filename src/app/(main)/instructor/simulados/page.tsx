import Link from "next/link";
import { auth } from "@/auth";
import { isInstructor } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/page-shell";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/instructor/simulados");
  if (!isInstructor(session.user.roles)) redirect("/instructor/apply");
  const exams = await prisma.exam.findMany({
    where: { submission: { authorId: session.user.id } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, isPublished: true, slug: true },
  });
  return (
    <PageShell>
      <Link href="/instructor/gerenciar">← Gerenciar conteúdo</Link>
      <h1 className="my-4 text-3xl font-bold">Meus simulados</h1>
      {(await searchParams).enviado === "1" && (
        <p role="status" className="mb-4">
          Simulado enviado para revisão.
        </p>
      )}
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

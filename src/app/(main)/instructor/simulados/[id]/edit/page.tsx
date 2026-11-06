import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { isInstructor } from "@/lib/permissions";
import { PageShell } from "@/components/ui/page-shell";
import {
  getInstructorExamForEdit,
  examEditRevision,
  requiresExamRevision,
} from "@/services/instructor-exam-edit.service";
import { InstructorExamEditForm } from "./form";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id)
    redirect(
      "/login?callbackUrl=" +
        encodeURIComponent("/instructor/simulados/" + id + "/edit"),
    );
  if (!isInstructor(session.user.roles)) redirect("/instructor/apply");
  const exam = await getInstructorExamForEdit(id, session.user.id);
  if (!exam) notFound();
  return (
    <PageShell>
      <Link href="/instructor/simulados">← Meus simulados</Link>
      <h1 className="my-4 text-3xl font-bold">Editar simulado</h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        {requiresExamRevision(exam)
          ? "Ao salvar, criaremos uma nova versão para a moderação. A versão anterior, as respostas e as notas dos alunos serão preservadas."
          : "Suas alterações serão enviadas para a moderação antes de publicar."}
      </p>
      <InstructorExamEditForm
        id={id}
        revision={examEditRevision(exam)}
        requestId={randomUUID()}
        initial={{
          title: exam.title,
          examType: exam.examType,
          description: exam.description ?? "",
          timeLimit: exam.timeLimit,
          questions: exam.questions.map((q) => ({
            id: q.id,
            statement: q.statement,
            alternatives: q.alternatives.map((a) => a.text),
            correct: q.alternatives.findIndex((a) => a.isCorrect),
            expectedAnswer: q.expectedAnswer ?? "",
            essay: q.type === "ESSAY",
          })),
        }}
      />
    </PageShell>
  );
}

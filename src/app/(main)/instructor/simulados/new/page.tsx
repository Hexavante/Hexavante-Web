import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { isInstructor } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { InstructorExamForm } from "./form";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/login?callbackUrl=/instructor/simulados/new");
  if (!isInstructor(session.user.roles)) redirect("/instructor/apply");
  return (
    <PageShell>
      <h1 className="text-3xl font-bold">Novo simulado</h1>
      <p className="mb-6 mt-2">
        Adicione as questões e o gabarito. A moderação revisará o conteúdo antes
        da publicação.
      </p>
      <InstructorExamForm requestId={randomUUID()} />
    </PageShell>
  );
}

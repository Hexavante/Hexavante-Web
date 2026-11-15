import { auth } from "@/auth";
import { isInstructor } from "@/lib/permissions";
import { listCategories } from "@/services/course.service";
import { redirect } from "next/navigation";
import { NewCourseForm } from "./new-course-form";
import { AppLink } from "@/components/ui/app-link";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { BookPlus } from "lucide-react";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/instructor/courses/new");
  if (!isInstructor(session.user.roles)) redirect("/instructor/apply");

  const categories = await listCategories();

  return (
    <PageShell>
      <AppLink href="/instructor/courses" muted className="mb-4 inline-flex items-center gap-1">
        ← Meus cursos
      </AppLink>
      <PageHeader
        badge="Instrutor"
        icon={BookPlus}
        title="Novo curso"
        description="Comece pelo básico. Depois de criar, você monta os módulos e as aulas; o curso só aparece no catálogo quando um moderador aprovar."
      />
      <NewCourseForm categories={categories} />
    </PageShell>
  );
}

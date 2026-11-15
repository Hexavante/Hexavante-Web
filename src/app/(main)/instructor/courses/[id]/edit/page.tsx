import { MaterialForm } from "@/components/courses/material-form";
import { splitMindMap } from "@/lib/mind-map";
import { auth } from "@/auth";
import {
  addLessonAction,
  addModuleAction,
  deleteLessonAction,
  deleteMaterialAction,
  deleteModuleAction,
  updateLessonAction,
  updateModuleAction,
} from "@/app/actions/course";
import { EditCourseForm } from "@/components/courses/edit-course-form";
import { resubmitCourseAction } from "@/app/actions/moderation";
import { DeleteContentButton } from "@/components/courses/delete-content-button";
import { InlineForm } from "@/components/courses/inline-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { COURSE_STATUS_LABELS, isInstructor } from "@/lib/permissions";
import { getCourseById, listCategories } from "@/services/course.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/instructor/courses/${id}/edit`);
  if (!isInstructor(session.user.roles)) redirect("/instructor/courses");

  const result = await getCourseById(id, session.user.id);
  if (!result || !result.isInstructor) notFound();

  const { course } = result;
  const categories = await listCategories();
  const nextModuleOrder = course.modules.length + 1;
  const lessonCount = course.modules.reduce((total, mod) => total + mod.lessons.length, 0);
  // O que falta para o curso ficar apresentável ao moderador e ao aluno.
  const checklist = [
    { done: Boolean(course.shortDescription?.trim()), label: "Descrição curta" },
    { done: Boolean(course.coverImage || course.thumbnailUrl), label: "Imagem de capa" },
    { done: course.modules.length > 0, label: "Pelo menos um módulo" },
    { done: lessonCount > 0, label: "Pelo menos uma aula" },
  ];
  const missing = checklist.filter((item) => !item.done).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/instructor/courses"
        className="text-sm text-sky-300 hover:underline"
        aria-label="Voltar para meus cursos"
      >
        ← Meus cursos
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">Editar: {course.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <StatusBadge
          status={course.status}
          label={COURSE_STATUS_LABELS[course.status] ?? course.status}
        />
        {course.status === "APPROVED" && (
          <Link
            href={`/courses/${course.slug}`}
            className="text-sm text-sky-300 hover:underline"
            aria-label="Ver página pública"
          >
            Ver página pública →
          </Link>
        )}
      </div>

      {(course.status === "REVISION_REQUIRED" || course.status === "REJECTED") && (
        <div className="mt-4 rounded-xl border border-orange-900/50 bg-orange-900/10 p-4">
          <p className="text-sm text-orange-400">
            Ajuste o conteúdo e reenvie para nova análise do moderador.
          </p>
          <form action={resubmitCourseAction.bind(null, id)} className="mt-3">
            <Button type="submit" size="sm">
              Reenviar para análise
            </Button>
          </form>
        </div>
      )}

      {course.status === "PENDING_REVIEW" && (
        <p className="mt-4 rounded-xl border border-amber-900/50 bg-amber-900/10 p-4 text-sm text-amber-400">
          Este curso está aguardando aprovação de um moderador e ainda não aparece no catálogo
          público.
        </p>
      )}

      {course.status === "APPROVED" && (
        <p className="mt-4 rounded-xl border border-sky-900/50 bg-sky-900/10 p-4 text-sm text-sky-300">
          Alterações nas informações do curso reenviam o conteúdo para análise do moderador.
        </p>
      )}

      <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-5" aria-label="O que falta no curso">
        <h2 className="font-semibold text-white">
          {missing === 0 ? "Curso completo" : `Falta${missing > 1 ? "m" : ""} ${missing} ${missing > 1 ? "itens" : "item"} para o curso ficar completo`}
        </h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {checklist.map((item) => (
            <li key={item.label} className={item.done ? "text-emerald-400" : "text-slate-400"}>
              {item.done ? "✓" : "○"} {item.label}
            </li>
          ))}
        </ul>
        {lessonCount === 0 && course.status === "PENDING_REVIEW" && (
          <p className="mt-3 text-sm text-slate-400">
            O moderador só consegue avaliar o curso depois que ele tiver pelo menos uma aula.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Módulos e conteúdo</h2>

        {course.modules.map((mod) => (
          <div key={mod.id} className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">
                  Módulo {mod.orderNumber}: {mod.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {mod.lessons.length} {mod.lessons.length === 1 ? "aula" : "aulas"}
                  {mod.materials.length > 0 && ` · ${mod.materials.length} PDF`}
                </p>
                {mod.description && (
                  <p className="mt-1 text-sm text-slate-400">{mod.description}</p>
                )}
              </div>
              <DeleteContentButton
                action={deleteModuleAction.bind(null, id, mod.id)}
                label="Excluir módulo"
                confirmMessage="Excluir este módulo e todo o conteúdo dentro dele?"
              />
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-sky-300 hover:underline">
                Editar título, ordem e descrição do módulo
              </summary>
              <div className="mt-3">
              <InlineForm
                title="Editar módulo"
                submitLabel="Salvar módulo"
                action={updateModuleAction.bind(null, id, mod.id)}
                fields={[
                  { name: "title", label: "Título", defaultValue: mod.title },
                  {
                    name: "orderNumber",
                    label: "Ordem",
                    type: "number",
                    defaultValue: String(mod.orderNumber),
                  },
                  {
                    name: "description",
                    label: "Descrição",
                    type: "textarea",
                    defaultValue: mod.description ?? "",
                    required: false,
                  },
                ]}
              />
              </div>
            </details>

            <ul className="mt-4 space-y-3">
              {mod.lessons.map((lesson) => (
                <li key={lesson.id} className="rounded-lg border border-white/5 bg-black/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-200">
                      Aula {lesson.orderNumber}: {lesson.title}
                      <span className={lesson.videoUrl ? "text-slate-500" : "text-amber-400"}>
                        {lesson.videoUrl ? " · com vídeo" : " · sem vídeo"}
                      </span>
                    </p>
                    <DeleteContentButton
                      action={deleteLessonAction.bind(null, id, lesson.id)}
                      label="Excluir aula"
                      confirmMessage="Excluir esta aula?"
                    />
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-sky-300 hover:underline">
                      Editar aula
                    </summary>
                    <div className="mt-3">
                    <InlineForm
                      initialMindMap={splitMindMap(lesson.description).topics.join("\n")}
                      title="Editar aula"
                      submitLabel="Salvar aula"
                      action={updateLessonAction.bind(null, id, lesson.id)}
                      fields={[
                        { name: "title", label: "Título", defaultValue: lesson.title },
                        {
                          name: "orderNumber",
                          label: "Ordem",
                          type: "number",
                          defaultValue: String(lesson.orderNumber),
                        },
                        {
                          name: "videoUrl",
                          label: "URL do vídeo",
                          defaultValue: lesson.videoUrl ?? "",
                          required: false,
                        },
                        {
                          name: "videoProvider",
                          label: "Provedor",
                          defaultValue: lesson.videoProvider ?? "youtube",
                          options: [
                            { value: "youtube", label: "YouTube" },
                            { value: "vimeo", label: "Vimeo" },
                            { value: "other", label: "Outro" },
                          ],
                        },
                        {
                          name: "description",
                          label: "Descrição",
                          type: "textarea",
                          defaultValue: splitMindMap(lesson.description).description,
                          required: false,
                        },
                      ]}
                    />
                    </div>
                  </details>
                </li>
              ))}
              {mod.materials.map((material) => (
                <li
                  key={material.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 p-4 text-sm text-sky-300"
                >
                  <span>PDF: {material.title}</span>
                  <DeleteContentButton
                    action={deleteMaterialAction.bind(null, id, material.id)}
                    label="Excluir"
                    confirmMessage="Excluir este material?"
                  />
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-4">
              <InlineForm
                initialMindMap=""
                title="Adicionar aula"
                submitLabel="Adicionar aula"
                action={addLessonAction.bind(null, id, mod.id)}
                fields={[
                  { name: "title", label: "Título da aula" },
                  {
                    name: "orderNumber",
                    label: "Ordem",
                    type: "number",
                    defaultValue: String(mod.lessons.length + 1),
                  },
                  {
                    name: "videoUrl",
                    label: "URL do vídeo (YouTube/Vimeo)",
                    required: false,
                  },
                  {
                    name: "videoProvider",
                    label: "Provedor",
                    defaultValue: "youtube",
                    options: [
                      { value: "youtube", label: "YouTube" },
                      { value: "vimeo", label: "Vimeo" },
                      { value: "other", label: "Outro" },
                    ],
                  },
                  {
                    name: "description",
                    label: "Descrição",
                    type: "textarea",
                    required: false,
                  },
                ]}
              />
              <MaterialForm courseId={id} moduleId={mod.id} />
            </div>
          </div>
        ))}

        <InlineForm
          title="Novo módulo"
          submitLabel="Adicionar módulo"
          action={addModuleAction.bind(null, id)}
          fields={[
            { name: "title", label: "Título do módulo" },
            {
              name: "orderNumber",
              label: "Ordem",
              type: "number",
              defaultValue: String(nextModuleOrder),
            },
            {
              name: "description",
              label: "Descrição",
              type: "textarea",
              required: false,
            },
          ]}
        />
      </section>

      <section className="mt-10 rounded-xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Informações do curso</h2>
        <EditCourseForm
          courseId={id}
          categories={categories}
          course={{
            title: course.title,
            categoryId: course.categoryId,
            shortDescription: course.shortDescription,
            description: course.description,
            tags: course.courseTags.map((ct) => ct.tag.name).join(", "),
            coverImage: course.coverImage,
            thumbnailUrl: course.thumbnailUrl,
            level: course.level,
            estimatedHours: course.estimatedHours,
            progressionType: course.progressionType,
            isPublished: course.isPublished,
          }}
        />
      </section>
    </div>
  );
}

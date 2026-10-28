import { auth } from "@/auth";
import { CertificateButton } from "@/components/courses/certificate-button";
import { CompleteLessonButton } from "@/components/courses/complete-lesson-button";
import { LessonFavoriteButton } from "@/components/courses/lesson-favorite-button";
import { LessonNotesPanel } from "@/components/courses/lesson-notes-panel";
import { LessonProgressHeader } from "@/components/courses/lesson-progress-header";
import { LessonSidebar } from "@/components/courses/lesson-sidebar";
import { ModuleMaterialsPanel } from "@/components/courses/module-materials-panel";
import { NextLessonCard } from "@/components/courses/next-lesson-card";
import { VideoPlayer } from "@/components/courses/video-player";
import { AppLink } from "@/components/ui/app-link";
import { LinkButton } from "@/components/ui/button";
import { getLessonWithAccess, LessonProgressionError } from "@/services/enrollment.service";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string; lessonId: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/courses/${slug}/learn/${lessonId}`);

  let data;
  try {
    data = await getLessonWithAccess(session.user.id, slug, lessonId);
  } catch (error) {
    if (!(error instanceof LessonProgressionError)) {
      console.error("[aula] Falha ao carregar aula:", error);
    }
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="rounded-lg bg-amber-900/20 p-4 text-amber-400">
          {error instanceof LessonProgressionError
            ? error.message
            : "Não foi possível carregar a aula agora. Tente novamente em instantes."}
        </p>
        <AppLink href={`/courses/${slug}`} className="mt-4 inline-block">
          Voltar ao curso
        </AppLink>
      </div>
    );
  }

  if (!data) notFound();

  const { course, enrollment, lesson, module, allLessons, progresses, learning } = data;
  const completedIds = new Set(progresses.filter((p) => p.completed).map((p) => p.lessonId));
  const favoriteIds = new Set(learning.favoriteLessonIds);
  const isCompleted = completedIds.has(lesson.id);

  const sidebarLessons = allLessons.map((l) => {
    const mod = course.modules.find((m) => m.id === l.moduleId)!;
    return {
      id: l.id,
      title: l.title,
      orderNumber: l.orderNumber,
      moduleId: l.moduleId,
      moduleOrder: mod.orderNumber,
      moduleTitle: mod.title,
    };
  });

  const showNextLessonCard =
    learning.nextLesson && !isCompleted && learning.nextLesson.id !== lesson.id;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      <div>
        <AppLink href={`/courses/${slug}`} className="mb-4 inline-block text-sm">
          ← {course.title}
        </AppLink>
        <LessonSidebar
          courseSlug={slug}
          lessons={sidebarLessons}
          currentLessonId={lessonId}
          completedLessonIds={completedIds}
          favoriteLessonIds={favoriteIds}
          progressionType={course.progressionType}
        />
        <div className="mt-4">
          <CertificateButton courseId={course.id} progress={enrollment.progress} />
        </div>
      </div>

      <div className="space-y-6">
        <LessonProgressHeader progress={enrollment.progress} learning={learning} />

        <div>
          <p className="text-sm text-slate-400">
            Módulo {module?.orderNumber}: {module?.title}
          </p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
            <LessonFavoriteButton
              courseSlug={slug}
              lessonId={lesson.id}
              initialFavorite={learning.isFavorite}
            />
          </div>
          {lesson.description && <p className="mt-2 text-slate-300">{lesson.description}</p>}
        </div>

        {lesson.videoUrl && (
          <VideoPlayer url={lesson.videoUrl} provider={lesson.videoProvider} />
        )}

        {module && module.materials.length > 0 && (
          <ModuleMaterialsPanel moduleTitle={module.title} materials={module.materials} />
        )}

        <LessonNotesPanel
          courseSlug={slug}
          lessonId={lesson.id}
          initialNote={learning.note}
        />

        {showNextLessonCard && learning.nextLesson && (
          <NextLessonCard courseSlug={slug} nextLesson={learning.nextLesson} />
        )}

        <div className="flex flex-wrap items-start gap-3">
          <CompleteLessonButton
            courseSlug={slug}
            lessonId={lesson.id}
            courseId={course.id}
            completed={isCompleted}
            nextLesson={learning.nextLesson}
          />
          {learning.nextLesson && isCompleted && (
            <LinkButton
              href={`/courses/${slug}/learn/${learning.nextLesson.id}`}
              variant="outline"
              className="min-h-11"
              aria-label="Próxima aula"
            >
              Próxima aula →
            </LinkButton>
          )}
        </div>
      </div>
    </div>
  );
}

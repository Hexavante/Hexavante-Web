import { MindMap } from "@/components/courses/visual-learning-viewer";
import { auth } from "@/auth";
import { enrollAction } from "@/app/actions/enrollment";
import { CertificateButton } from "@/components/courses/certificate-button";
import { CourseProgressBar } from "@/components/courses/course-progress-bar";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { countTotalLessons, getApprovedCourseBySlug } from "@/services/course.service";
import { getEnrollment } from "@/services/enrollment.service";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { COURSE_LEVEL_LABELS } from "@/lib/course-labels";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Layers3, Users } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const course = await getApprovedCourseBySlug(slug);

  if (!course) notFound();

  const enrollment = session?.user?.id ? await getEnrollment(session.user.id, course.id) : null;

  const totalLessons = countTotalLessons(course.modules);

  return (
    <PageShell size="md">
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <CourseThumbnail
          url={course.coverImage ?? course.thumbnailUrl}
          title={course.title}
          className="h-52 w-full sm:h-64"
        />
        <div className="border-t border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="sky">
              <BookOpen className="h-3.5 w-3.5" />
              {course.category.name}
            </Badge>
            <Badge variant="emerald">{COURSE_LEVEL_LABELS[course.level] ?? course.level}</Badge>
            <Badge>Gratuito</Badge>
            {course.courseTags.map((ct) => (
              <Badge key={ct.tag.id} variant="default">
                #{ct.tag.name}
              </Badge>
            ))}
          </div>
          <h1 className="hx-page-title mt-3">{course.title}</h1>
          {course.shortDescription && (
            <p className="mt-3 text-lg text-slate-300">{course.shortDescription}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5">
          <Layers3 className="h-4 w-4 text-teal-300" />
          {course.modules.length} {course.modules.length === 1 ? "módulo" : "módulos"}
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-sky-300" />
          {totalLessons} aulas
        </span>
        {course.estimatedHours != null && course.estimatedHours > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-300" />
            {course.estimatedHours}h estimadas
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-sky-300" />
          {course.instructors[0]?.user.fullName ?? "Instrutor Hexavante"}
        </span>
      </div>

      {enrollment && (
        <Card padding="md" className="mt-6">
          <CourseProgressBar progress={enrollment.progress} />
        </Card>
      )}

      {course.description && (
        <Card padding="lg" className="mt-8">
          <h2 className="font-semibold text-white">Sobre o curso</h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-300">{course.description}</p>
        </Card>
      )}

      {totalLessons > 0 && <details className="my-5 rounded-xl border border-[var(--border)] p-4">
        <summary className="hx-accent-link cursor-pointer font-semibold">Explorar mapa mental do curso</summary>
        <MindMap title={course.title} topics={course.modules.map(mod => [mod.title, mod.lessons.map(lesson => lesson.title).join(" · ")].filter(Boolean).join(": "))} />
      </details>}
      <Card padding="lg" className="mt-8">
        <h2 className="font-semibold text-white">Conteúdo</h2>
        <ul className="mt-4 space-y-4">
          {course.modules.map((mod) => (
            <li key={mod.id}>
              <p className="font-medium text-slate-200">
                {mod.orderNumber}. {mod.title}
              </p>
              <ul className="mt-2 space-y-1 pl-4 text-sm text-slate-400">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    Aula {lesson.orderNumber}: {lesson.title}
                  </li>
                ))}
                {mod.materials.map((mat) => (
                  <li key={mat.id} className="text-sky-300">
                    PDF: {mat.title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {enrollment ? (
          <>
            <LinkButton href={`/courses/${slug}/learn`} aria-label="Continuar estudando">
              Continuar estudando
            </LinkButton>
            <CertificateButton courseId={course.id} progress={enrollment.progress} />
          </>
        ) : session?.user ? (
          <form action={enrollAction.bind(null, course.id, slug)}>
            <Button type="submit">Matricular-se no curso</Button>
          </form>
        ) : (
          <LinkButton
            href={`/login?callbackUrl=/courses/${slug}`}
            aria-label="Entrar para se matricular"
          >
            Entrar para se matricular
          </LinkButton>
        )}
      </div>
    </PageShell>
  );
}

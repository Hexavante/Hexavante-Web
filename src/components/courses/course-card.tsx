import { BookOpen, Clock, Layers3, Users } from "lucide-react";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { Badge } from "@/components/ui/badge";
import { CardFooter, CardHeader, CardTitle, InteractiveCard } from "@/components/ui/card";
import { COURSE_LEVEL_LABELS } from "@/lib/course-labels";

type CourseCardProps = {
  slug: string;
  title: string;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  categoryName: string;
  moduleCount: number;
  enrollmentCount: number;
  level: string;
  estimatedHours?: number | null;
};

export function CourseCard({
  slug,
  title,
  shortDescription,
  thumbnailUrl,
  coverImage,
  categoryName,
  moduleCount,
  enrollmentCount,
  level,
  estimatedHours,
}: CourseCardProps) {
  return (
    <InteractiveCard
      href={`/courses/${slug}`}
      ariaLabel={`Ver curso: ${title}. Categoria: ${categoryName}. ${moduleCount} ${moduleCount === 1 ? "módulo" : "módulos"}, ${enrollmentCount} ${enrollmentCount === 1 ? "aluno matriculado" : "alunos matriculados"}.`}
      className="overflow-hidden"
    >
      <CourseThumbnail
        url={coverImage ?? thumbnailUrl}
        title={title}
        className="h-40 w-full transition group-hover:opacity-95"
      />
      <div className="p-5">
        <CardHeader>
          <Badge variant="sky">
            <BookOpen className="h-3.5 w-3.5" />
            {categoryName}
          </Badge>
          <Badge variant="emerald">{COURSE_LEVEL_LABELS[level] ?? level}</Badge>
        </CardHeader>

        <CardTitle className="transition-colors group-hover:text-sky-200">{title}</CardTitle>
        {shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{shortDescription}</p>
        )}

        <CardFooter className="text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <Layers3 className="h-4 w-4 text-teal-300" />
            {moduleCount} {moduleCount === 1 ? "módulo" : "módulos"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-sky-300" />
            {enrollmentCount} {enrollmentCount === 1 ? "aluno" : "alunos"}
          </span>
          {estimatedHours != null && estimatedHours > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-300" />
              {estimatedHours}h
            </span>
          )}
        </CardFooter>
      </div>
    </InteractiveCard>
  );
}

"use server";

import { auth } from "@/auth";
import { enrollInCourse } from "@/services/enrollment.service";
import { getApprovedCourseBySlug, searchApprovedCourses } from "@/services/course.service";

/**
 * Contrato interno exclusivo do web.
 *
 * Ele deliberadamente não reutiliza o contrato REST de `/api/v1`: aplicativos
 * desktop e mobile continuam livres para evoluir por aquele contrato, enquanto
 * a interface Next chama os serviços diretamente pelo servidor.
 */
export type WebCourseQuery = {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  courseType?: string;
};

export type WebCourseSummary = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  courseType: string;
  level: string | null;
  estimatedHours: number | null;
  totalModules: number;
  totalLessons: number;
  instructorName: string | null;
  createdAt: string;
};

export type WebCourseDetail = WebCourseSummary & {
  description: string | null;
  coverImage: string | null;
  progressionType: string;
  status: string;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    orderNumber: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      duration: number | null;
      orderNumber: number;
    }>;
  }>;
};

export type WebPaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CourseForWebSummary = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  courseType: string;
  level: string | null;
  estimatedHours: number | null;
  createdAt: Date;
  instructors: Array<{ user: { fullName: string } }>;
  _count?: { modules: number };
  modules?: Array<{ lessons: Array<unknown> }>;
};

function toSummary(course: CourseForWebSummary): WebCourseSummary {
  const lessons = course.modules?.flatMap((module) => module.lessons) ?? [];
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl,
    courseType: course.courseType,
    level: course.level,
    estimatedHours: course.estimatedHours,
    totalModules: course._count?.modules ?? course.modules?.length ?? 0,
    totalLessons: lessons.length,
    instructorName: course.instructors[0]?.user.fullName ?? null,
    createdAt: course.createdAt.toISOString(),
  };
}

/** Lista o catálogo no processo do Next, sem round-trip para a API pública. */
export async function listWebCoursesAction(
  query: WebCourseQuery = {},
): Promise<WebPaginatedResponse<WebCourseSummary>> {
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(query.limit ?? 20)));
  const level = ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(query.level ?? "")
    ? (query.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED")
    : undefined;

  const courses = await searchApprovedCourses({
    q: query.search?.trim() || undefined,
    level,
    sort: "recent",
  });
  const filtered = query.courseType
    ? courses.filter((course) => course.courseType === query.courseType)
    : courses;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    data: filtered.slice(start, start + limit).map(toSummary),
    pagination: { page, limit, total, totalPages },
  };
}

/** Obtém o detalhe pelo slug, sem expor um endpoint REST ao navegador. */
export async function getWebCourseAction(slug: string): Promise<WebCourseDetail | null> {
  const course = await getApprovedCourseBySlug(slug);
  if (!course) return null;

  return {
    ...toSummary(course),
    description: course.description,
    coverImage: course.coverImage,
    progressionType: course.progressionType,
    status: course.status,
    modules: course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderNumber: module.orderNumber,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        orderNumber: lesson.orderNumber,
      })),
    })),
  };
}

export async function enrollWebCourseAction(
  courseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Faça login para continuar." };

  try {
    await enrollInCourse(session.user.id, courseId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível realizar a matrícula.",
    };
  }
}

import { prisma } from "@/lib/prisma";

export type RecommendedCourse = {
  id: string;
  title: string;
  slug: string;
  level: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  categoryName: string;
  enrollmentCount: number;
  reason: string;
};

export async function getRecommendedCourses(
  userId: string,
  limit = 4,
): Promise<RecommendedCourse[]> {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId },
    select: {
      course: {
        select: { id: true, categoryId: true, level: true },
      },
    },
  });

  const enrolledIds = enrollments.map((e) => e.course.id);
  const categoryIds = [...new Set(enrollments.map((e) => e.course.categoryId).filter(Boolean))];
  const levels = enrollments.map((e) => e.course.level);

  const levelHint =
    levels.includes("ADVANCED")
      ? "ADVANCED"
      : levels.includes("INTERMEDIATE")
        ? "INTERMEDIATE"
        : "BEGINNER";

  const categoryMatches =
    categoryIds.length > 0
      ? await prisma.course.findMany({
          where: {
            status: "APPROVED",
            id: { notIn: enrolledIds },
            categoryId: { in: categoryIds as string[] },
          },
          include: {
            category: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
          orderBy: { enrollments: { _count: "desc" } },
          take: limit,
        })
      : [];

  const results: RecommendedCourse[] = categoryMatches.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    level: course.level,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl,
    categoryName: course.category.name,
    enrollmentCount: course._count.enrollments,
    reason: `Porque você estuda ${course.category.name}`,
  }));

  if (results.length < limit) {
    const popular = await prisma.course.findMany({
      where: {
        status: "APPROVED",
        id: { notIn: [...enrolledIds, ...results.map((r) => r.id)] },
        ...(results.length === 0 ? { level: levelHint } : {}),
      },
      include: {
        category: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: limit - results.length,
    });

    for (const course of popular) {
      results.push({
        id: course.id,
        title: course.title,
        slug: course.slug,
        level: course.level,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        categoryName: course.category.name,
        enrollmentCount: course._count.enrollments,
        reason:
          results.length === 0 && categoryIds.length === 0
            ? "Popular entre estudantes"
            : "Mais procurado na plataforma",
      });
    }
  }

  return results.slice(0, limit);
}

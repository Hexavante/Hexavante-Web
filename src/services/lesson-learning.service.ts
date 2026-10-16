import { prisma } from "@/lib/prisma";
import {
  estimateRemainingStudyMinutes,
  formatStudyDuration,
  getNextIncompleteLesson,
} from "@/lib/course-learning";

export async function getLessonFavoriteIds(userId: string, lessonIds: string[]): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();

  const favorites = await prisma.lessonFavorite.findMany({
    where: { userId, lessonId: { in: lessonIds } },
    select: { lessonId: true },
  });

  return new Set(favorites.map((f) => f.lessonId));
}

export async function getLessonNote(userId: string, lessonId: string): Promise<string | null> {
  const note = await prisma.lessonNote.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { content: true },
  });
  return note?.content ?? null;
}

export async function toggleLessonFavorite(userId: string, lessonId: string): Promise<boolean> {
  const existing = await prisma.lessonFavorite.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (existing) {
    await prisma.lessonFavorite.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.lessonFavorite.create({ data: { userId, lessonId } });
  return true;
}

export async function saveLessonNote(
  userId: string,
  lessonId: string,
  content: string,
): Promise<void> {
  const trimmed = content.trim();

  if (!trimmed) {
    await prisma.lessonNote.deleteMany({ where: { userId, lessonId } });
    return;
  }

  await prisma.lessonNote.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, content: trimmed },
    update: { content: trimmed },
  });
}

export type LessonProgressContext = {
  completedLessons: number;
  totalLessons: number;
  currentLessonNumber: number;
  remainingMinutes: number;
  remainingLabel: string;
  nextLesson: { id: string; title: string } | null;
  isFavorite: boolean;
  note: string | null;
  favoriteLessonIds: string[];
};

export async function buildLessonProgressContext(
  userId: string,
  lessonId: string,
  course: {
    estimatedHours: number | null;
  },
  allLessons: { id: string; title: string; duration: number | null }[],
  completedLessonIds: Set<string>,
  enrollmentProgress: number,
): Promise<LessonProgressContext> {
  const lessonIds = allLessons.map((l) => l.id);
  const [favoriteIds, note] = await Promise.all([
    getLessonFavoriteIds(userId, lessonIds),
    getLessonNote(userId, lessonId),
  ]);

  const completedLessons = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const remainingMinutes = estimateRemainingStudyMinutes(
    allLessons,
    completedLessonIds,
    course.estimatedHours,
    enrollmentProgress,
  );

  const next = getNextIncompleteLesson(allLessons, completedLessonIds, lessonId);

  return {
    completedLessons,
    totalLessons: allLessons.length,
    currentLessonNumber: currentIndex >= 0 ? currentIndex + 1 : completedLessons + 1,
    remainingMinutes,
    remainingLabel: formatStudyDuration(remainingMinutes),
    nextLesson: next ? { id: next.id, title: next.title } : null,
    isFavorite: favoriteIds.has(lessonId),
    note,
    favoriteLessonIds: [...favoriteIds],
  };
}

import { prisma } from "@/lib/prisma";
import {
  REINFORCEMENT_QUESTION_LIMIT,
  type ExamStudyMode,
} from "@/lib/exam-learning";

export type SubjectStat = {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
};

export type AttemptComparison = {
  current: {
    id: string;
    score: number;
    correctAnswers: number;
    finishedAt: Date | null;
    studyMode: string;
  };
  previous: {
    id: string;
    score: number;
    correctAnswers: number;
    finishedAt: Date | null;
    studyMode: string;
  } | null;
  scoreDelta: number | null;
  correctDelta: number | null;
  improved: boolean | null;
};

type QuestionRef = {
  id: string;
  type: string;
  subject: string | null;
  difficulty: number;
};

export async function getExamQuestionFavoriteIds(
  userId: string,
  questionIds: string[],
): Promise<Set<string>> {
  if (questionIds.length === 0) return new Set();

  const favorites = await prisma.examQuestionFavorite.findMany({
    where: { userId, questionId: { in: questionIds } },
    select: { questionId: true },
  });

  return new Set(favorites.map((f) => f.questionId));
}

export async function toggleExamQuestionFavorite(
  userId: string,
  questionId: string,
): Promise<boolean> {
  const existing = await prisma.examQuestionFavorite.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  if (existing) {
    await prisma.examQuestionFavorite.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.examQuestionFavorite.create({ data: { userId, questionId } });
  return true;
}

export async function getUserSubjectStats(userId: string, examId: string): Promise<SubjectStat[]> {
  const answers = await prisma.examAnswer.findMany({
    where: {
      attempt: { userId, examId, finishedAt: { not: null } },
      question: { type: { not: "ESSAY" } },
    },
    select: {
      isCorrect: true,
      question: { select: { subject: true } },
    },
  });

  const bySubject = new Map<string, { total: number; correct: number }>();

  for (const answer of answers) {
    const subject = answer.question.subject?.trim() || "Geral";
    const entry = bySubject.get(subject) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (answer.isCorrect) entry.correct += 1;
    bySubject.set(subject, entry);
  }

  return [...bySubject.entries()]
    .map(([subject, stats]) => ({
      subject,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export async function getUserGlobalSubjectStats(userId: string): Promise<SubjectStat[]> {
  const answers = await prisma.examAnswer.findMany({
    where: {
      attempt: { userId, finishedAt: { not: null } },
      question: { type: { not: "ESSAY" } },
    },
    select: {
      isCorrect: true,
      question: { select: { subject: true } },
    },
  });

  const bySubject = new Map<string, { total: number; correct: number }>();

  for (const answer of answers) {
    const subject = answer.question.subject?.trim() || "Geral";
    const entry = bySubject.get(subject) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (answer.isCorrect) entry.correct += 1;
    bySubject.set(subject, entry);
  }

  return [...bySubject.entries()]
    .map(([subject, stats]) => ({
      subject,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export async function getRecommendedDifficulty(userId: string, examId: string): Promise<1 | 2 | 3> {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId, examId, finishedAt: { not: null } },
    select: { score: true },
    orderBy: { finishedAt: "desc" },
    take: 3,
  });

  if (attempts.length === 0) return 2;

  const avg = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length;
  if (avg >= 80) return 3;
  if (avg >= 55) return 2;
  return 1;
}

async function getWrongQuestionIds(userId: string, examId: string): Promise<Set<string>> {
  const wrong = await prisma.examAnswer.findMany({
    where: {
      isCorrect: false,
      attempt: { userId, examId, finishedAt: { not: null } },
      question: { type: { not: "ESSAY" } },
    },
    select: { questionId: true },
    distinct: ["questionId"],
  });

  return new Set(wrong.map((a) => a.questionId));
}

export async function getReinforcementQuestionIds(
  userId: string,
  examId: string,
  allQuestions: QuestionRef[],
  limit = REINFORCEMENT_QUESTION_LIMIT,
): Promise<string[]> {
  const mcQuestions = allQuestions.filter((q) => q.type !== "ESSAY");
  if (mcQuestions.length === 0) return [];

  const wrongIds = await getWrongQuestionIds(userId, examId);
  const subjectStats = await getUserSubjectStats(userId, examId);
  const weakSubjects = new Set(
    subjectStats.filter((s) => s.accuracy < 70).map((s) => s.subject),
  );

  const recommendedDifficulty = await getRecommendedDifficulty(userId, examId);
  const picked = new Set<string>();

  for (const question of mcQuestions) {
    if (wrongIds.has(question.id)) picked.add(question.id);
  }

  if (picked.size < limit) {
    for (const question of mcQuestions) {
      const subject = question.subject?.trim() || "Geral";
      if (weakSubjects.has(subject)) picked.add(question.id);
      if (picked.size >= limit) break;
    }
  }

  if (picked.size < limit) {
    for (const question of mcQuestions) {
      if (question.difficulty >= recommendedDifficulty) picked.add(question.id);
      if (picked.size >= limit) break;
    }
  }

  if (picked.size === 0) {
    return mcQuestions.slice(0, Math.min(limit, mcQuestions.length)).map((q) => q.id);
  }

  return [...picked].slice(0, limit);
}

export async function getFavoriteQuestionIdsForExam(
  userId: string,
  examId: string,
): Promise<string[]> {
  const favorites = await prisma.examQuestionFavorite.findMany({
    where: { userId, question: { examId } },
    select: { questionId: true },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((f) => f.questionId);
}

export async function countQuestionsForMode(
  userId: string,
  examId: string,
  mode: ExamStudyMode,
  allQuestions: QuestionRef[],
): Promise<number> {
  if (mode === "FULL") return allQuestions.length;

  if (mode === "FAVORITES") {
    const ids = await getFavoriteQuestionIdsForExam(userId, examId);
    return ids.length;
  }

  const ids = await getReinforcementQuestionIds(userId, examId, allQuestions);
  return ids.length;
}

export async function resolveAttemptQuestionIds(
  userId: string,
  examId: string,
  studyMode: string,
  allQuestions: QuestionRef[],
): Promise<string[]> {
  if (studyMode === "FAVORITES") {
    return getFavoriteQuestionIdsForExam(userId, examId);
  }

  if (studyMode === "REINFORCEMENT") {
    return getReinforcementQuestionIds(userId, examId, allQuestions);
  }

  return allQuestions.map((q) => q.id);
}

export function filterQuestionsByIds<T extends { id: string }>(questions: T[], ids: string[]): T[] {
  const idSet = new Set(ids);
  return questions.filter((q) => idSet.has(q.id));
}

export async function compareWithPreviousAttempt(
  userId: string,
  examId: string,
  attemptId: string,
): Promise<AttemptComparison | null> {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId, examId, finishedAt: { not: null } },
    select: {
      id: true,
      score: true,
      correctAnswers: true,
      finishedAt: true,
      studyMode: true,
    },
    orderBy: { finishedAt: "desc" },
    take: 10,
  });

  const currentIndex = attempts.findIndex((a) => a.id === attemptId);
  if (currentIndex === -1) return null;

  const current = attempts[currentIndex];
  const previous = attempts[currentIndex + 1] ?? null;

  return {
    current,
    previous,
    scoreDelta: previous ? Math.round(current.score - previous.score) : null,
    correctDelta: previous ? current.correctAnswers - previous.correctAnswers : null,
    improved: previous ? current.score > previous.score : null,
  };
}

export async function getFavoriteQuestionCount(userId: string, examId: string): Promise<number> {
  return prisma.examQuestionFavorite.count({
    where: { userId, question: { examId } },
  });
}

export async function canStartReinforcement(
  userId: string,
  examId: string,
  allQuestions: QuestionRef[],
): Promise<boolean> {
  const count = await countQuestionsForMode(userId, examId, "REINFORCEMENT", allQuestions);
  return count > 0;
}

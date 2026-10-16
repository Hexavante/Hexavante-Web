export type ExamStudyMode = "FULL" | "REINFORCEMENT" | "FAVORITES";

export const EXAM_STUDY_MODE_LABELS: Record<ExamStudyMode, string> = {
  FULL: "Simulado completo",
  REINFORCEMENT: "Modo reforço",
  FAVORITES: "Questões favoritas",
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Fácil",
  2: "Média",
  3: "Difícil",
};

export const REINFORCEMENT_QUESTION_LIMIT = 20;

export function formatSubjectLabel(subject: string | null | undefined): string {
  if (!subject) return "Geral";
  return subject;
}

export function getDifficultyLabel(difficulty: number): string {
  return DIFFICULTY_LABELS[difficulty] ?? DIFFICULTY_LABELS[2];
}

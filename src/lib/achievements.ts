export type AchievementIcon =
  | "book"
  | "trophy"
  | "star"
  | "target"
  | "coins"
  | "users"
  | "zap"
  | "award"
  | "flame";

export type AchievementTier = "bronze" | "silver" | "gold";

export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  tier: AchievementTier;
  check: (stats: AchievementStats) => boolean;
};

export type AchievementStats = {
  lessonsCompleted: number;
  coursesCompleted: number;
  level: number;
  examsFinished: number;
  examsPassed: number;
  completedLongExam: boolean;
  coins: number;
  shopPurchases: number;
  followingCount: number;
  totalXp: number;
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: "first_lesson",
    title: "Primeira aula",
    description: "Concluiu sua primeira aula.",
    icon: "book",
    tier: "bronze",
    check: (s) => s.lessonsCompleted >= 1,
  },
  {
    key: "lessons_10",
    title: "Estudante dedicado",
    description: "Concluiu 10 aulas.",
    icon: "book",
    tier: "silver",
    check: (s) => s.lessonsCompleted >= 10,
  },
  {
    key: "first_course",
    title: "Graduado",
    description: "Concluiu seu primeiro curso.",
    icon: "award",
    tier: "gold",
    check: (s) => s.coursesCompleted >= 1,
  },
  {
    key: "courses_3",
    title: "Trilheiro",
    description: "Concluiu 3 cursos.",
    icon: "trophy",
    tier: "gold",
    check: (s) => s.coursesCompleted >= 3,
  },
  {
    key: "level_5",
    title: "Nível 5",
    description: "Alcançou o nível 5.",
    icon: "star",
    tier: "bronze",
    check: (s) => s.level >= 5,
  },
  {
    key: "level_10",
    title: "Nível 10",
    description: "Alcançou o nível 10.",
    icon: "star",
    tier: "silver",
    check: (s) => s.level >= 10,
  },
  {
    key: "level_20",
    title: "Nível 20",
    description: "Alcançou o nível 20.",
    icon: "flame",
    tier: "gold",
    check: (s) => s.level >= 20,
  },
  {
    key: "first_exam",
    title: "Testado",
    description: "Finalizou um simulado.",
    icon: "target",
    tier: "bronze",
    check: (s) => s.examsFinished >= 1,
  },
  {
    key: "exam_pass",
    title: "Aprovado",
    description: "Passou em um simulado com 70% ou mais.",
    icon: "target",
    tier: "silver",
    check: (s) => s.examsPassed >= 1,
  },
  {
    key: "exams_5",
    title: "Veterano de provas",
    description: "Finalizou 5 simulados.",
    icon: "target",
    tier: "gold",
    check: (s) => s.examsFinished >= 5,
  },
  {
    key: "maratona_100",
    title: "Maratona Hexavante",
    description: "Concluiu um simulado com 100 questões ou mais.",
    icon: "trophy",
    tier: "gold",
    check: (s) => s.completedLongExam,
  },
  {
    key: "coins_500",
    title: "Poupança",
    description: "Acumulou 500 moedas.",
    icon: "coins",
    tier: "bronze",
    check: (s) => s.coins >= 500,
  },
  {
    key: "shopper",
    title: "Colecionador",
    description: "Comprou um item na loja.",
    icon: "coins",
    tier: "silver",
    check: (s) => s.shopPurchases >= 1,
  },
  {
    key: "social",
    title: "Conectado",
    description: "Seguiu pelo menos 3 estudantes.",
    icon: "users",
    tier: "bronze",
    check: (s) => s.followingCount >= 3,
  },
  {
    key: "xp_1000",
    title: "Mil XP",
    description: "Conquistou 1.000 XP no total.",
    icon: "zap",
    tier: "silver",
    check: (s) => s.totalXp >= 1000,
  },
];

export const ACHIEVEMENT_BY_KEY = Object.fromEntries(
  ACHIEVEMENT_DEFINITIONS.map((def) => [def.key, def]),
) as Record<string, AchievementDefinition>;

export const TIER_STYLES: Record<AchievementTier, string> = {
  bronze: "border-amber-600/30 bg-amber-500/10 text-amber-200",
  silver: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  gold: "border-yellow-400/35 bg-yellow-400/10 text-yellow-100",
};

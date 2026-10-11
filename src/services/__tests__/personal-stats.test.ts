import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import {
  buildExamScoreDistribution,
  getPersonalStats,
  getPersonalStatsCharts,
} from "../personal-stats.service";

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/services/xp.service", () => ({
  getUserXpProfile: vi.fn(),
  getUserRank: vi.fn(),
}));

vi.mock("@/services/achievement.service", () => ({
  getUnlockedAchievementCount: vi.fn(),
}));

import { getUserRank, getUserXpProfile } from "@/services/xp.service";
import { getUnlockedAchievementCount } from "@/services/achievement.service";

const mockedXpProfile = vi.mocked(getUserXpProfile);
const mockedRank = vi.mocked(getUserRank);
const mockedAchievements = vi.mocked(getUnlockedAchievementCount);

function mockEmptyUser() {
  mockedXpProfile.mockResolvedValue(null);
  mockedRank.mockResolvedValue(null);
  mockedAchievements.mockResolvedValue(0);

  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.courseEnrollment.findMany.mockResolvedValue([]);
  prismaMock.courseEnrollment.count.mockResolvedValue(0);
  prismaMock.lessonProgress.findMany.mockResolvedValue([]);
  prismaMock.lessonProgress.count.mockResolvedValue(0);
  prismaMock.examAttempt.findMany.mockResolvedValue([]);
  prismaMock.examAttempt.count.mockResolvedValue(0);
  prismaMock.certificate.count.mockResolvedValue(0);
  prismaMock.xpTransaction.findMany.mockResolvedValue([]);
  prismaMock.xpTransaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
}

function collectNumbers(value: unknown, out: number[] = []): number[] {
  if (typeof value === "number") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectNumbers(item, out);
  } else if (value !== null && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) collectNumbers(v, out);
  }
  return out;
}

function expectAllFinite(value: unknown) {
  for (const n of collectNumbers(value)) {
    expect(Number.isFinite(n)).toBe(true);
  }
}

describe("personal-stats.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildExamScoreDistribution (pura)", () => {
    it("retorna 4 faixas zeradas quando não há notas", () => {
      const dist = buildExamScoreDistribution([]);

      expect(dist).toHaveLength(4);
      expect(dist.map((b) => b.value)).toEqual([0, 0, 0, 0]);
      expect(dist.map((b) => b.category)).toEqual(["90-100%", "70-89%", "50-69%", "<50%"]);
    });

    it("agrupa notas variadas nas faixas corretas", () => {
      const dist = buildExamScoreDistribution([95, 82, 65, 40, 78, 91]);

      expect(dist.map((b) => b.value)).toEqual([2, 2, 1, 1]);
    });

    it("respeita os limites das faixas (90/70/50)", () => {
      const dist = buildExamScoreDistribution([90, 89.9, 70, 69.9, 50, 49.9]);

      // 90 → Excelente; 89.9 e 70 → Bom; 69.9 e 50 → Regular; 49.9 → <50%
      expect(dist.map((b) => b.value)).toEqual([1, 2, 2, 1]);
    });

    it("trata nulos de linhas antigas como 0 e descarta NaN/Infinity", () => {
      const dist = buildExamScoreDistribution([
        95,
        null,
        undefined,
        NaN,
        Infinity,
        -Infinity,
        70,
        50,
        49.9,
        90,
        69.9,
        89.9,
      ]);

      // válidos: 95, 0(null), 0(undefined), 70, 50, 49.9, 90, 69.9, 89.9
      expect(dist.map((b) => b.value)).toEqual([2, 2, 2, 3]);
      for (const b of dist) expect(Number.isFinite(b.value)).toBe(true);
    });
  });

  describe("usuário sem dados (novo)", () => {
    it("getPersonalStats retorna zeros/empty sem throw", async () => {
      mockEmptyUser();

      const stats = await getPersonalStats("user-new");

      expect(stats.examsTaken).toBe(0);
      expect(stats.examsPassed).toBe(0);
      expect(stats.averageExamScore).toBeNull();
      expect(stats.level).toBe(1);
      expect(stats.totalXp).toBe(0);
      expect(stats.rank).toBeNull();
      expect(stats.coursesEnrolled).toBe(0);
      expect(stats.lessonsCompleted).toBe(0);
      expect(stats.studyStreakDays).toBe(0);
      expectAllFinite(stats);
    });

    it("getPersonalStatsCharts retorna estruturas vazias sem throw e sem NaN", async () => {
      mockEmptyUser();

      const charts = await getPersonalStatsCharts("user-new");

      // xpTimeline preenche ~90 dias mesmo sem XP (90 ou 91 no limite da meia-noite)
      expect(charts.xpTimeline.length).toBeGreaterThanOrEqual(90);
      expect(charts.weeklyProgress).toHaveLength(12);
      expect(charts.categoryDistribution).toEqual([]);
      expect(charts.skillRadar).toEqual([]);
      expect(charts.activityHeatmap).toEqual({});
      expect(charts.studyTimeEstimate).toBe(0);
      // distribuição de notas existe mas zerada → view mostra estado vazio
      expect(charts.examScoreDistribution).toHaveLength(4);
      expect(charts.examScoreDistribution.reduce((s, b) => s + b.value, 0)).toBe(0);
      expectAllFinite(charts);
    });
  });

  describe("usuário com dados reais", () => {
    const SCORES = [95, 82, 65, 40, 78, 91];

    function mockActiveUser() {
      mockedXpProfile.mockResolvedValue({
        level: 5,
        currentXp: 50,
        totalXp: 450,
        xpToNextLevel: 500,
        progressPercent: 10,
      });
      mockedRank.mockResolvedValue(3);
      mockedAchievements.mockResolvedValue(7);

      // user.findUnique atende dois selects distintos — distingue pelos args
      prismaMock.user.findUnique.mockImplementation((args: unknown) => {
        const select = (args as { select?: Record<string, unknown> })?.select ?? {};
        if ("coins" in select) {
          return Promise.resolve({ coins: 120, lastStudyAt: new Date("2026-10-09T10:00:00Z") });
        }
        return Promise.resolve({
          xp: { level: 5, totalXp: 450 },
          enrollments: [{ progress: 100 }],
          lessonProgresses: [{ lessonId: "l1" }, { lessonId: "l2" }],
          examAttempts: SCORES.map((score) => ({ score })),
          certificates: [{ id: "c1" }],
        });
      });

      prismaMock.courseEnrollment.count.mockImplementation((args: unknown) => {
        const where = (args as { where?: Record<string, unknown> })?.where ?? {};
        return Promise.resolve("progress" in where ? 1 : 2);
      });
      prismaMock.courseEnrollment.findMany.mockResolvedValue([
        {
          course: {
            category: { name: "Programação" },
            modules: [{ lessons: [{ id: "l1" }, { id: "l2" }] }],
          },
          lessonProgresses: [{ lessonId: "l1" }],
        },
        // categoria nula → fallback "Outros"
        {
          course: {
            category: null,
            modules: [{ lessons: [{ id: "l3" }] }],
          },
          lessonProgresses: [],
        },
        // curso ausente (dado legado) → não pode quebrar, cai em "Outros"
        { course: null, lessonProgresses: [] },
      ]);

      prismaMock.lessonProgress.findMany.mockResolvedValue([
        { completedAt: new Date("2026-10-09T10:00:00Z") },
        { completedAt: null },
      ]);
      prismaMock.lessonProgress.count.mockResolvedValue(2);

      // examAttempt.findMany atende selects de score e de finishedAt
      prismaMock.examAttempt.findMany.mockImplementation((args: unknown) => {
        const select = (args as { select?: Record<string, unknown> })?.select ?? {};
        if ("score" in select) {
          return Promise.resolve(SCORES.map((score) => ({ score })));
        }
        return Promise.resolve([
          { finishedAt: new Date("2026-10-08T10:00:00Z") },
          { finishedAt: null },
        ]);
      });
      prismaMock.examAttempt.count.mockImplementation((args: unknown) => {
        const where = (args as { where?: Record<string, unknown> })?.where ?? {};
        return Promise.resolve("score" in where ? 4 : SCORES.length);
      });

      prismaMock.certificate.count.mockResolvedValue(1);
      prismaMock.xpTransaction.aggregate.mockResolvedValue({ _sum: { amount: 150 } });
      prismaMock.xpTransaction.findMany.mockResolvedValue([
        { amount: 50, createdAt: new Date("2026-10-09T10:00:00Z") },
        { amount: 100, createdAt: new Date("2026-10-08T10:00:00Z") },
      ]);
    }

    it("getPersonalStats calcula média e contadores sem NaN", async () => {
      mockActiveUser();

      const stats = await getPersonalStats("user-active");

      expect(stats.examsTaken).toBe(6);
      expect(stats.examsPassed).toBe(4);
      expect(stats.averageExamScore).toBeCloseTo(451 / 6, 5);
      expect(stats.level).toBe(5);
      expect(stats.rank).toBe(3);
      expect(stats.coins).toBe(120);
      expect(stats.coursesEnrolled).toBe(2);
      expect(stats.coursesCompleted).toBe(1);
      expect(stats.xpThisWeek).toBe(150);
      expect(stats.achievementsUnlocked).toBe(7);
      expectAllFinite(stats);
    });

    it("getPersonalStatsCharts calcula distribuição real das notas sem NaN", async () => {
      mockActiveUser();

      const charts = await getPersonalStatsCharts("user-active");

      // [95, 91] → Excelente; [82, 78] → Bom; [65] → Regular; [40] → <50%
      expect(charts.examScoreDistribution.map((b) => b.value)).toEqual([2, 2, 1, 1]);
      const total = charts.examScoreDistribution.reduce((s, b) => s + b.value, 0);
      expect(total).toBe(SCORES.length);
      // distribuição por categoria tolera relações ausentes (course/category null)
      const categories = charts.categoryDistribution.map((c) => c.category);
      expect(categories).toContain("Programação");
      expect(categories).toContain("Outros");
      expect(charts.studyTimeEstimate).toBe(2 * 15 + 6 * 30);
      expectAllFinite(charts);
    });
  });
});

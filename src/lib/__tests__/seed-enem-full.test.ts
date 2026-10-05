import { describe, expect, it } from "vitest";

import {
  buildFullEnemExam,
  DEPRECATED_PARTIAL_ENEM_SLUGS,
  FULL_ENEM_EXAMS,
  SUBJECT_MARATHON_EXAMS,
  type SeedEssayQuestion,
  type SeedMcQuestion,
} from "../../../prisma/seed-enem-full";

const AREAS = new Set([
  "Linguagens, Códigos e suas Tecnologias",
  "Ciências Humanas e suas Tecnologias",
  "Ciências da Natureza e suas Tecnologias",
  "Matemática e suas Tecnologias",
]);

function normalizeStatement(statement: string): string {
  return statement
    .toLowerCase()
    .replace(/\b(2024|2025|2026)\b/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeChoice(text: string): string {
  return text
    .replace(/^[A-Ea-e][).]\s*/, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function mcOf(examIndex: number): SeedMcQuestion[] {
  return FULL_ENEM_EXAMS[examIndex].questions.filter(
    (question): question is SeedMcQuestion => question.type === "MULTIPLE_CHOICE",
  );
}

describe("seed-enem-full — forma dos exames", () => {
  it("gera exatamente 3 exames completos (2024, 2025, 2026)", () => {
    expect(FULL_ENEM_EXAMS).toHaveLength(3);
    const slugs = FULL_ENEM_EXAMS.map((exam) => exam.slug).sort();
    expect(slugs).toEqual(["enem-2024-prova-completa", "enem-2025-prova-completa", "enem-2026-prova-completa"]);
  });

  it("cada exame tem 101 questões: 100 objetivas + redação por último", () => {
    for (const exam of FULL_ENEM_EXAMS) {
      expect(exam.questions).toHaveLength(101);

      const essays = exam.questions.filter((question) => question.type === "ESSAY");
      expect(essays).toHaveLength(1);
      expect(exam.questions[100].type).toBe("ESSAY");

      const essay = essays[0] as SeedEssayQuestion;
      expect(essay.statement.trim().length).toBeGreaterThan(0);

      const mc = exam.questions.filter((question) => question.type === "MULTIPLE_CHOICE");
      expect(mc).toHaveLength(100);
    }
  });

  it("mantém título, slug, tempo e premium inalterados por ano", () => {
    for (const year of [2024, 2025, 2026]) {
      const exam = buildFullEnemExam(year);
      expect(exam.title).toBe(`ENEM ${year} — Prova Completa (100 questões + Redação)`);
      expect(exam.slug).toBe(`enem-${year}-prova-completa`);
      expect(exam.timeLimit).toBe(330);
      expect(exam.examType).toBe("ENEM");
      expect(exam.isPremiumOnly).toBeUndefined();
    }
  });

  it("rejeita ano fora da faixa suportada", () => {
    expect(() => buildFullEnemExam(2023)).toThrow();
    expect(() => buildFullEnemExam(2027)).toThrow();
  });
});

describe("seed-enem-full — qualidade das questões", () => {
  it("objetivas têm enunciado ≥ 120 chars, 5 alternativas distintas e exatamente 1 gabarito", () => {
    let total = 0;
    for (const exam of FULL_ENEM_EXAMS) {
      const mc = exam.questions.filter(
        (question): question is SeedMcQuestion => question.type === "MULTIPLE_CHOICE",
      );
      for (const question of mc) {
        total++;
        expect(question.statement.trim().length).toBeGreaterThanOrEqual(120);

        expect(question.alternatives).toHaveLength(5);
        const normalized = question.alternatives.map((alt) => normalizeChoice(alt.text));
        expect(new Set(normalized).size).toBe(5);

        expect(question.alternatives.filter((alt) => alt.isCorrect)).toHaveLength(1);

        expect(AREAS.has(question.subject ?? "")).toBe(true);
        expect(question.explanation?.trim().length ?? 0).toBeGreaterThan(0);
        expect(question.difficulty).toBeGreaterThanOrEqual(1);
        expect(question.difficulty).toBeLessThanOrEqual(3);

        const correct = question.alternatives.find((alt) => alt.isCorrect);
        expect(normalizeChoice(correct?.text ?? "")).not.toMatch(/^resposta coerente com/);
      }
    }
    expect(total).toBe(300);
  });

  it("as 300 objetivas têm enunciados únicos mesmo ignorando o ano", () => {
    const keys = FULL_ENEM_EXAMS.flatMap((exam) => mcOf(FULL_ENEM_EXAMS.indexOf(exam))).map((question) =>
      normalizeStatement(question.statement),
    );
    expect(keys).toHaveLength(300);
    expect(new Set(keys).size).toBe(300);
  });

  it("distribui a correta entre A e E na faixa de 10% a 40%", () => {
    const counts = [0, 0, 0, 0, 0];
    for (const exam of FULL_ENEM_EXAMS) {
      const mc = exam.questions.filter(
        (question): question is SeedMcQuestion => question.type === "MULTIPLE_CHOICE",
      );
      for (const question of mc) {
        counts[question.alternatives.findIndex((alt) => alt.isCorrect)]++;
      }
    }
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(300);
    for (const count of counts) {
      expect(count).toBeGreaterThanOrEqual(30); // 10% de 300
      expect(count).toBeLessThanOrEqual(120); // 40% de 300
    }
  });

  it("nenhum distrator aparece em mais de 5% dos 1200 incorretos", () => {
    const wrongCounts = new Map<string, number>();
    for (const exam of FULL_ENEM_EXAMS) {
      const mc = exam.questions.filter(
        (question): question is SeedMcQuestion => question.type === "MULTIPLE_CHOICE",
      );
      for (const question of mc) {
        for (const alt of question.alternatives) {
          if (alt.isCorrect) continue;
          const key = normalizeChoice(alt.text);
          wrongCounts.set(key, (wrongCounts.get(key) ?? 0) + 1);
        }
      }
    }
    expect(wrongCounts.size).toBeGreaterThan(1100);
    for (const count of wrongCounts.values()) {
      expect(count).toBeLessThanOrEqual(60); // 5% de 1200
    }
  });
});

describe("seed-enem-full — contratos preservados", () => {
  it("SUBJECT_MARATHON_EXAMS mantém slugs, títulos e 100 questões", () => {
    expect(SUBJECT_MARATHON_EXAMS).toHaveLength(2);
    expect(SUBJECT_MARATHON_EXAMS.map((exam) => exam.slug)).toEqual([
      "maratona-matematica-100",
      "maratona-portugues-100",
    ]);
    expect(SUBJECT_MARATHON_EXAMS.map((exam) => exam.title)).toEqual([
      "Simulado de Matemática — 100 questões",
      "Simulado de Português — 100 questões",
    ]);
    for (const exam of SUBJECT_MARATHON_EXAMS) {
      expect(exam.questions).toHaveLength(100);
      expect(exam.timeLimit).toBe(180);
      expect(exam.examType).toBe("ENEM");
    }
  });

  it("DEPRECATED_PARTIAL_ENEM_SLUGS permanece como no contrato original", () => {
    expect(DEPRECATED_PARTIAL_ENEM_SLUGS).toEqual([
      "enem-2026-teste-linguagens-e-codigos",
      "enem-2026-teste-matematica-e-suas-tecnologias",
      "enem-2026-teste-ciencias-humanas",
      "enem-2026-teste-ciencias-da-natureza",
      "enem-2026-teste-redacao-e-competencias",
    ]);
  });
});

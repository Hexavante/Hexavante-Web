/**
 * `gradeEssayAnswer` com escopo de instrutor — a autoria é verificada no
 * servidor pelo `submission.authorId` do simulado; sem escopo (moderador)
 * a correção segue como antes.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, loggerMock } = vi.hoisted(() => ({
  prismaMock: {
    examAnswer: { findUnique: vi.fn(), update: vi.fn() },
    examAttempt: { update: vi.fn() },
  },
  loggerMock: { info: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => ({ logger: loggerMock }));

import { gradeEssayAnswer } from "../exam-grading.service";

function answerFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "answer-1",
    essayStatus: "PENDING",
    attempt: {
      id: "attempt-1",
      answers: [],
      exam: {
        id: "exam-1",
        title: "Estudando a Biologia",
        slug: "estudando-a-biologia",
        questions: [{ type: "MULTIPLE_CHOICE" }, { type: "ESSAY" }],
        submission: { authorId: "instrutor-1" },
      },
    },
    ...overrides,
  };
}

const grade = { answerId: "answer-1", status: "CORRECT" as const, comment: "Muito bem" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("gradeEssayAnswer", () => {
  it("moderador (sem escopo) corrige sem checar autoria", async () => {
    prismaMock.examAnswer.findUnique.mockResolvedValue(answerFixture());

    const result = await gradeEssayAnswer(grade, "moderador-9");

    expect(result).toEqual({ pendingEssays: 0, provisionalScore: 50 });
    expect(prismaMock.examAnswer.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.examAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "attempt-1" },
        data: { score: 50, correctAnswers: 1 },
      }),
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      "Dissertativa corrigida",
      expect.objectContaining({ graderId: "moderador-9", answerId: "answer-1" }),
    );
  });

  it("instrutor corrige a dissertativa do simulado que ele submeteu", async () => {
    prismaMock.examAnswer.findUnique.mockResolvedValue(answerFixture());

    const result = await gradeEssayAnswer(grade, "instrutor-1", {
      instructorId: "instrutor-1",
    });

    expect(result.pendingEssays).toBe(0);
    expect(prismaMock.examAnswer.update).toHaveBeenCalledTimes(1);
  });

  it("instrutor não corrige simulado de outro autor", async () => {
    prismaMock.examAnswer.findUnique.mockResolvedValue(
      answerFixture({
        attempt: {
          id: "attempt-1",
          answers: [],
          exam: {
            id: "exam-2",
            title: "Prova de Química",
            slug: "prova-de-quimica",
            questions: [{ type: "ESSAY" }],
            submission: { authorId: "instrutor-2" },
          },
        },
      }),
    );

    await expect(
      gradeEssayAnswer(grade, "instrutor-1", { instructorId: "instrutor-1" }),
    ).rejects.toThrow("Sem permissão para corrigir respostas deste simulado.");
    expect(prismaMock.examAnswer.update).not.toHaveBeenCalled();
    expect(prismaMock.examAttempt.update).not.toHaveBeenCalled();
  });

  it("instrutor não corrige simulado sem submissão de autor", async () => {
    prismaMock.examAnswer.findUnique.mockResolvedValue(
      answerFixture({
        attempt: {
          id: "attempt-1",
          answers: [],
          exam: {
            id: "exam-3",
            title: "Simulado oficial",
            slug: "simulado-oficial",
            questions: [{ type: "ESSAY" }],
            submission: null,
          },
        },
      }),
    );

    await expect(
      gradeEssayAnswer(grade, "instrutor-1", { instructorId: "instrutor-1" }),
    ).rejects.toThrow("Sem permissão");
    expect(prismaMock.examAnswer.update).not.toHaveBeenCalled();
  });
});

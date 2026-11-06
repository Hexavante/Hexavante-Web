import { beforeEach, expect, it, vi } from "vitest";
const { findFirst, create, update, transaction } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: transaction, exam: { findFirst } },
}));
import {
  saveInstructorExamEdit,
  examEditRevision,
  type getInstructorExamForEdit,
} from "../instructor-exam-edit.service";
type Exam = NonNullable<Awaited<ReturnType<typeof getInstructorExamForEdit>>>;
const exam: Exam = {
  id: "exam",
  title: "Prova de lógica",
  slug: "prova",
  examType: "TECNOLOGIA",
  description: null,
  timeLimit: 10,
  coverImage: "/uploads/exams/cover.webp",
  isPublished: false,
  isPremiumOnly: false,
  createdAt: new Date(),
  _count: { attempts: 0 },
  questions: [
    {
      id: "question",
      examId: "exam",
      statement: "Quanto é 2 + 2?",
      orderNumber: 1,
      type: "MULTIPLE_CHOICE",
      points: 2,
      expectedAnswer: null,
      subject: "Lógica",
      explanation: "Some os valores",
      difficulty: 2,
      imageUrl: "/uploads/questions/example.webp",
      imageWidth: 400,
      imageHeight: 200,
      imageDisplaySize: "MEDIUM",
      _count: { favorites: 0 },
      alternatives: [
        { id: "a", questionId: "question", text: "4", isCorrect: true },
        { id: "b", questionId: "question", text: "5", isCorrect: false },
      ],
    },
  ],
};
const input = {
  title: "Prova revisada",
  examType: "TECNOLOGIA" as const,
  description: "Descrição",
  timeLimit: 20,
  questions: [
    {
      id: "question",
      statement: "Quanto é 3 + 3?",
      alternatives: ["6", "7"],
      correct: 0,
    },
  ],
};
beforeEach(() => {
  vi.resetAllMocks();
  transaction.mockImplementation((fn) =>
    fn({ exam: { findFirst, create, update } }),
  );
  findFirst
    .mockResolvedValueOnce(structuredClone(exam))
    .mockResolvedValue(null);
  create.mockResolvedValue({ id: "revision" });
});
it("edita somente o simulado do autor e mantém dados auxiliares", async () => {
  expect(
    await saveInstructorExamEdit(
      "exam",
      "author",
      examEditRevision(exam),
      "request",
      input,
    ),
  ).toEqual({ id: "exam", newVersion: false });
  expect(findFirst.mock.calls[0][0].where).toEqual({
    id: "exam",
    submission: { authorId: "author" },
  });
  expect(update.mock.calls[0][0].data).toMatchObject({
    isPublished: false,
    title: "Prova revisada",
    questions: {
      create: [
        {
          points: 2,
          subject: "Lógica",
          imageUrl: "/uploads/questions/example.webp",
        },
      ],
    },
  });
});
it("recusa outro autor sem escrever", async () => {
  findFirst.mockReset().mockResolvedValue(null);
  await expect(
    saveInstructorExamEdit(
      "exam",
      "other",
      examEditRevision(exam),
      "request",
      input,
    ),
  ).rejects.toThrow("sem permissão");
  expect(create).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
it.each(["published", "attempts", "favorites"])(
  "preserva prova e histórico ao editar %s",
  async (reason) => {
    const protectedExam = structuredClone(exam);
    if (reason === "published") protectedExam.isPublished = true;
    if (reason === "attempts") protectedExam._count.attempts = 1;
    if (reason === "favorites") protectedExam.questions[0]._count.favorites = 1;
    findFirst
      .mockReset()
      .mockResolvedValueOnce(protectedExam)
      .mockResolvedValue(null);
    expect(
      await saveInstructorExamEdit(
        "exam",
        "author",
        examEditRevision(protectedExam),
        "request",
        input,
      ),
    ).toEqual({ id: "revision", newVersion: true });
    expect(update).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].data).toMatchObject({
      isPublished: false,
      coverImage: exam.coverImage,
      submission: { create: { authorId: "author" } },
    });
  },
);
it("bloqueia questões de outra prova e edição desatualizada", async () => {
  await expect(
    saveInstructorExamEdit("exam", "author", "old", "request", input),
  ).rejects.toThrow("Recarregue");
  findFirst.mockReset().mockResolvedValueOnce(exam).mockResolvedValue(null);
  await expect(
    saveInstructorExamEdit(
      "exam",
      "author",
      examEditRevision(exam),
      "request",
      { ...input, questions: [{ ...input.questions[0], id: "foreign" }] },
    ),
  ).rejects.toThrow("Questão inválida");
  expect(update).not.toHaveBeenCalled();
});
it("repetir o envio não duplica uma nova versão", async () => {
  findFirst
    .mockReset()
    .mockResolvedValueOnce(exam)
    .mockResolvedValueOnce({ id: "revision" });
  expect(
    await saveInstructorExamEdit(
      "exam",
      "author",
      examEditRevision(exam),
      "request",
      input,
    ),
  ).toEqual({ id: "revision", newVersion: true });
  expect(create).not.toHaveBeenCalled();
});

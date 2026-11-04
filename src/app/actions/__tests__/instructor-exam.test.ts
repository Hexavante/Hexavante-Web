import { expect, it, vi } from "vitest";
import { submitInstructorExam } from "../instructor-exam";
const { auth, create } = vi.hoisted(() => ({ auth: vi.fn(), create: vi.fn() }));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { exam: { create } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
it("bloqueia alunos e registra a submissão do instrutor sem publicar", async () => {
  const request = "c7704d2e-4e60-4c36-bade-f911109aad2c";
  const exam = {
    title: "Matemática",
    examType: "ENEM" as const,
    questions: [
      {
        statement: "Quanto é 2 + 2?",
        alternatives: ["2", "3", "4", "5"],
        correct: 2,
      },
    ],
    isPublished: true,
    authorId: "outra-pessoa",
  };
  auth.mockResolvedValueOnce({ user: { id: "aluno", roles: ["USER"] } });
  expect(await submitInstructorExam(request, exam)).toHaveProperty("error");
  expect(create).not.toHaveBeenCalled();
  auth.mockResolvedValueOnce({ user: { id: "autor", roles: ["INSTRUCTOR"] } });
  expect(await submitInstructorExam(request, exam)).toEqual({ success: true });
  expect(create.mock.calls[0][0].data).toMatchObject({
    isPublished: false,
    submission: { create: { authorId: "autor" } },
    questions: {
      create: [
        {
          orderNumber: 1,
          alternatives: {
            create: exam.questions[0].alternatives.map((text, i) => ({
              text,
              isCorrect: i === 2,
            })),
          },
        },
      ],
    },
  });
});

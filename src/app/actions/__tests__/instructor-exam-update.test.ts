import { beforeEach, expect, it, vi } from "vitest";
const { auth, save } = vi.hoisted(() => ({ auth: vi.fn(), save: vi.fn() }));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/instructor-exam-edit.service", () => ({
  saveInstructorExamEdit: save,
}));
import { updateInstructorExam } from "../instructor-exam";
const input = {
  title: "Prova revisada",
  examType: "ENEM",
  description: "",
  timeLimit: null,
  questions: [
    { statement: "Quanto é 2 + 2?", alternatives: ["4", "5"], correct: 0 },
  ],
  authorId: "other",
  isPublished: true,
};
const request = "c7704d2e-4e60-4c36-bade-f911109aad2c";
beforeEach(() => vi.resetAllMocks());
it.each(["TEACHER", "INSTRUCTOR"])(
  "permite %s sem confiar em autor ou publicação do cliente",
  async (role) => {
    auth.mockResolvedValue({ user: { id: "author", roles: [role] } });
    save.mockResolvedValue({ id: "exam", newVersion: false });
    expect(
      await updateInstructorExam("exam", "revision", request, input),
    ).toHaveProperty("success", true);
    expect(save.mock.calls[0][1]).toBe("author");
    expect(save.mock.calls[0][4]).not.toHaveProperty("isPublished");
    expect(save.mock.calls[0][4]).not.toHaveProperty("authorId");
  },
);
it("nega acesso de aluno e de visitante", async () => {
  auth
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ user: { id: "student", roles: ["USER"] } });
  for (let i = 0; i < 2; i++)
    expect(
      await updateInstructorExam("exam", "revision", request, input),
    ).toHaveProperty("error");
  expect(save).not.toHaveBeenCalled();
});

import { expect, it, vi } from "vitest";
import { compareWithPreviousAttempt, filterQuestionsByIds, setExamQuestionFavorite } from "../exam-learning.service";

const favorites = vi.hoisted(() => ({ createMany: vi.fn(), deleteMany: vi.fn() }));
const attempts = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { examQuestionFavorite: favorites, examAttempt: attempts } }));

it("compara com o treino anterior do mesmo aluno, simulado e modo", async () => {
  const current = { id: "b", score: 100, correctAnswers: 1, finishedAt: new Date(), studyMode: "FAVORITES" };
  attempts.findFirst.mockResolvedValue(null);
  expect((await compareWithPreviousAttempt("aluno", "enem", current))?.previous).toBeNull();
  expect(attempts.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ userId: "aluno", examId: "enem", studyMode: "FAVORITES" }),
  }));
});

it("mantém a prioridade do reforço mesmo que a prova tenha outra ordem", () => {
  const questions = [{ id: "q1" }, { id: "q5" }];
  expect(filterQuestionsByIds(questions, ["q5", "ausente", "q1", "q5"])).toEqual([questions[1], questions[0]]);
});

it("repetir o pedido de salvar nunca dispara uma remoção", async () => {
  await setExamQuestionFavorite("aluno", "q5", true);
  await setExamQuestionFavorite("aluno", "q5", true);
  expect(favorites.createMany).toHaveBeenCalledWith({data:[{userId:"aluno",questionId:"q5"}],skipDuplicates:true});
  expect(favorites.deleteMany).not.toHaveBeenCalled();
  await setExamQuestionFavorite("aluno", "q5", false);
  expect(favorites.deleteMany).toHaveBeenCalledWith({where:{userId:"aluno",questionId:"q5"}});
});

import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const { save, push, refresh } = vi.hoisted(() => ({
  save: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/app/actions/instructor-exam", () => ({
  updateInstructorExam: save,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
import { InstructorExamEditForm } from "@/app/(main)/instructor/simulados/[id]/edit/form";
const initial = {
  title: "Simulado original",
  examType: "ENEM" as const,
  description: "Descrição original",
  timeLimit: 10,
  questions: [
    {
      id: "q1",
      statement: "Quanto é 2 + 2?",
      alternatives: ["3", "4", "5", "6"],
      correct: 1,
      essay: false,
    },
  ],
};
beforeEach(() => vi.resetAllMocks());
it("preenche a prova e envia alterações sem perder a identidade da questão", async () => {
  save.mockResolvedValue({ success: true, newVersion: true });
  render(
    <InstructorExamEditForm
      id="exam"
      revision="revision"
      requestId="request"
      initial={initial}
    />,
  );
  expect(screen.getByLabelText("Resposta correta")).toHaveValue("1");
  fireEvent.change(screen.getByLabelText("Título"), {
    target: { value: "Simulado revisado" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Salvar e enviar para moderação" }),
  );
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith(
      "/instructor/simulados?enviado=1&novaVersao=1",
    ),
  );
  expect(save).toHaveBeenCalledWith(
    "exam",
    "revision",
    "request",
    expect.objectContaining({
      title: "Simulado revisado",
      questions: [initial.questions[0]],
    }),
  );
});
it("preserva os textos quando o servidor recusa o salvamento", async () => {
  save.mockResolvedValue({ error: "Recarregue antes de editar novamente." });
  render(
    <InstructorExamEditForm
      id="exam"
      revision="revision"
      requestId="request"
      initial={initial}
    />,
  );
  fireEvent.change(screen.getByLabelText("Enunciado"), {
    target: { value: "Meu enunciado revisado" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Salvar e enviar para moderação" }),
  );
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Enunciado")).toHaveValue(
    "Meu enunciado revisado",
  );
  expect(push).not.toHaveBeenCalled();
});

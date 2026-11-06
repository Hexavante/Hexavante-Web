/**
 * `gradeEssayAsInstructorAction` — instrutor corrige dissertativas apenas dos
 * simulados que ele próprio submeteu; a checagem de autoria fica no serviço
 * (escopo `instructorId`) e o erro vira `{ success:false }` sem estourar.
 *
 * Regressões cobridas:
 *  - sem sessão ou sem papel INSTRUCTOR → recusa e não toca no serviço;
 *  - caminho feliz envia o escopo do instrutor e revalida a fila dele;
 *  - erro de permissão devolvido pelo serviço chega intacto ao cliente.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, revalidatePathMock, gradeEssayAnswerMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  gradeEssayAnswerMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/services/exam-grading.service", () => ({
  listPendingEssayAnswers: vi.fn(),
  gradeEssayAnswer: gradeEssayAnswerMock,
}));

import { gradeEssayAsInstructorAction } from "../exam-grading";

function makeFormData(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("answerId", "answer-1");
  data.set("status", "CORRECT");
  data.set("comment", "Muito bem");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: "instrutor-1", roles: ["INSTRUCTOR"] } });
  gradeEssayAnswerMock.mockResolvedValue({ pendingEssays: 0, provisionalScore: 90 });
});

describe("gradeEssayAsInstructorAction", () => {
  it("recusa sem sessão e não chama o serviço", async () => {
    authMock.mockResolvedValue(null);

    const result = await gradeEssayAsInstructorAction({ success: false }, makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/login/i);
    expect(gradeEssayAnswerMock).not.toHaveBeenCalled();
  });

  it("recusa quem não tem o papel INSTRUCTOR", async () => {
    authMock.mockResolvedValue({ user: { id: "aluno-1", roles: ["USER"] } });

    const result = await gradeEssayAsInstructorAction({ success: false }, makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toContain("INSTRUCTOR");
    expect(gradeEssayAnswerMock).not.toHaveBeenCalled();
  });

  it("corrige com o escopo do instrutor e revalida a fila dele", async () => {
    const result = await gradeEssayAsInstructorAction({ success: false }, makeFormData());

    expect(result).toEqual({ success: true });
    expect(gradeEssayAnswerMock).toHaveBeenCalledTimes(1);
    const [data, graderId, scope] = gradeEssayAnswerMock.mock.calls[0];
    expect(data).toMatchObject({ answerId: "answer-1", status: "CORRECT", comment: "Muito bem" });
    expect(graderId).toBe("instrutor-1");
    expect(scope).toEqual({ instructorId: "instrutor-1" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/instructor/simulados/correcoes");
    expect(revalidatePathMock).toHaveBeenCalledWith("/instructor/simulados");
  });

  it("devolve o erro de permissão do serviço sem revalidar", async () => {
    gradeEssayAnswerMock.mockRejectedValue(
      new Error("Sem permissão para corrigir respostas deste simulado."),
    );

    const result = await gradeEssayAsInstructorAction({ success: false }, makeFormData());

    expect(result).toEqual({
      success: false,
      error: "Sem permissão para corrigir respostas deste simulado.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("recusa status inválido sem chamar o serviço", async () => {
    const result = await gradeEssayAsInstructorAction(
      { success: false },
      makeFormData({ status: "QUALQUER" }),
    );

    expect(result.success).toBe(false);
    expect(gradeEssayAnswerMock).not.toHaveBeenCalled();
  });
});

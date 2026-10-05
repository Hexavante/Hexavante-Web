/**
 * `completeLessonAction` — propaga a flag `courseCompleted` (o servidor é quem
 * calcula; o cliente só mostra o selo de conclusão).
 *
 * Regressões cobridas:
 *  - curso chega a 100% nesta aula → `courseCompleted: true`;
 *  - aula normal (progresso parcial) → `courseCompleted: false`;
 *  - erro do serviço → `{ success:false }` sem estourar.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, revalidatePathMock, markLessonCompleteMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  markLessonCompleteMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/services/enrollment.service", () => ({
  enrollInCourse: vi.fn(),
  markLessonComplete: markLessonCompleteMock,
}));

import { completeLessonAction } from "../enrollment";

function makeServiceResult(overrides: Record<string, unknown> = {}) {
  return {
    progress: 100,
    xpAwards: [
      {
        amount: 10,
        description: "Curso concluído: Curso de Teste",
        source: "COURSE",
        sourceId: "course-1",
        leveledUp: false,
      },
    ],
    totalXpEarned: 10,
    courseCompleted: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: "user-1" } });
});

describe("completeLessonAction", () => {
  it("deve devolver courseCompleted: true quando o curso chega a 100%", async () => {
    markLessonCompleteMock.mockResolvedValue(makeServiceResult());

    const result = await completeLessonAction("curso-de-teste", "lesson-1", "course-1");

    expect(result).toMatchObject({ success: true, courseCompleted: true, totalXpEarned: 10 });
    expect(result.xpMessages).toEqual([
      "+10 XP: Curso concluído: Curso de Teste",
    ]);
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it("deve devolver courseCompleted: false numa aula comum", async () => {
    markLessonCompleteMock.mockResolvedValue(
      makeServiceResult({ progress: 40, courseCompleted: false }),
    );

    const result = await completeLessonAction("curso-de-teste", "lesson-1", "course-1");

    expect(result.success).toBe(true);
    expect(result.courseCompleted).toBe(false);
  });

  it("deve devolver success:false sem lançar quando o serviço falha", async () => {
    markLessonCompleteMock.mockRejectedValue(new Error("Conclua a aula anterior"));

    const result = await completeLessonAction("curso-de-teste", "lesson-1", "course-1");

    expect(result).toEqual({ success: false, error: "Conclua a aula anterior" });
    expect(result.courseCompleted).toBeUndefined();
  });

  it("deve retornar erro sem chamar o serviço quando não há sessão", async () => {
    authMock.mockResolvedValue(null);

    const result = await completeLessonAction("curso-de-teste", "lesson-1", "course-1");

    expect(result.success).toBe(false);
    expect(markLessonCompleteMock).not.toHaveBeenCalled();
  });
});

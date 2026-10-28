import { beforeEach, describe, expect, it, vi } from "vitest";
const update = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update } } }));
import { recordStudyVisit } from "../study-continuation.service";

describe("registro da visita à aula", () => {
  beforeEach(() => { update.mockReset(); });

  it("salva a retomada sem consultar colunas opcionais do cadastro", async () => {
    // Simula o banco antigo: uma leitura completa inclui registration_intent
    // e falha, embora as colunas usadas para registrar a visita já existam.
    update.mockImplementation(async (args) => {
      if (!args.select || Object.keys(args.select).some((key) => key !== "id")) {
        throw Object.assign(new Error("Coluna registration_intent ausente"), { code: "P2022" });
      }
      return { id: "aluno-1" };
    });
    await expect(recordStudyVisit("aluno-1", "git-e-github", "aula-2")).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith({
      where: { id: "aluno-1" },
      select: { id: true },
      data: {
        lastStudyCourseSlug: "git-e-github",
        lastStudyLessonId: "aula-2",
        lastStudyAt: expect.any(Date),
      },
    });
  });

  it("não esconde falhas reais ao gravar o progresso de retomada", async () => {
    const failure = new Error("Banco indisponível");
    update.mockRejectedValue(failure);
    await expect(recordStudyVisit("aluno-1", "git-e-github", "aula-2")).rejects.toBe(failure);
  });
});

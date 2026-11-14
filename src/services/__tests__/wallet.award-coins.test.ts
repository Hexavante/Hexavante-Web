import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { awardCoins } from "../wallet.service";
import { internalApiPost } from "@/lib/internal-api";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/internal-api", () => ({ internalApiPost: vi.fn() }));

describe("awardCoins (delegado ao motor da API)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia o valor BASE e devolve o award da API", async () => {
    vi.mocked(internalApiPost).mockResolvedValue({
      award: { amount: 12, description: "Aula concluída", multiplier: 4, balance: 112 },
    });

    const award = await awardCoins("u1", 3, "LESSON", "lesson-1", "Aula concluída");

    expect(internalApiPost).toHaveBeenCalledWith("/internal/v1/gamification/coins", {
      userId: "u1",
      amount: 3,
      source: "LESSON",
      sourceId: "lesson-1",
      description: "Aula concluída",
    });
    expect(award).toMatchObject({ amount: 12, multiplier: 4 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("moedas já concedidas para a fonte → null", async () => {
    vi.mocked(internalApiPost).mockResolvedValue({ award: null });
    expect(await awardCoins("u1", 3, "LESSON", "lesson-1")).toBeNull();
  });

  it("falha da API propaga (mesmo contrato de antes: só duplicidade vira null)", async () => {
    vi.mocked(internalApiPost).mockRejectedValue(new Error("API 500"));
    await expect(awardCoins("u1", 3, "LESSON", "lesson-1")).rejects.toThrow("API 500");
  });

  it("valor <= 0 → null sem chamar a API", async () => {
    expect(await awardCoins("u1", 0, "LESSON", "l")).toBeNull();
    expect(internalApiPost).not.toHaveBeenCalled();
  });
});

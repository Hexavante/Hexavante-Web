import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { awardXp, getUserXpProfile, getRanking } from "../xp.service";

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/internal-api", () => ({
  internalApiPost: vi.fn(),
}));

import { internalApiPost } from "@/lib/internal-api";

describe("xp.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("awardXp (delegado ao motor da API)", () => {
    it("envia o valor BASE para a API e devolve o award", async () => {
      vi.mocked(internalApiPost).mockResolvedValue({
        award: { amount: 20, description: "Test (booster pessoal x2)", leveledUp: false },
      });

      const result = await awardXp("user-1", 10, "LESSON", "lesson-1", "Test");

      expect(internalApiPost).toHaveBeenCalledWith("/internal/v1/gamification/xp", {
        userId: "user-1",
        amount: 10,
        source: "LESSON",
        sourceId: "lesson-1",
        description: "Test",
      });
      expect(result).toEqual({ amount: 20, description: "Test (booster pessoal x2)", leveledUp: false });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("XP já concedido para a fonte → null", async () => {
      vi.mocked(internalApiPost).mockResolvedValue({ award: null });
      expect(await awardXp("user-1", 10, "LESSON", "lesson-1")).toBeNull();
    });

    it("API indisponível → null (fluxo do usuário segue, erro registrado)", async () => {
      vi.mocked(internalApiPost).mockRejectedValue(new Error("network"));
      expect(await awardXp("user-1", 10, "LESSON", "lesson-1")).toBeNull();
    });

    it("valor <= 0 → null sem chamar a API", async () => {
      expect(await awardXp("user-1", 0, "LESSON", "lesson-1")).toBeNull();
      expect(internalApiPost).not.toHaveBeenCalled();
    });
  });

  describe("getUserXpProfile", () => {
    it("deve retornar perfil de XP do usuário", async () => {
      const userId = "user-1";

      prismaMock.userXP.findUnique.mockResolvedValue({
        level: 5,
        currentXp: 50,
        totalXp: 450,
      });

      const result = await getUserXpProfile(userId);

      expect(result).toEqual({
        level: 5,
        currentXp: 50,
        totalXp: 450,
        xpToNextLevel: 500,
        progressPercent: 10,
      });
    });

    it("deve retornar null se usuário não tem XP", async () => {
      const userId = "user-1";

      prismaMock.userXP.findUnique.mockResolvedValue(null);

      const result = await getUserXpProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe("getRanking", () => {
    it("deve retornar ranking de usuários", async () => {
      prismaMock.userXP.findMany.mockResolvedValue([
        {
          id: "xp-1",
          userId: "user-1",
          level: 10,
          totalXp: 1000,
          user: {
            id: "user-1",
            username: "user1",
            fullName: "User One",
          },
        },
        {
          id: "xp-2",
          userId: "user-2",
          level: 5,
          totalXp: 500,
          user: {
            id: "user-2",
            username: "user2",
            fullName: "User Two",
          },
        },
      ]);

      const result = await getRanking(10);

      expect(result).toHaveLength(2);
      expect(result[0].user.username).toBe("user1");
      expect(result[0].periodXp).toBe(1000);
    });
  });
});

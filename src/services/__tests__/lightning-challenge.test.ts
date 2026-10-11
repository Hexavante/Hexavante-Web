import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prismaMock } from "@/test/mocks/prisma";
import { awardXp } from "@/services/xp.service";
import { awardCoins } from "@/services/wallet.service";
import {
  LIGHTNING_BONUS_XP_ALL_CORRECT,
  LIGHTNING_COINS_PER_CORRECT,
  LIGHTNING_XP_PER_CORRECT,
  getLightningDailyStatus,
  getLightningQuestions,
  listLightningHistory,
  submitLightningChallenge,
} from "../lightning-challenge.service";

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/services/xp.service", () => ({
  awardXp: vi.fn(),
}));

vi.mock("@/services/wallet.service", () => ({
  awardCoins: vi.fn(),
}));

const mockedAwardXp = vi.mocked(awardXp);
const mockedAwardCoins = vi.mocked(awardCoins);

// 2026-10-10T12:00:00Z = 09:00 em Brasília → challengeDate 2026-10-10.
const FIXED_NOW = new Date("2026-10-10T12:00:00.000Z").getTime();
const CHALLENGE_DATE = new Date("2026-10-10T00:00:00.000Z");
const SOURCE_ID = "lightning-challenge-2026-10-10";

function questionWithAnswer(qid: string, correctAlt: string, wrongAlt: string) {
  return {
    id: qid,
    alternatives: [
      { id: correctAlt, isCorrect: true },
      { id: wrongAlt, isCorrect: false },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  mockedAwardXp.mockResolvedValue({ amount: 0, description: "", leveledUp: false });
  mockedAwardCoins.mockResolvedValue({ amount: 0, description: "", multiplier: 1 });
});

describe("lightning-challenge.service", () => {
  describe("cálculo de recompensa", () => {
    it("concede XP/moedas proporcionais aos acertos (3/5)", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue(null);
      prismaMock.examQuestion.findMany.mockResolvedValue([
        questionWithAnswer("q1", "q1-ok", "q1-no"),
        questionWithAnswer("q2", "q2-ok", "q2-no"),
        questionWithAnswer("q3", "q3-ok", "q3-no"),
        questionWithAnswer("q4", "q4-ok", "q4-no"),
        questionWithAnswer("q5", "q5-ok", "q5-no"),
      ]);
      prismaMock.lightningChallengeAttempt.create.mockResolvedValue({});
      prismaMock.lightningChallengeAttempt.update.mockResolvedValue({});
      mockedAwardXp.mockResolvedValue({ amount: 45, description: "x", leveledUp: false });
      mockedAwardCoins.mockResolvedValue({ amount: 9, description: "x", multiplier: 1 });

      const result = await submitLightningChallenge(
        "user-1",
        [
          { questionId: "q1", alternativeId: "q1-ok" },
          { questionId: "q2", alternativeId: "q2-ok" },
          { questionId: "q3", alternativeId: "q3-ok" },
          { questionId: "q4", alternativeId: "q4-no" },
          { questionId: "q5", alternativeId: "q5-no" },
        ],
        42,
      );

      expect(result?.score).toBe(3);
      expect(result?.totalQuestions).toBe(5);
      // 3 acertos × 15 XP, sem bônus
      expect(mockedAwardXp).toHaveBeenCalledWith(
        "user-1",
        3 * LIGHTNING_XP_PER_CORRECT,
        "ADMIN",
        SOURCE_ID,
        expect.any(String),
      );
      // 3 acertos × 3 moedas
      expect(mockedAwardCoins).toHaveBeenCalledWith(
        "user-1",
        3 * LIGHTNING_COINS_PER_CORRECT,
        "ADMIN",
        SOURCE_ID,
        expect.any(String),
      );
    });

    it("aplica bônus de XP ao acertar tudo (5/5)", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue(null);
      prismaMock.examQuestion.findMany.mockResolvedValue([
        questionWithAnswer("q1", "q1-ok", "q1-no"),
        questionWithAnswer("q2", "q2-ok", "q2-no"),
      ]);
      prismaMock.lightningChallengeAttempt.create.mockResolvedValue({});
      prismaMock.lightningChallengeAttempt.update.mockResolvedValue({});
      mockedAwardXp.mockResolvedValue({ amount: 60, description: "x", leveledUp: false });
      mockedAwardCoins.mockResolvedValue({ amount: 6, description: "x", multiplier: 1 });

      const result = await submitLightningChallenge(
        "user-1",
        [
          { questionId: "q1", alternativeId: "q1-ok" },
          { questionId: "q2", alternativeId: "q2-ok" },
        ],
        20,
      );

      expect(result?.score).toBe(2);
      // 2×15 + bônus 30
      expect(mockedAwardXp).toHaveBeenCalledWith(
        "user-1",
        2 * LIGHTNING_XP_PER_CORRECT + LIGHTNING_BONUS_XP_ALL_CORRECT,
        "ADMIN",
        SOURCE_ID,
        expect.any(String),
      );
    });

    it("não concede XP/moedas quando zera (score 0)", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue(null);
      prismaMock.examQuestion.findMany.mockResolvedValue([
        questionWithAnswer("q1", "q1-ok", "q1-no"),
      ]);
      prismaMock.lightningChallengeAttempt.create.mockResolvedValue({});

      const result = await submitLightningChallenge(
        "user-1",
        [{ questionId: "q1", alternativeId: "q1-no" }],
        10,
      );

      expect(result?.score).toBe(0);
      expect(mockedAwardXp).not.toHaveBeenCalled();
      expect(mockedAwardCoins).not.toHaveBeenCalled();
    });
  });

  describe("idempotência / já jogou", () => {
    it("retorna null sem conceder nada quando já jogou hoje", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue({ id: "att-1" });

      const result = await submitLightningChallenge(
        "user-1",
        [{ questionId: "q1", alternativeId: "q1-ok" }],
        10,
      );

      expect(result).toBeNull();
      expect(prismaMock.examQuestion.findMany).not.toHaveBeenCalled();
      expect(prismaMock.lightningChallengeAttempt.create).not.toHaveBeenCalled();
      expect(mockedAwardXp).not.toHaveBeenCalled();
      expect(mockedAwardCoins).not.toHaveBeenCalled();
    });

    it("retorna null em corrida concorrente (P2002 no create)", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue(null);
      prismaMock.examQuestion.findMany.mockResolvedValue([
        questionWithAnswer("q1", "q1-ok", "q1-no"),
      ]);
      prismaMock.lightningChallengeAttempt.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "6",
        }),
      );

      const result = await submitLightningChallenge(
        "user-1",
        [{ questionId: "q1", alternativeId: "q1-ok" }],
        10,
      );

      expect(result).toBeNull();
      // Sem XP/moedas duplicados: award nunca é chamado após P2002.
      expect(mockedAwardXp).not.toHaveBeenCalled();
      expect(mockedAwardCoins).not.toHaveBeenCalled();
    });

    it("usa sourceId diário idempotente em XP e moedas", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue(null);
      prismaMock.examQuestion.findMany.mockResolvedValue([
        questionWithAnswer("q1", "q1-ok", "q1-no"),
      ]);
      prismaMock.lightningChallengeAttempt.create.mockResolvedValue({});
      prismaMock.lightningChallengeAttempt.update.mockResolvedValue({});
      mockedAwardXp.mockResolvedValue({ amount: 15, description: "x", leveledUp: false });
      mockedAwardCoins.mockResolvedValue({ amount: 3, description: "x", multiplier: 1 });

      await submitLightningChallenge(
        "user-1",
        [{ questionId: "q1", alternativeId: "q1-ok" }],
        10,
      );

      // Mesmo sourceId nos dois award → xp/coinTransaction unique impede duplicata.
      expect(mockedAwardXp).toHaveBeenCalledWith(
        "user-1",
        expect.any(Number),
        "ADMIN",
        SOURCE_ID,
        expect.any(String),
      );
      expect(mockedAwardCoins).toHaveBeenCalledWith(
        "user-1",
        expect.any(Number),
        "ADMIN",
        SOURCE_ID,
        expect.any(String),
      );
      // Tentativa gravada com a data do desafio (dia BR truncado).
      expect(prismaMock.lightningChallengeAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: "user-1", challengeDate: CHALLENGE_DATE }),
      });
    });
  });

  describe("getLightningDailyStatus", () => {
    it("retorna played:false quando não há tentativa hoje", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue(null);
      const status = await getLightningDailyStatus("user-1");
      expect(status).toEqual({ played: false, attempt: null });
      expect(prismaMock.lightningChallengeAttempt.findUnique).toHaveBeenCalledWith({
        where: { userId_challengeDate: { userId: "user-1", challengeDate: CHALLENGE_DATE } },
        select: expect.any(Object),
      });
    });

    it("retorna played:true com a tentativa de hoje", async () => {
      prismaMock.lightningChallengeAttempt.findUnique.mockResolvedValue({
        score: 4,
        totalQuestions: 5,
        xpAwarded: 60,
        coinsAwarded: 12,
        completedAt: new Date(),
      });
      const status = await getLightningDailyStatus("user-1");
      expect(status.played).toBe(true);
      expect(status.attempt?.score).toBe(4);
    });
  });

  describe("getLightningQuestions", () => {
    it("retorna [] quando há menos questões elegíveis que o necessário", async () => {
      prismaMock.examQuestion.count.mockResolvedValue(2);
      const questions = await getLightningQuestions();
      expect(questions).toEqual([]);
      expect(prismaMock.examQuestion.findMany).not.toHaveBeenCalled();
    });
  });

  describe("listLightningHistory", () => {
    it("lista tentativas ordenadas por data desc com limite", async () => {
      prismaMock.lightningChallengeAttempt.findMany.mockResolvedValue([]);
      await listLightningHistory("user-1", 10);
      expect(prismaMock.lightningChallengeAttempt.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { challengeDate: "desc" },
        take: 10,
        select: expect.any(Object),
      });
    });
  });
});

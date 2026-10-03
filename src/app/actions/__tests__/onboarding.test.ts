/**
 * `claimTutorialVideoRewardAction` — recompensa de 100 moedas por assistir o
 * tutorial em vídeo até o fim.
 *
 * Regressões cobertas:
 *  - sem sessão → erro, nenhuma escrita;
 *  - sucesso → cria o CoinTransaction E incrementa `user.coins` na MESMA transação;
 *  - P2002 (unique [userId, source, sourceId]) → `alreadyClaimed` sem novo incremento;
 *  - erro inesperado → `{ success:false }` sem lançar exceção.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { prismaMock } from "@/test/mocks/prisma";

const { authMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  claimTutorialVideoRewardAction,
  completeOnboardingTourAction,
} from "../onboarding";
import {
  TUTORIAL_REWARD_AMOUNT,
  TUTORIAL_REWARD_SOURCE_ID,
} from "@/lib/tutorial-reward";

type TxMock = {
  coinTransaction: { create: ReturnType<typeof vi.fn> };
  user: { update: ReturnType<typeof vi.fn> };
};

function makeTx(): TxMock {
  return {
    coinTransaction: { create: vi.fn().mockResolvedValue({}) },
    user: { update: vi.fn().mockResolvedValue({ coins: 100 }) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: "user-1" } });
});

describe("claimTutorialVideoRewardAction", () => {
  it("deve criar a transação e incrementar as moedas quando dá certo", async () => {
    const tx = makeTx();
    prismaMock.$transaction.mockImplementation(async (callback: (t: TxMock) => unknown) =>
      callback(tx),
    );

    const result = await claimTutorialVideoRewardAction();

    expect(result).toEqual({ success: true, amount: TUTORIAL_REWARD_AMOUNT });
    expect(tx.coinTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.coinTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        amount: 100,
        type: "EARN",
        source: "TUTORIAL_REWARD",
        sourceId: "onboarding-video",
        description: "Recompensa: assistir tutorial",
      },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { coins: { increment: TUTORIAL_REWARD_AMOUNT } },
    });
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it("deve devolver alreadyClaimed sem incrementar quando o unique estoura (P2002)", async () => {
    const tx = makeTx();
    tx.coinTransaction.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6",
      }),
    );
    prismaMock.$transaction.mockImplementation(async (callback: (t: TxMock) => unknown) =>
      callback(tx),
    );

    const result = await claimTutorialVideoRewardAction();

    expect(result).toEqual({
      success: true,
      alreadyClaimed: true,
      amount: TUTORIAL_REWARD_AMOUNT,
    });
    // transação abortou: nenhuma escrita parcial pode vazar
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("deve retornar erro sem tocar no banco quando não há sessão", async () => {
    authMock.mockResolvedValue(null);

    const result = await claimTutorialVideoRewardAction();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/login/i);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("deve devolver success:false (sem lançar) em erro inesperado", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("banco fora do ar"));

    const result = await claimTutorialVideoRewardAction();

    expect(result).toEqual({ success: false, error: "Não foi possível resgatar a recompensa." });
  });
});

describe("completeOnboardingTourAction", () => {
  it("deve gravar onboardingCompletedAt com sessão", async () => {
    prismaMock.user.update.mockResolvedValue({});

    const result = await completeOnboardingTourAction();

    expect(result).toEqual({ success: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { onboardingCompletedAt: expect.any(Date) },
    });
  });

  it("deve retornar erro sem sessão", async () => {
    authMock.mockResolvedValue(null);

    const result = await completeOnboardingTourAction();

    expect(result.success).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});

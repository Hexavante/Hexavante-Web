import { beforeEach, describe, expect, it, vi } from "vitest";
import { retireEmojiPacks } from "../shop.service";
import { createNotification } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";

const tx = {
  coinTransaction: { findUnique: vi.fn(), create: vi.fn() },
  user: { update: vi.fn() },
  userWallet: { upsert: vi.fn() },
  userInventory: { delete: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userInventory: { findMany: vi.fn() },
    storeItem: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/services/notification.service", () => ({ createNotification: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const owned = (id: string, userId: string, storeItemId: string) => ({
  id,
  userId,
  storeItemId,
  storeItem: { name: "Pack Emojis Tech" },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => (fn as (t: typeof tx) => unknown)(tx));
  tx.user.update.mockResolvedValue({ coins: 160 });
});

describe("retireEmojiPacks", () => {
  it("devolve exatamente o valor pago, remove o item e notifica", async () => {
    vi.mocked(prisma.userInventory.findMany).mockResolvedValue([owned("inv1", "u1", "item-tech")] as never);
    tx.coinTransaction.findUnique.mockResolvedValue({ amount: -60 });

    expect(await retireEmojiPacks()).toEqual({ refunded: 1, removed: 1 });

    expect(tx.coinTransaction.findUnique).toHaveBeenCalledWith({
      where: { userId_source_sourceId: { userId: "u1", source: "SHOP_PURCHASE", sourceId: "item-tech" } },
      select: { amount: true },
    });
    expect(tx.coinTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        amount: 60,
        type: "EARN",
        sourceId: "refund-emoji-pack:item-tech",
      }),
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { coins: { increment: 60 } },
      select: { coins: true },
    });
    expect(tx.userWallet.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { coins: 160 } }));
    expect(tx.userInventory.delete).toHaveBeenCalledWith({ where: { id: "inv1" } });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", type: "COIN_EARNED", message: expect.stringContaining("60 moedas") }),
    );
    expect(prisma.storeItem.updateMany).toHaveBeenCalledWith({
      where: { category: "EMOJI_PACK", isActive: true },
      data: { isActive: false },
    });
  });

  it("item ganho de graça (sem compra registrada): só remove, sem reembolso", async () => {
    vi.mocked(prisma.userInventory.findMany).mockResolvedValue([owned("inv1", "u1", "item-tech")] as never);
    tx.coinTransaction.findUnique.mockResolvedValue(null);

    expect(await retireEmojiPacks()).toEqual({ refunded: 0, removed: 1 });
    expect(tx.coinTransaction.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.userInventory.delete).toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("outro processo já reembolsou (P2002): ignora e segue para o próximo", async () => {
    vi.mocked(prisma.userInventory.findMany).mockResolvedValue([
      owned("inv1", "u1", "a"),
      owned("inv2", "u2", "b"),
    ] as never);
    tx.coinTransaction.findUnique.mockResolvedValue({ amount: -50 });
    vi.mocked(prisma.$transaction)
      .mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "P2002" }))
      .mockImplementationOnce(async (fn: unknown) => (fn as (t: typeof tx) => unknown)(tx));

    expect(await retireEmojiPacks()).toEqual({ refunded: 1, removed: 1 });
    expect(createNotification).toHaveBeenCalledTimes(1);
  });

  it("nada a aposentar: só garante os itens inativos", async () => {
    vi.mocked(prisma.userInventory.findMany).mockResolvedValue([]);
    expect(await retireEmojiPacks()).toEqual({ refunded: 0, removed: 0 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.storeItem.updateMany).toHaveBeenCalled();
  });
});

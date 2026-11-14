import { cache } from "react";
import { getAvatarBorderClassName, resolveAppTheme, resolveProfileIcon } from "@/lib/cosmetics";
import { buildPremiumStatus } from "@/lib/premium";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createNotification } from "@/services/notification.service";
import { RETIRED_SHOP_CATEGORIES, SHOP_CATALOG } from "@/lib/shop-catalog";
import {
  computeTemporaryExpiry,
  getShopOwnershipStatus,
  type ShopOwnershipStatus,
} from "@/lib/shop-item-utils";
import { activateBooster } from "@/services/booster.service";
import { getUserCoinProfile, spendCoins, getCoinHistory } from "@/services/wallet.service";
import type { StoreItem, StoreItemCategory } from "@prisma/client";

const DEPRECATED_SHOP_SLUGS = ["booster-coins-24h"];

/**
 * O catálogo tem centenas de itens e o `upsert` de cada um custa caro. Antes
 * isso rodava em TODA renderização (layout + página), tornando a navegação
 * lenta e esgotando o pool do Prisma. Agora é executado no máximo uma vez por
 * janela, reaproveitando a promise em voo para evitar corrida entre requisições.
 */
const SHOP_CATALOG_TTL_MS = 10 * 60 * 1000;
let shopCatalogPromise: Promise<void> | null = null;
let shopCatalogEnsuredAt = 0;

type TemporaryMetadata = {
  multiplier?: number;
  durationHours?: number;
  durationDays?: number;
};

function isKnownRaceError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  // P2002: outro processo já criou o reembolso; P2025: já removeu o item.
  return code === "P2002" || code === "P2025";
}

/**
 * Pacotes de emoji saíram da plataforma. Cada compra é reembolsada UMA vez,
 * com o valor exato pago (transação SHOP_PURCHASE), e o item sai do
 * inventário — tudo na mesma transação.
 *
 * Roda junto com a sincronização do catálogo. Idempotente: o reembolso tem
 * sourceId fixo (unique) e, depois da primeira execução, não sobra inventário
 * de EMOJI_PACK — vira uma consulta vazia.
 */
export async function retireEmojiPacks(): Promise<{ refunded: number; removed: number }> {
  const owned = await prisma.userInventory.findMany({
    where: { storeItem: { category: "EMOJI_PACK" } },
    select: { id: true, userId: true, storeItemId: true, storeItem: { select: { name: true } } },
  });

  let refunded = 0;
  let removed = 0;

  for (const entry of owned) {
    try {
      const amount = await prisma.$transaction(async (tx) => {
        const purchase = await tx.coinTransaction.findUnique({
          where: {
            userId_source_sourceId: {
              userId: entry.userId,
              source: "SHOP_PURCHASE",
              sourceId: entry.storeItemId,
            },
          },
          select: { amount: true },
        });
        const paid = purchase ? Math.abs(purchase.amount) : 0;

        if (paid > 0) {
          await tx.coinTransaction.create({
            data: {
              userId: entry.userId,
              amount: paid,
              type: "EARN",
              source: "ADMIN",
              sourceId: `refund-emoji-pack:${entry.storeItemId}`,
              description: `Reembolso: ${entry.storeItem.name} (removido da loja)`,
            },
          });
          const user = await tx.user.update({
            where: { id: entry.userId },
            data: { coins: { increment: paid } },
            select: { coins: true },
          });
          await tx.userWallet.upsert({
            where: { userId: entry.userId },
            create: { userId: entry.userId, coins: user.coins },
            update: { coins: user.coins },
          });
        }

        await tx.userInventory.delete({ where: { id: entry.id } });
        return paid;
      });

      removed += 1;
      if (amount > 0) {
        refunded += 1;
        await createNotification({
          userId: entry.userId,
          type: "COIN_EARNED",
          title: "Moedas devolvidas",
          message: `Os pacotes de emoji saíram da loja. Devolvemos ${amount} moedas pelo ${entry.storeItem.name}.`,
          link: "/shop",
          skipDedupe: true,
        }).catch((error) => logger.warn("Falha ao notificar reembolso de emoji", { error }));
      }
    } catch (error) {
      if (isKnownRaceError(error)) continue;
      logger.error("Falha ao reembolsar pacote de emoji", error instanceof Error ? error : undefined, {
        inventoryId: entry.id,
      });
    }
  }

  await prisma.storeItem.updateMany({
    where: { category: "EMOJI_PACK", isActive: true },
    data: { isActive: false },
  });

  return { refunded, removed };
}

async function syncShopCatalog(): Promise<void> {
  // Nunca bloqueia a loja/cadastro: se falhar, tenta de novo na próxima sync.
  await retireEmojiPacks().catch((error) =>
    logger.error("Falha ao aposentar pacotes de emoji", error instanceof Error ? error : undefined),
  );

  if (DEPRECATED_SHOP_SLUGS.length > 0) {
    await prisma.storeItem.updateMany({
      where: { slug: { in: DEPRECATED_SHOP_SLUGS } },
      data: { isActive: false },
    });
  }

  await prisma.$transaction(
    SHOP_CATALOG.map((item) =>
      prisma.storeItem.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          description: item.description,
          cost: item.cost,
          category: item.category,
          imageUrl: item.imageUrl ?? null,
          isPremiumOnly: item.isPremiumOnly ?? false,
          isPermanent: item.isPermanent ?? true,
          metadata: item.metadata ?? undefined,
          isActive: true,
        },
        create: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          cost: item.cost,
          category: item.category,
          imageUrl: item.imageUrl ?? null,
          isPremiumOnly: item.isPremiumOnly ?? false,
          isPermanent: item.isPermanent ?? true,
          metadata: item.metadata ?? undefined,
        },
      }),
    ),
  );
}

export async function ensureShopCatalog(): Promise<void> {
  const now = Date.now();
  if (shopCatalogPromise && now - shopCatalogEnsuredAt < SHOP_CATALOG_TTL_MS) {
    return shopCatalogPromise;
  }

  shopCatalogEnsuredAt = now;
  shopCatalogPromise = syncShopCatalog();

  try {
    await shopCatalogPromise;
  } catch (error) {
    // Falha não fica cacheada: a próxima navegação tenta novamente.
    shopCatalogPromise = null;
    shopCatalogEnsuredAt = 0;
    throw error;
  }
}

export async function listShopItems(category?: StoreItemCategory) {
  await ensureShopCatalog();
  return prisma.storeItem.findMany({
    where: {
      isActive: true,
      ...(category
        ? { category }
        : { category: { notIn: RETIRED_SHOP_CATEGORIES } }),
    },
    orderBy: [{ category: "asc" }, { cost: "asc" }],
  });
}

export async function getUserInventory(userId: string) {
  return prisma.userInventory.findMany({
    where: {
      userId,
      storeItem: { category: { notIn: RETIRED_SHOP_CATEGORIES } },
    },
    include: { storeItem: true },
    orderBy: { purchasedAt: "desc" },
  });
}

export async function getEquippedItems(userId: string) {
  const now = new Date();
  return prisma.userInventory.findMany({
    where: {
      userId,
      isEquipped: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { storeItem: true },
  });
}

export type ShopItemView = StoreItem & {
  ownershipStatus: ShopOwnershipStatus;
  inventoryId?: string;
  isEquipped: boolean;
  expiresAt: Date | null;
};

export async function getShopState(userId: string) {
  const [items, inventory, coinProfile, user, cosmetics, coinHistory] = await Promise.all([
    listShopItems(),
    getUserInventory(userId),
    getUserCoinProfile(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumExpiresAt: true, fullName: true, username: true, avatarUrl: true },
    }),
    getProfileCosmetics(userId),
    getCoinHistory(userId, 10),
  ]);

  const premium = user ? buildPremiumStatus(user) : null;
  const inventoryByItem = new Map(inventory.map((entry) => [entry.storeItemId, entry]));

  const itemViews: ShopItemView[] = items.map((item) => {
    const entry = inventoryByItem.get(item.id);
    const ownershipStatus = getShopOwnershipStatus(item.isPermanent, entry);
    return {
      ...item,
      ownershipStatus,
      inventoryId: entry?.id,
      isEquipped: entry?.isEquipped ?? false,
      expiresAt: entry?.expiresAt ?? null,
    };
  });

  return {
    items: itemViews,
    inventory,
    coins: coinProfile.coins,
    premium,
    coinMultiplier: coinProfile.coinMultiplier,
    activeBooster: coinProfile.activeBooster,
    profilePreview: {
      fullName: user?.fullName ?? "Estudante",
      username: user?.username ?? "usuario",
      avatarUrl: user?.avatarUrl ?? null,
      cosmetics,
    },
    coinHistory,
  };
}

async function chargeForItem(userId: string, item: StoreItem, premiumActive: boolean) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true },
  });
  if (!user) throw new Error("Usuário não encontrado.");

  const isFreeForPremium = item.isPremiumOnly && premiumActive;
  const finalCost = isFreeForPremium ? 0 : item.cost;

  if (finalCost > 0 && user.coins < finalCost) {
    throw new Error("Moedas insuficientes.");
  }

  if (finalCost > 0) {
    const spent = await spendCoins(
      userId,
      finalCost,
      "SHOP_PURCHASE",
      item.id,
      `Compra: ${item.name}`,
    );
    if (!spent) throw new Error("Não foi possível processar o pagamento.");
  }
}

function resolveTemporaryExpiry(item: StoreItem, baseDate = new Date()) {
  const meta = item.metadata as TemporaryMetadata | null;
  return computeTemporaryExpiry(meta?.durationHours, meta?.durationDays, baseDate);
}

async function applyTemporaryPurchaseEffects(userId: string, item: StoreItem, baseDate: Date) {
  if (item.category === "BOOSTER") {
    const meta = item.metadata as TemporaryMetadata | null;
    const booster = await activateBooster(
      userId,
      meta?.multiplier ?? 2,
      meta?.durationHours ?? (meta?.durationDays ? meta.durationDays * 24 : 24),
    );
    return booster.expiresAt;
  }

  if (item.category === "PASS" || item.category === "REVIEW_PACK") {
    return resolveTemporaryExpiry(item, baseDate);
  }

  return null;
}

async function repurchaseTemporaryItem(
  userId: string,
  item: StoreItem,
  existingId: string,
  premiumActive: boolean,
) {
  await chargeForItem(userId, item, premiumActive);

  const existing = await prisma.userInventory.findUnique({ where: { id: existingId } });
  const baseDate =
    existing?.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date();
  const expiresAt = await applyTemporaryPurchaseEffects(userId, item, baseDate);

  return prisma.userInventory.update({
    where: { id: existingId },
    data: {
      purchasedAt: new Date(),
      expiresAt,
      isEquipped: item.category === "BOOSTER" ? true : false,
    },
    include: { storeItem: true },
  });
}

export async function purchaseStoreItem(userId: string, storeItemId: string) {
  const item = await prisma.storeItem.findFirst({
    where: { id: storeItemId, isActive: true },
  });
  if (!item) {
    throw new Error("Item não encontrado.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  if (!user) throw new Error("Usuário não encontrado.");

  const premium = buildPremiumStatus(user);
  if (item.isPremiumOnly && !premium.isActive) {
    throw new Error("Este item é exclusivo para assinantes Premium.");
  }

  const existing = await prisma.userInventory.findUnique({
    where: { userId_storeItemId: { userId, storeItemId } },
  });

  if (existing) {
    if (item.isPermanent) {
      throw new Error("Você já possui este item.");
    }
    return repurchaseTemporaryItem(userId, item, existing.id, premium.isActive);
  }

  await chargeForItem(userId, item, premium.isActive);

  let expiresAt: Date | null = null;
  if (!item.isPermanent) {
    expiresAt = await applyTemporaryPurchaseEffects(userId, item, new Date());
  }

  return prisma.userInventory.create({
    data: {
      userId,
      storeItemId,
      isEquipped: item.category === "BOOSTER",
      expiresAt,
    },
    include: { storeItem: true },
  });
}

const EQUIPPABLE_CATEGORIES: StoreItemCategory[] = [
  "TITLE",
  "AVATAR_BORDER",
  "THEME",
  "COSMETIC",
  "BADGE",
  "FRAME",
  "PROFILE_BACKGROUND",
];

const DEFAULT_THEME_SLUG = "theme-hexavante";

/** Garante o tema Hexavante padrão no inventário de novos usuários. */
export async function ensureDefaultUserCosmetics(userId: string) {
  await ensureShopCatalog();

  const defaultTheme = await prisma.storeItem.findUnique({
    where: { slug: DEFAULT_THEME_SLUG },
  });
  if (!defaultTheme) return;

  const existing = await prisma.userInventory.findUnique({
    where: { userId_storeItemId: { userId, storeItemId: defaultTheme.id } },
  });

  if (!existing) {
    // `upsert` em vez de `create`: o layout e a página renderizam em paralelo
    // e os dois podem tentar criar o item padrão ao mesmo tempo (P2002).
    await prisma.userInventory.upsert({
      where: { userId_storeItemId: { userId, storeItemId: defaultTheme.id } },
      create: {
        userId,
        storeItemId: defaultTheme.id,
        isEquipped: true,
      },
      update: {},
    });
    return;
  }

  const hasEquippedTheme = await prisma.userInventory.findFirst({
    where: {
      userId,
      isEquipped: true,
      storeItem: { category: "THEME" },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!hasEquippedTheme && !existing.isEquipped) {
    await prisma.userInventory.update({
      where: { id: existing.id },
      data: { isEquipped: true },
    });
  }
}

function validateEquipMetadata(category: StoreItemCategory, metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const meta = metadata as Record<string, unknown>;

  switch (category) {
    case "THEME":
      return typeof meta.themeId === "string" && Boolean(resolveAppTheme(meta.themeId));
    case "AVATAR_BORDER":
      return typeof meta.borderId === "string";
    case "TITLE":
      return true;
    case "COSMETIC":
      return meta.cosmeticType === "profile_icon"
        ? typeof meta.iconId === "string"
        : meta.cosmeticType === "sticker";
    case "BADGE":
      return typeof meta.badgeId === "string";
    case "FRAME":
      return typeof meta.frameId === "string";
    case "PROFILE_BACKGROUND":
      return typeof meta.backgroundId === "string";
    default:
      return false;
  }
}

export async function equipStoreItem(userId: string, inventoryId: string) {
  const entry = await prisma.userInventory.findFirst({
    where: { id: inventoryId, userId },
    include: { storeItem: true },
  });
  if (!entry) throw new Error("Item não encontrado no inventário.");
  if (!entry.storeItem.isActive) throw new Error("Este item não está mais disponível.");
  if (!EQUIPPABLE_CATEGORIES.includes(entry.storeItem.category)) {
    throw new Error("Este item não pode ser equipado.");
  }
  if (entry.expiresAt && entry.expiresAt <= new Date()) {
    throw new Error("Este item expirou.");
  }
  if (!validateEquipMetadata(entry.storeItem.category, entry.storeItem.metadata)) {
    throw new Error("Metadados do item inválidos. Contate o suporte.");
  }

  await prisma.$transaction(async (tx) => {
    const sameCategory = await tx.userInventory.findMany({
      where: {
        userId,
        storeItem: { category: entry.storeItem.category },
      },
    });

    for (const item of sameCategory) {
      await tx.userInventory.update({
        where: { id: item.id },
        data: { isEquipped: item.id === inventoryId },
      });
    }
  });

  return prisma.userInventory.findUnique({
    where: { id: inventoryId },
    include: { storeItem: true },
  });
}

export const getProfileCosmetics = cache(async (userId: string) => {
  await ensureDefaultUserCosmetics(userId);
  const equipped = await getEquippedItems(userId);
  const title = equipped.find((e) => e.storeItem.category === "TITLE");
  const border = equipped.find((e) => e.storeItem.category === "AVATAR_BORDER");
  const theme = equipped.find((e) => e.storeItem.category === "THEME");
  const cosmetic = equipped.find((e) => e.storeItem.category === "COSMETIC");
  const badge = equipped.find((e) => e.storeItem.category === "BADGE");
  const frame = equipped.find((e) => e.storeItem.category === "FRAME");
  const background = equipped.find((e) => e.storeItem.category === "PROFILE_BACKGROUND");

  const titleMeta = title?.storeItem.metadata as { titleText?: string } | null;
  const borderMeta = border?.storeItem.metadata as { borderId?: string; rarity?: string } | null;
  const themeMeta = theme?.storeItem.metadata as { themeId?: string } | null;
  const cosmeticMeta = cosmetic?.storeItem.metadata as {
    cosmeticType?: string;
    iconId?: string;
  } | null;
  const badgeMeta = badge?.storeItem.metadata as { badgeId?: string; rarity?: string } | null;
  const frameMeta = frame?.storeItem.metadata as { frameId?: string; rarity?: string } | null;
  const backgroundMeta = background?.storeItem.metadata as {
    backgroundId?: string;
    rarity?: string;
  } | null;

  const themeId = themeMeta?.themeId ?? null;
  const resolvedThemeId = themeId === "default" ? null : themeId;
  const borderId = borderMeta?.borderId ?? null;
  const profileIconId =
    cosmeticMeta?.cosmeticType === "profile_icon" ? (cosmeticMeta.iconId ?? null) : null;
  const appTheme = resolveAppTheme(resolvedThemeId);

  return {
    equippedTitle: titleMeta?.titleText ?? title?.storeItem.name ?? null,
    borderId,
    avatarBorderClassName: getAvatarBorderClassName(borderId),
    profileIconId,
    profileIcon: resolveProfileIcon(profileIconId),
    petId: null,
    pet: null,
    petAccessoryId: null,
    petAccessory: null,
    themeId: resolvedThemeId,
    themeClassName: appTheme.className,
    themeVars: appTheme.vars,
    badgeId: badgeMeta?.badgeId ?? null,
    badgeLabel: badge?.storeItem.name ?? null,
    badgeRarity: badgeMeta?.rarity ?? null,
    frameId: frameMeta?.frameId ?? null,
    frameRarity: frameMeta?.rarity ?? null,
    profileBackgroundId: backgroundMeta?.backgroundId ?? null,
    profileBackgroundRarity: backgroundMeta?.rarity ?? null,
  };
});

"use client";

import { useActionState, useEffect, useRef } from "react";
import { Coins } from "lucide-react";
import { equipItemAction, purchaseItemAction, type ShopActionResult } from "@/app/actions/shop";
import { notifyThemeEquipped } from "@/lib/theme-equip-event";
import { ThemeSwatch } from "@/components/shop/theme-swatch";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RARITY_LABELS } from "@/lib/cosmetics";
import { STORE_CATEGORY_LABELS } from "@/lib/shop-catalog";
import { SHOP_ITEM_ICONS } from "@/lib/shop-item-icons";
import { SHOP_CATEGORY_ICONS } from "@/lib/shop-ui";
import {
  formatExpirationDate,
  SHOP_OWNERSHIP_LABELS,
  type ShopOwnershipStatus,
} from "@/lib/shop-item-utils";
import type { StoreItemCategory } from "@prisma/client";

type ShopItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cost: number;
  category: StoreItemCategory;
  isPremiumOnly: boolean;
  isPermanent: boolean;
  metadata?: {
    borderId?: string;
    rarity?: string;
    themeId?: string;
    multiplier?: number;
    durationHours?: number;
    durationDays?: number;
    affects?: string[];
    passType?: string;
    topic?: string;
    petId?: string;
    accessoryId?: string;
  } | null;
};

type Props = {
  item: ShopItem;
  ownershipStatus: ShopOwnershipStatus;
  equipped: boolean;
  inventoryId?: string;
  expiresAt?: Date | string | null;
  userCoins: number;
  isPremium: boolean;
};

const initial: ShopActionResult = { success: false };

const OWNERSHIP_BADGE_VARIANT: Record<
  ShopOwnershipStatus,
  "default" | "emerald" | "amber" | "violet"
> = {
  available: "default",
  owned_permanent: "emerald",
  active_temporary: "violet",
  expired_temporary: "amber",
};

export function ShopItemCard({
  item,
  ownershipStatus,
  equipped,
  inventoryId,
  expiresAt,
  userCoins,
  isPremium,
}: Props) {
  const [purchaseState, purchase, purchasing] = useActionState(purchaseItemAction, initial);
  const [equipState, equip, equipping] = useActionState(equipItemAction, initial);
  const notified = useRef(false);

  const Icon = SHOP_ITEM_ICONS[item.slug] ?? SHOP_CATEGORY_ICONS[item.category];
  const themeId =
    item.category === "THEME" && typeof item.metadata?.themeId === "string"
      ? item.metadata.themeId
      : null;

  useEffect(() => {
    if (equipState.success && item.category === "THEME" && !notified.current) {
      notified.current = true;
      notifyThemeEquipped(themeId ?? "default");
    }
    if (!equipState.success) notified.current = false;
  }, [equipState.success, item.category, themeId]);
  const rarity = item.metadata?.rarity as keyof typeof RARITY_LABELS | undefined;
  const isFreePremium = item.isPremiumOnly && isPremium;
  const canAfford = isFreePremium || item.cost <= userCoins;
  const error = purchaseState.error || equipState.error;

  const isOwned = ownershipStatus === "owned_permanent" || ownershipStatus === "active_temporary";
  const canBuy =
    ownershipStatus === "available" ||
    ownershipStatus === "expired_temporary" ||
    (!item.isPermanent && ownershipStatus === "active_temporary");

  const isEquippable = ["TITLE", "AVATAR_BORDER", "THEME", "COSMETIC", "BADGE", "FRAME", "EMOJI_PACK", "PROFILE_BACKGROUND"].includes(item.category);

  const durationLabel = item.metadata?.durationDays
    ? `${item.metadata.durationDays} dias`
    : item.metadata?.durationHours
      ? `${item.metadata.durationHours}h`
      : null;

  const boosterAffects =
    item.category === "BOOSTER"
      ? item.metadata?.affects?.includes("xp") && !item.metadata?.affects?.includes("coins")
        ? "2x XP"
        : "2x moedas + XP"
      : null;

  return (
    <Card
      className={`flex h-full max-w-full flex-col p-4 sm:p-5 ${
        isOwned ? "border-emerald-400/25" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {item.category === "THEME" ? (
          <ThemeSwatch icon={Icon} themeId={themeId} size="sm" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[hsl(var(--sidebar-highlight)/0.1)] hx-accent-soft">
            <Icon aria-hidden className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={item.isPremiumOnly ? "violet" : "default"}>
            {STORE_CATEGORY_LABELS[item.category]}
          </Badge>
          <Badge variant={OWNERSHIP_BADGE_VARIANT[ownershipStatus]}>
            {SHOP_OWNERSHIP_LABELS[ownershipStatus]}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold hx-text-title">{item.name}</h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            item.isPermanent
              ? "border-[hsl(var(--sidebar-highlight)/0.25)] bg-[hsl(var(--sidebar-highlight)/0.1)] text-[hsl(var(--sidebar-highlight)/0.9)]"
              : "border-amber-500/30 bg-amber-500/10 text-amber-800"
          }`}
        >
          {item.isPermanent ? "Permanente" : "Temporário"}
        </span>
        {rarity && (
          <span className="rounded-full border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/0.45)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide hx-text-muted">
            {RARITY_LABELS[rarity] ?? rarity}
          </span>
        )}
        {boosterAffects && (
          <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold hx-text-body">
            {boosterAffects}
          </span>
        )}
        {durationLabel && (
          <span className="hx-surface-chip rounded-full px-2 py-0.5 text-[10px] font-bold">
            {durationLabel}
          </span>
        )}
      </div>

      <p className="mt-2 flex-1 text-sm leading-6 hx-text-muted">{item.description}</p>

      {ownershipStatus === "active_temporary" && expiresAt && (
        <p className="mt-2 text-xs hx-text-body">Válido até {formatExpirationDate(expiresAt)}</p>
      )}
      {ownershipStatus === "expired_temporary" && (
        <p className="mt-2 text-xs hx-text-body">Expirado — você pode renovar a compra.</p>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-[hsl(var(--sidebar-border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
        {item.isPremiumOnly ? (
          <span className="text-sm font-semibold hx-text-body">
            {isPremium ? "Grátis para Premium" : "Exclusivo Premium"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold hx-text-body">
            <Coins className="h-4 w-4" />
            {item.cost.toLocaleString("pt-BR")}
          </span>
        )}

        <div className="w-full sm:w-auto sm:shrink-0">
        {isOwned && item.category === "REVIEW_PACK" && ownershipStatus === "active_temporary" ? (
          <LinkButton href={`/pacotes-revisao/${item.slug}`} className="min-h-11 w-full sm:w-auto">
            Acessar pacote
          </LinkButton>
        ) : isOwned && item.category === "BOOSTER" ? (
          <span className="text-sm font-semibold hx-text-body">
            {ownershipStatus === "active_temporary" ? "Booster ativo" : "No inventário"}
          </span>
        ) : isOwned && item.category === "PASS" ? (
          <span className="text-sm font-semibold hx-text-body">
            {ownershipStatus === "active_temporary" ? "Passe ativo" : "Passe expirado"}
          </span>
        ) : isOwned && isEquippable ? (
          equipped ? (
            <Button variant="outline" disabled className="min-h-11 w-full sm:w-auto">
              Equipado
            </Button>
          ) : inventoryId ? (
            <form action={equip}>
              <input type="hidden" name="inventoryId" value={inventoryId} />
              <Button type="submit" disabled={equipping} className="min-h-11 w-full sm:w-auto">
                {equipping ? "Equipando..." : "Equipar"}
              </Button>
            </form>
          ) : null
        ) : canBuy ? (
          item.isPremiumOnly && !isPremium ? (
            <span className="text-xs hx-text-subtle">Assine o Premium</span>
          ) : (
            <form action={purchase}>
              <input type="hidden" name="storeItemId" value={item.id} />
              <Button type="submit" disabled={purchasing || !canAfford} className="min-h-11 w-full sm:w-auto">
                {purchasing
                  ? "Comprando..."
                  : ownershipStatus === "active_temporary" && !item.isPermanent
                    ? "Renovar"
                    : ownershipStatus === "expired_temporary"
                      ? "Renovar"
                      : "Comprar"}
              </Button>
            </form>
          )
        ) : (
          <span className="text-sm font-semibold hx-text-body">Adquirido</span>
        )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {canBuy && !item.isPremiumOnly && !canAfford && (
        <p className="mt-2 text-xs hx-text-body">Moedas insuficientes.</p>
      )}
    </Card>
  );
}

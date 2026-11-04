"use client";

import { useActionState } from "react";
import { SHOP_ITEM_ICONS } from "@/lib/shop-item-icons";
import { SHOP_CATEGORY_ICONS } from "@/lib/shop-ui";
import { equipItemAction, type ShopActionResult } from "@/app/actions/shop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STORE_CATEGORY_LABELS } from "@/lib/shop-catalog";
import { formatExpirationDate } from "@/lib/shop-item-utils";
import type { StoreItemCategory } from "@prisma/client";

type InventoryItem = {
  id: string;
  isEquipped: boolean;
  expiresAt: Date | string | null;
  storeItem: {
    id: string;
    name: string;
    description: string;
    category: StoreItemCategory;
    slug: string;
  };
};

type Props = {
  inventory: InventoryItem[];
};


const initial: ShopActionResult = { success: false };

function EquipRow({ item }: { item: InventoryItem }) {
  const [state, action, pending] = useActionState(equipItemAction, initial);
  const Icon = SHOP_ITEM_ICONS[item.storeItem.slug] ?? SHOP_CATEGORY_ICONS[item.storeItem.category];
  const expired = item.expiresAt ? new Date(item.expiresAt) <= new Date() : false;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        item.isEquipped ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{item.storeItem.name}</p>
            <Badge variant="default">{STORE_CATEGORY_LABELS[item.storeItem.category]}</Badge>
            {item.isEquipped && <Badge variant="emerald">Equipado</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-400">{item.storeItem.description}</p>
          {item.expiresAt && (
            <p className="mt-1 text-xs text-violet-200">
              Válido até {formatExpirationDate(item.expiresAt)}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {item.isEquipped ? (
          <Button variant="outline" disabled className="min-h-11 w-full sm:w-auto">
            Em uso
          </Button>
        ) : expired ? (
          <p className="text-sm text-amber-300">Expirado — renove na loja.</p>
        ) : (
          <form action={action}>
            <input type="hidden" name="inventoryId" value={item.id} />
            <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
              {pending ? "Equipando..." : "Equipar"}
            </Button>
          </form>
        )}
        {state.error && <p className="mt-2 text-xs text-red-300">{state.error}</p>}
        {state.success && <p className="mt-2 text-xs text-emerald-300">Equipado com sucesso!</p>}
      </div>
    </div>
  );
}

export function CosmeticsInventoryPanel({ inventory }: Props) {
  const EQUIPPABLE: StoreItemCategory[] = [
    "TITLE", "AVATAR_BORDER", "THEME", "COSMETIC",
    "BADGE", "FRAME", "EMOJI_PACK", "PROFILE_BACKGROUND",
  ];
  const equippable = inventory.filter((entry) =>
    EQUIPPABLE.includes(entry.storeItem.category),
  );

  if (equippable.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
        <p className="font-semibold text-slate-200">Nenhum cosmético no inventário</p>
        <p className="mt-2 text-sm text-slate-500">
          Visite a loja para comprar títulos, molduras, temas, ícones, distintivos, emojis e fundos.
        </p>
      </div>
    );
  }

  const grouped = {
    THEME: equippable.filter((i) => i.storeItem.category === "THEME"),
    AVATAR_BORDER: equippable.filter((i) => i.storeItem.category === "AVATAR_BORDER"),
    TITLE: equippable.filter((i) => i.storeItem.category === "TITLE"),
    COSMETIC: equippable.filter((i) => i.storeItem.category === "COSMETIC"),
    BADGE: equippable.filter((i) => i.storeItem.category === "BADGE"),
    FRAME: equippable.filter((i) => i.storeItem.category === "FRAME"),
    EMOJI_PACK: equippable.filter((i) => i.storeItem.category === "EMOJI_PACK"),
    PROFILE_BACKGROUND: equippable.filter((i) => i.storeItem.category === "PROFILE_BACKGROUND"),
  };

  return (
    <div className="space-y-8">
      {(
        [
          ["THEME", "Temas"],
          ["AVATAR_BORDER", "Molduras de avatar"],
          ["TITLE", "Títulos"],
          ["COSMETIC", "Ícones e cosméticos"],
          ["BADGE", "Distintivos"],
          ["FRAME", "Molduras decorativas"],
          ["PROFILE_BACKGROUND", "Fundos de perfil"],
          ["EMOJI_PACK", "Pacotes de emoji"],
        ] as const
      ).map(([key, label]) =>
        grouped[key].length > 0 ? (
          <section key={key}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">{label}</h2>
            <div className="space-y-3">
              {grouped[key].map((item) => (
                <EquipRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}

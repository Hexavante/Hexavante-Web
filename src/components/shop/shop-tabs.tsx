"use client";

import { useMemo, useState } from "react";
import { BookOpen, Crown, Gem, Palette, Sparkles, Ticket, Zap } from "lucide-react";
import { ShopFairPlayNotice } from "@/components/shop/shop-fair-play-notice";
import { ShopItemCard } from "@/components/shop/shop-item-card";
import { PremiumPanel } from "@/components/shop/premium-panel";
import { SHOP_TAB_CATEGORIES } from "@/lib/shop-catalog";
import { PERSONALIZE_SECTIONS, SHOP_CATEGORY_ICONS } from "@/lib/shop-ui";
import type { PremiumStatus } from "@/lib/premium";
import type { ShopItemView } from "@/services/shop.service";
import type { StoreItemCategory } from "@prisma/client";

type InventoryEntry = {
  id: string;
  storeItemId: string;
  isEquipped: boolean;
  expiresAt: Date | string | null;
};

type TabId = keyof typeof SHOP_TAB_CATEGORIES;

type Props = {
  items: ShopItemView[];
  inventory: InventoryEntry[];
  coins: number;
  premium: PremiumStatus | null;
  coinMultiplier: number;
  activeBooster: boolean;
};

const TABS: { id: TabId; label: string; icon: typeof Palette }[] = [
  { id: "personalize", label: "Personalizar", icon: Palette },
  { id: "boosters", label: "Boosters", icon: Zap },
  { id: "passes", label: "Passes", icon: Ticket },
  { id: "review_packs", label: "Pacotes", icon: BookOpen },
  { id: "premium", label: "Premium", icon: Crown },
];

const TAB_DESCRIPTIONS: Partial<Record<TabId, string>> = {
  personalize: "Temas, molduras, títulos e ícones — equipáveis no inventário.",
  boosters: "Multiplicadores temporários de XP e moedas.",
  passes: "Acesso antecipado a simulados exclusivos.",
  review_packs: "Questões selecionadas para revisão focada.",
};

function searchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function ShopTabs({
  items,
  inventory,
  coins,
  premium,
  coinMultiplier,
  activeBooster,
}: Props) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("personalize");
  const [categoryFilter, setCategoryFilter] = useState<StoreItemCategory | "all">("all");

  const inventoryByItem = useMemo(
    () => new Map(inventory.map((entry) => [entry.storeItemId, entry])),
    [inventory],
  );

  const personalizeCategories = SHOP_TAB_CATEGORIES.personalize as StoreItemCategory[];

  const filteredItems = useMemo(() => {
    const categories = SHOP_TAB_CATEGORIES[tab];
    if (categories === "premium") return [];

    let list = items.filter((item) => categories.includes(item.category) && !item.isPremiumOnly);

    if (tab === "personalize" && categoryFilter !== "all") {
      list = list.filter((item) => item.category === categoryFilter);
    }

    const term = searchText(query);
    return term ? list.filter(item => searchText(item.name + " " + item.description).includes(term)) : list;
  }, [categoryFilter, items, tab, query]);

  const ownedInTab = filteredItems.filter(
    (item) => item.ownershipStatus === "owned_permanent" || item.ownershipStatus === "active_temporary",
  ).length;

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((entry) => {
          const Icon = entry.icon;
          const active = tab === entry.id;
          return (
            <button
              aria-pressed={active}
              key={entry.id}
              type="button"
              onClick={() => {
                setTab(entry.id);
                setQuery("");
                setCategoryFilter("all");
              }}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hx-filter-pill ${
                active ? "hx-filter-pill-active" : "hx-filter-pill-inactive"
              }`}
            >
              <Icon className="h-4 w-4" />
              {entry.label}
            </button>
          );
        })}
      </div>

      {TAB_DESCRIPTIONS[tab] && (
        <p className="mt-3 text-sm hx-text-muted">{TAB_DESCRIPTIONS[tab]}</p>
      )}

      {tab !== "premium" && <label className="mt-4 block text-sm font-medium hx-text-body">
        Buscar nesta aba
        <input type="search" className="hx-input mt-1 w-full" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome ou descrição do item" />
      </label>}
      <div className="mt-4 flex flex-wrap gap-3 text-sm hx-text-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 font-medium hx-text-body">
          <Gem className="h-4 w-4" />
          Saldo: {coins.toLocaleString("pt-BR")} moedas
        </span>
        {tab !== "premium" && (
          <span className="hx-surface-chip rounded-full px-3 py-1">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}
            {ownedInTab > 0 ? ` · ${ownedInTab} adquiridos` : ""}
          </span>
        )}
        {coinMultiplier > 1 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-medium hx-text-body">
            <Sparkles className="h-4 w-4" />
            Multiplicador ativo: x{coinMultiplier}
          </span>
        )}
        {activeBooster && (
          <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 hx-text-body">
            Booster ativo
          </span>
        )}
      </div>

      {tab === "personalize" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
            label="Todos"
          />
          {personalizeCategories.map((category) => (
            <FilterChip
              key={category}
              active={categoryFilter === category}
              onClick={() => setCategoryFilter(category)}
              label={categoryLabelShort(category)}
            />
          ))}
        </div>
      )}

      {(tab === "boosters" || tab === "passes") && (
        <div className="mt-4">
          <ShopFairPlayNotice prominent={tab === "boosters"} />
        </div>
      )}

      {tab === "premium" ? (
        <div className="mt-6">
          <PremiumPanel
            premium={premium}
            premiumItems={items.filter((i) => i.isPremiumOnly)}
            inventory={inventory}
            coins={coins}
          />
        </div>
      ) : tab === "personalize" && categoryFilter === "all" && filteredItems.length > 0 ? (
        <div className="mt-6 space-y-8">
          {PERSONALIZE_SECTIONS.map((section) => {
            const sectionItems = filteredItems.filter((item) => item.category === section.category);
            if (sectionItems.length === 0) return null;

            const SectionIcon = SHOP_CATEGORY_ICONS[section.category];

            return (
              <section key={section.category}>
                <div className="mb-4 flex items-start gap-3">
                  <span className="hx-icon-box h-10 w-10 shrink-0">
                    <SectionIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold hx-text-title">{section.label}</h2>
                    <p className="mt-0.5 text-sm hx-text-muted">{section.description}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {sectionItems.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={toCardItem(item)}
                      ownershipStatus={item.ownershipStatus}
                      equipped={inventoryByItem.get(item.id)?.isEquipped ?? item.isEquipped}
                      inventoryId={inventoryByItem.get(item.id)?.id ?? item.inventoryId}
                      expiresAt={inventoryByItem.get(item.id)?.expiresAt ?? item.expiresAt}
                      userCoins={coins}
                      isPremium={premium?.isActive ?? false}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filteredItems.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
              <p className="font-semibold hx-text-body">{query.trim() ? "Nenhum item corresponde à busca." : "Nenhum item nesta categoria."}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const entry = inventoryByItem.get(item.id);
              return (
                <ShopItemCard
                  key={item.id}
                  item={toCardItem(item)}
                  ownershipStatus={item.ownershipStatus}
                  equipped={entry?.isEquipped ?? item.isEquipped}
                  inventoryId={entry?.id ?? item.inventoryId}
                  expiresAt={entry?.expiresAt ?? item.expiresAt}
                  userCoins={coins}
                  isPremium={premium?.isActive ?? false}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hx-filter-pill ${
        active ? "hx-filter-pill-active" : "hx-filter-pill-inactive"
      }`}
    >
      {label}
    </button>
  );
}

function categoryLabelShort(category: StoreItemCategory): string {
  const labels: Partial<Record<StoreItemCategory, string>> = {
    TITLE: "Títulos",
    AVATAR_BORDER: "Bordas de avatar",
    THEME: "Temas",
    COSMETIC: "Ícones",
    BADGE: "Distintivos",
    FRAME: "Molduras decorativas",
    EMOJI_PACK: "Emojis",
    PROFILE_BACKGROUND: "Fundos",
  };
  return labels[category] ?? category;
}

function toCardItem(item: ShopItemView) {
  const metadata =
    item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    cost: item.cost,
    category: item.category as StoreItemCategory,
    isPremiumOnly: item.isPremiumOnly,
    isPermanent: item.isPermanent,
    metadata,
  };
}

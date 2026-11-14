import {
  Award,
  BookOpen,
  Crown,
  Frame,
  Image as ImageIcon,
  Palette,
  Smile,
  Sparkles,
  Tag,
  Ticket,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { StoreItemCategory } from "@prisma/client";
import { STORE_CATEGORY_LABELS } from "@/lib/shop-catalog";

export const SHOP_CATEGORY_ICONS: Record<StoreItemCategory, LucideIcon> = {
  TITLE: Tag,
  AVATAR_BORDER: Crown,
  THEME: Palette,
  COSMETIC: Sparkles,
  BOOSTER: Zap,
  PASS: Ticket,
  REVIEW_PACK: BookOpen,
  PET: Sparkles,
  PET_COSMETIC: Sparkles,
  BADGE: Award,
  FRAME: Frame,
  EMOJI_PACK: Smile,
  PROFILE_BACKGROUND: ImageIcon,
};

export const PERSONALIZE_SECTIONS: {
  category: StoreItemCategory;
  label: string;
  description: string;
}[] = [
  {
    category: "THEME",
    label: "Temas",
    description: "Mude cores da interface e da sidebar em todo o app.",
  },
  {
    category: "AVATAR_BORDER",
    label: "Molduras de avatar",
    description: "Destaque seu perfil com bordas exclusivas.",
  },
  {
    category: "TITLE",
    label: "Títulos",
    description: "Textos exibidos no seu perfil público.",
  },
  {
    category: "COSMETIC",
    label: "Ícones e cosméticos",
    description: "Adesivos e ícones para personalizar o perfil.",
  },
  {
    category: "BADGE",
    label: "Distintivos",
    description: "Distintivos exibidos no seu perfil público.",
  },
  {
    category: "FRAME",
    label: "Molduras decorativas",
    description: "Molduras decorativas para emoldurar o perfil.",
  },
  {
    category: "PROFILE_BACKGROUND",
    label: "Fundos de perfil",
    description: "Fundos personalizados para a página de perfil.",
  },
];

export const INVENTORY_SECTION_ORDER: { key: StoreItemCategory; label: string }[] = [
  { key: "THEME", label: STORE_CATEGORY_LABELS.THEME },
  { key: "AVATAR_BORDER", label: "Molduras de avatar" },
  { key: "TITLE", label: STORE_CATEGORY_LABELS.TITLE },
  { key: "COSMETIC", label: "Ícones e cosméticos" },
  { key: "BADGE", label: STORE_CATEGORY_LABELS.BADGE },
  { key: "FRAME", label: "Molduras decorativas" },
  { key: "PROFILE_BACKGROUND", label: STORE_CATEGORY_LABELS.PROFILE_BACKGROUND },
  { key: "BOOSTER", label: STORE_CATEGORY_LABELS.BOOSTER },
  { key: "PASS", label: STORE_CATEGORY_LABELS.PASS },
  { key: "REVIEW_PACK", label: STORE_CATEGORY_LABELS.REVIEW_PACK },
];

export type InventoryTabId = "all" | "cosmetics" | "boosters" | "access";

export const INVENTORY_TABS: {
  id: InventoryTabId;
  label: string;
  description: string;
  categories: StoreItemCategory[];
}[] = [
  {
    id: "all",
    label: "Todos",
    description: "Visão completa do inventário.",
    categories: [
      "THEME",
      "AVATAR_BORDER",
      "TITLE",
      "COSMETIC",
      "BADGE",
      "FRAME",
      "PROFILE_BACKGROUND",
      "BOOSTER",
      "PASS",
      "REVIEW_PACK",
    ],
  },
  {
    id: "cosmetics",
    label: "Cosméticos",
    description: "Temas, molduras, títulos, distintivos e mais.",
    categories: [
      "THEME",
      "AVATAR_BORDER",
      "TITLE",
      "COSMETIC",
      "BADGE",
      "FRAME",
      "PROFILE_BACKGROUND",
    ],
  },
  {
    id: "boosters",
    label: "Boosters",
    description: "Multiplicadores de XP e moedas.",
    categories: ["BOOSTER"],
  },
  {
    id: "access",
    label: "Acessos",
    description: "Passes e pacotes de revisão.",
    categories: ["PASS", "REVIEW_PACK"],
  },
];

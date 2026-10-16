export type PetRarity = "common" | "rare" | "legendary" | "premium";

export type PetDef = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  rarity: PetRarity;
};

export type PetAccessoryDef = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

export const PETS: Record<string, PetDef> = {
  "pet-owl": {
    id: "pet-owl",
    label: "Coruja Hex",
    emoji: "🦉",
    description: "Companheiro sábio para maratonas de estudo.",
    rarity: "common",
  },
  "pet-fox": {
    id: "pet-fox",
    label: "Raposa Astuta",
    emoji: "🦊",
    description: "Ágil e curiosa — ideal para quem gosta de desafios.",
    rarity: "rare",
  },
  "pet-dragon": {
    id: "pet-dragon",
    label: "Dragão Estudante",
    emoji: "🐉",
    description: "Lendário guardião da sua jornada de aprendizado.",
    rarity: "legendary",
  },
  "pet-bot": {
    id: "pet-bot",
    label: "Bot Hexavante",
    emoji: "🤖",
    description: "Assistente digital exclusivo para assinantes Premium.",
    rarity: "premium",
  },
};

export const PET_ACCESSORIES: Record<string, PetAccessoryDef> = {
  "acc-crown": {
    id: "acc-crown",
    label: "Coroa Real",
    emoji: "👑",
    description: "Coroa dourada para o seu pet.",
  },
  "acc-scarf": {
    id: "acc-scarf",
    label: "Lenço de Inverno",
    emoji: "🧣",
    description: "Aquece o visual do pet nos dias frios.",
  },
  "acc-glasses": {
    id: "acc-glasses",
    label: "Óculos Estudioso",
    emoji: "🤓",
    description: "Ar intelectual para quem leva estudo a sério.",
  },
};

export function resolvePet(petId: string | null | undefined): PetDef | null {
  if (!petId) return null;
  return PETS[petId] ?? null;
}

export function resolvePetAccessory(accessoryId: string | null | undefined): PetAccessoryDef | null {
  if (!accessoryId) return null;
  return PET_ACCESSORIES[accessoryId] ?? null;
}

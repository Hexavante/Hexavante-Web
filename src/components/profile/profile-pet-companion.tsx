import type { PetDef, PetAccessoryDef } from "@/lib/pets";

type Props = {
  pet: PetDef | null;
  accessory?: PetAccessoryDef | null;
  size?: "sm" | "md";
  className?: string;
};

export function ProfilePetCompanion({ pet, accessory, size = "md", className = "" }: Props) {
  if (!pet) return null;

  const boxSize = size === "sm" ? "h-12 w-12 text-2xl" : "h-16 w-16 text-3xl";

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-violet-500/10 shadow-lg shadow-black/20 ${boxSize} ${className}`}
      title={pet.label}
      aria-label={`Pet: ${pet.label}`}
    >
      <span className="leading-none" aria-hidden>
        {pet.emoji}
      </span>
      {accessory && (
        <span
          className="absolute -right-1 -top-1 text-base drop-shadow"
          title={accessory.label}
          aria-hidden
        >
          {accessory.emoji}
        </span>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleLessonFavoriteAction } from "@/app/actions/lesson-learning";
import { useToast } from "@/components/ui/toast";

type Props = {
  courseSlug: string;
  lessonId: string;
  initialFavorite: boolean;
};

export function LessonFavoriteButton({ courseSlug, lessonId, initialFavorite }: Props) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleLessonFavoriteAction(courseSlug, lessonId);
          if (result.success && result.isFavorite != null) {
            setIsFavorite(result.isFavorite);
            toast(
              result.isFavorite ? "Aula adicionada aos favoritos." : "Aula removida dos favoritos.",
              "success",
            );
          } else if (result.error) {
            toast(result.error, "error");
          }
        });
      }}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
        isFavorite
          ? "border-amber-400/35 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15"
          : "border-white/15 bg-white/[0.03] text-slate-300 hover:border-amber-400/25 hover:text-amber-200"
      }`}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remover dos favoritos" : "Marcar como favorita"}
    >
      <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-300 text-amber-300" : ""}`} />
      {isFavorite ? "Favorita" : "Favoritar aula"}
    </button>
  );
}

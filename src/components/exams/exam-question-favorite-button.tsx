"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleExamQuestionFavoriteAction } from "@/app/actions/exam-learning";
import { useToast } from "@/components/ui/toast";

type Props = {
  examSlug: string;
  questionId: string;
  attemptId?: string;
  initialFavorite: boolean;
  compact?: boolean;
};

export function ExamQuestionFavoriteButton({
  examSlug,
  questionId,
  attemptId,
  initialFavorite,
  compact = false,
}: Props) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleExamQuestionFavoriteAction(examSlug, questionId, attemptId);
          if (result.success && result.isFavorite != null) {
            setIsFavorite(result.isFavorite);
            toast(
              result.isFavorite
                ? "Questão adicionada aos favoritos."
                : "Questão removida dos favoritos.",
              "success",
            );
          } else if (result.error) {
            toast(result.error, "error");
          }
        });
      }}
      className={
        compact
          ? `inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              isFavorite
                ? "border-amber-400/35 bg-amber-400/10 text-amber-200"
                : "border-white/15 bg-white/[0.03] text-slate-400 hover:border-amber-400/25 hover:text-amber-200"
            }`
          : `inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
              isFavorite
                ? "border-amber-400/35 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15"
                : "border-white/15 bg-white/[0.03] text-slate-300 hover:border-amber-400/25 hover:text-amber-200"
            }`
      }
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remover dos favoritos" : "Marcar como favorita"}
    >
      <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-300 text-amber-300" : ""}`} />
      {!compact && (isFavorite ? "Favorita" : "Favoritar")}
    </button>
  );
}

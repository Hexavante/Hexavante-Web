"use client";

import { AlertTriangle } from "lucide-react";
import { getContentPolicyHint } from "@/lib/profanity-filter";
import { cn } from "@/lib/cn";

type Props = {
  text: string;
  className?: string;
};

export function ContentPolicyHint({ text, className }: Props) {
  const hint = getContentPolicyHint(text);
  if (!hint) return null;

  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800",
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {hint}
    </p>
  );
}

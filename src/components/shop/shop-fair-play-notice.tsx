"use client";

import { ShieldCheck } from "lucide-react";
import { SHOP_FAIR_PLAY_NOTE } from "@/lib/shop-catalog";

type Props = {
  prominent?: boolean;
};

export function ShopFairPlayNotice({ prominent = false }: Props) {
  return (
    <div
      className={
        prominent
          ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
          : "hx-panel !p-3"
      }
    >
      <div className="flex gap-3">
        <ShieldCheck
          className={`mt-0.5 shrink-0 hx-accent-text ${prominent ? "h-5 w-5" : "h-4 w-4"}`}
        />
        <div>
          <p className={`font-semibold hx-text-body ${prominent ? "" : "text-sm"}`}>
            Fair play educacional
          </p>
          <p className={`mt-1 leading-6 hx-text-muted ${prominent ? "text-sm" : "text-xs"}`}>
            {SHOP_FAIR_PLAY_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}

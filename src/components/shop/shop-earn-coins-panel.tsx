"use client";

import { Coins } from "lucide-react";
import { SHOP_EARN_COINS_HINTS } from "@/lib/shop-catalog";

export function ShopEarnCoinsPanel() {
  return (
    <section className="hx-panel !p-4">
      <div className="flex items-center gap-2 text-sm font-semibold hx-text-body">
        <Coins className="h-4 w-4 text-amber-600" />
        Como ganhar moedas
      </div>
      <ul className="mt-3 space-y-2">
        {SHOP_EARN_COINS_HINTS.map((hint) => (
          <li key={hint.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="hx-text-muted">{hint.label}</span>
            <span className="shrink-0 font-semibold text-amber-700">
              {typeof hint.amount === "number" ? `+${hint.amount}` : hint.amount}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

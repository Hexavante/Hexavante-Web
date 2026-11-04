import Link from "next/link";
import { History } from "lucide-react";
import { COIN_SOURCE_LABELS } from "@/lib/gamification";
import type { CoinTransaction } from "@prisma/client";

type Props = {
  transactions: CoinTransaction[];
};

export function ShopCoinHistory({ transactions }: Props) {
  return (
    <section className="hx-panel !p-4">
      <div className="flex items-center gap-2 text-sm font-semibold hx-text-body">
        <History className="h-4 w-4 hx-accent-text" />
        Histórico recente
      </div>

      {transactions.length === 0 ? (
        <p className="mt-3 text-sm hx-text-muted">Nenhuma transação ainda.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm hx-text-body">
                  {tx.description ?? COIN_SOURCE_LABELS[tx.source] ?? tx.source}
                </p>
                <p className="text-xs hx-text-subtle">
                  {tx.createdAt.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-bold ${tx.type === "SPEND" ? "text-rose-300" : "text-emerald-300"}`}
              >
                {tx.amount !== 0 && (tx.type === "SPEND" ? "−" : "+")}
                {Math.abs(tx.amount).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/inventario" className="mt-3 inline-block text-xs font-medium hx-accent-link hover:underline">
        Ver inventário completo
      </Link>
    </section>
  );
}

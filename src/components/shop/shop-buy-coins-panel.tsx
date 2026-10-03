"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, Loader2, RefreshCcw, ShoppingBag } from "lucide-react";
import { createCheckoutAction, loadPaymentsCatalogAction } from "@/app/actions/payments";
import { redirectOnUnauthorized } from "@/lib/client-auth";
import { formatBrl, formatCoins, type PaymentPack } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type CatalogState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; packs: PaymentPack[] };

/**
 * Seção "Comprar moedas" da loja: lê os packs do catálogo da API
 * (preços nunca hardcoded) e redireciona pro checkout do Mercado Pago.
 */
export function ShopBuyCoinsPanel() {
  const [catalog, setCatalog] = useState<CatalogState>({ phase: "loading" });
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setCatalog({ phase: "loading" });
    setActionError(null);

    const result = await loadPaymentsCatalogAction();
    if (!result.success) {
      if (result.code === "unauthorized") {
        redirectOnUnauthorized();
        return;
      }
      setCatalog({ phase: "error", message: result.error });
      return;
    }
    setCatalog({ phase: "ready", packs: result.catalog.packs });
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  async function handleBuy(pack: PaymentPack) {
    if (buyingId) return;
    setBuyingId(pack.id);
    setActionError(null);

    const result = await createCheckoutAction(pack.id);
    if (result.success) {
      window.location.href = result.checkoutUrl;
      return;
    }

    setBuyingId(null);
    if (result.code === "unauthorized") {
      redirectOnUnauthorized();
      return;
    }
    setActionError(result.error);
  }

  return (
    <section className="hx-card p-5" aria-labelledby="comprar-moedas-title">
      <div className="flex items-start gap-3">
        <div className="hx-icon-box">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h2
            id="comprar-moedas-title"
            className="text-lg font-bold hx-text-title"
          >
            Comprar moedas
          </h2>
          <p className="mt-1 text-sm hx-text-muted">
            Pagamento seguro via Mercado Pago — assim que o pagamento é aprovado,
            as moedas entram na sua conta.
          </p>
        </div>
      </div>

      {catalog.phase === "loading" && (
        <div
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-live="polite"
        >
          {[0, 1, 2].map((index) => (
            <div key={index} className="hx-surface-panel rounded-xl p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-3 h-4 w-20" />
              <Skeleton className="mt-4 h-9 w-full" />
            </div>
          ))}
        </div>
      )}

      {catalog.phase === "error" && (
        <div className="mt-5 hx-empty">
          <p className="text-sm hx-text-body">{catalog.message}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void loadCatalog()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {catalog.phase === "ready" &&
        (catalog.packs.length === 0 ? (
          <div className="mt-5 hx-empty">
            <p className="text-sm hx-text-body">
              Nenhum pacote disponível no momento.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.packs.map((pack) => {
              const buying = buyingId === pack.id;
              return (
                <div
                  key={pack.id}
                  className="hx-surface-panel flex flex-col rounded-xl p-4"
                >
                  <span className="text-sm font-semibold hx-text-title">
                    {pack.label}
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-2xl font-black text-amber-600">
                    <Coins className="h-5 w-5 shrink-0" />
                    {formatCoins(pack.coins)}
                  </span>
                  <span className="mt-1 text-sm hx-text-muted">
                    {formatBrl(pack.priceBrl)}
                  </span>
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    disabled={buyingId !== null}
                    onClick={() => void handleBuy(pack)}
                  >
                    {buying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecionando...
                      </>
                    ) : (
                      "Comprar"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        ))}

      {actionError && (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {actionError}
        </p>
      )}
    </section>
  );
}

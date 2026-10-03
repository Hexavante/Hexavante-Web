"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createCheckoutAction } from "@/app/actions/payments";
import { redirectOnUnauthorized } from "@/lib/client-auth";
import { formatLongDate, PREMIUM_PRODUCT_ID } from "@/lib/payments";

type Props = {
  isLoggedIn: boolean;
  isPremiumActive: boolean;
  premiumExpiresAt: string | null;
};

const CTA_CLASSES =
  "hx-hero-btn relative block w-full rounded-lg bg-amber-500 py-3 text-center text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";

/**
 * CTA "Assinar Hexa": checkout real via Mercado Pago (productId hexa_premium).
 * Sem login → /register com callback de volta; premium ativo → estado fixo.
 */
export function HexaCheckoutCta({
  isLoggedIn,
  isPremiumActive,
  premiumExpiresAt,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    if (pending) return;
    setPending(true);
    setError(null);

    const result = await createCheckoutAction(PREMIUM_PRODUCT_ID);
    if (result.success) {
      window.location.href = result.checkoutUrl;
      return;
    }

    setPending(false);
    if (result.code === "unauthorized") {
      redirectOnUnauthorized();
      return;
    }
    setError(result.error);
  }

  if (isPremiumActive) {
    const expiresAt = formatLongDate(premiumExpiresAt);
    return (
      <div className="w-full rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-4 text-center">
        <p className="flex items-center justify-center gap-2 text-sm font-bold text-amber-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Você já é Premium ✓
        </p>
        <p className="mt-1 text-xs text-[hsl(var(--sidebar-foreground)/0.6)]">
          {expiresAt ? `Ativo até ${expiresAt}` : "Assinatura ativa"}
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <a
        href="/register?callbackUrl=%2Fhexa"
        className={CTA_CLASSES}
        style={{ boxShadow: "0 8px 24px rgb(245 158 11 / 0.3)" }}
      >
        Começar com Hexa
      </a>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleSubscribe()}
        disabled={pending}
        className={CTA_CLASSES}
        style={{ boxShadow: "0 8px 24px rgb(245 158 11 / 0.3)" }}
      >
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecionando...
          </span>
        ) : (
          "Assinar Hexa"
        )}
      </button>
      {error && (
        <p className="mt-3 text-center text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

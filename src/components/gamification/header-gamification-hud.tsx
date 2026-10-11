import Link from "next/link";
import { Coins } from "lucide-react";
import { BoosterIndicator } from "@/components/gamification/booster-indicator";
import { CoinExplosion } from "@/components/gamification/coin-explosion";
import { getUserXpProfile } from "@/services/xp.service";
import { getUserCoinProfile, getUserWallet } from "@/services/wallet.service";

type Props = {
  userId: string;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatInt(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("pt-BR");
}

/**
 * Abreviação pt-BR para valores gigantes no cabeçalho.
 * <100 mil: número completo ("12.345"). >=100 mil: "123,4K",
 * >=1 mi: "999,9M" (truncado, nunca arredonda para "1.000,0M"),
 * >=1 bi: "1,00B". O valor completo vai sempre no `title` + aria.
 */
export function formatCompactPtBr(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value);
  const abs = Math.abs(rounded);
  if (abs < 100_000) return rounded.toLocaleString("pt-BR");
  if (abs < 1_000_000) {
    const truncated = Math.floor(abs / 100) / 10;
    const sign = rounded < 0 ? "-" : "";
    return `${sign}${truncated.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}K`;
  }
  if (abs < 1_000_000_000) {
    const truncated = Math.floor(abs / 100_000) / 10;
    const sign = rounded < 0 ? "-" : "";
    return `${sign}${truncated.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}M`;
  }
  const truncated = Math.floor(abs / 10_000_000) / 100;
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${truncated.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}B`;
}

export async function HeaderGamificationHud({ userId }: Props) {
  const [coinResult, xpRaw] = await Promise.all([
    loadCoins(userId),
    getUserXpProfile(userId).catch(() => null),
  ]);

  const xpProfile = xpRaw
    ? { ...xpRaw, progressPercent: clampPercent(xpRaw.progressPercent) }
    : null;
  const xpCountFull = xpProfile
    ? `${formatInt(xpProfile.currentXp)}/${formatInt(xpProfile.xpToNextLevel)} XP`
    : null;
  const xpCountVisual = xpProfile
    ? `${formatCompactPtBr(xpProfile.currentXp)}/${formatCompactPtBr(xpProfile.xpToNextLevel)} XP`
    : null;

  return (
    <div className="hx-header-hud">
      {coinResult.booster ? (
        <BoosterIndicator
          multiplier={coinResult.booster.multiplier}
          expiresAt={coinResult.booster.expiresAt}
        />
      ) : null}

      {coinResult.failed ? (
        <Link href="/shop" className="hx-header-hud-coins hx-header-hud-coins--error" title="Saldo indisponível">
          <Coins className="hx-header-hud-coins-icon" aria-hidden />
          <span>—</span>
        </Link>
      ) : (
        <CoinExplosion>
          <Link
            href="/shop"
            className="hx-header-hud-coins"
            title={`${coinResult.coins.toLocaleString("pt-BR")} moedas — ir para a loja`}
          >
            <Coins className="hx-header-hud-coins-icon" aria-hidden />
            <span className="hx-header-hud-coins-value">
              {coinResult.coins.toLocaleString("pt-BR")}
            </span>
          </Link>
        </CoinExplosion>
      )}

      {xpProfile && xpCountFull && xpCountVisual ? (
        <Link
          href="/perfil"
          className="hx-header-hud-xp"
          title={`Nível ${xpProfile.level} — ${xpCountFull} (${xpProfile.progressPercent}%)`}
        >
          {/* Linha 1: nível truncado à esquerda + % fixo à direita. */}
          <div className="hx-header-hud-xp-row hx-header-hud-xp-row--top">
            <span className="hx-header-hud-xp-level">
              <span className="hx-header-hud-xp-level-full">Nível {formatInt(xpProfile.level)}</span>
              <span className="hx-header-hud-xp-level-short">Nv. {formatInt(xpProfile.level)}</span>
            </span>
            <span
              className="hx-header-hud-xp-percent hidden min-[420px]:inline"
              aria-hidden="true"
            >
              {xpProfile.progressPercent}%
            </span>
          </div>
          {/* Linha 2: contagem full-width truncada (oculta no compacto <420px). */}
          <div className="hx-header-hud-xp-count-row">
            <span className="hx-header-hud-xp-count" title={xpCountFull}>
              {xpCountVisual}
            </span>
          </div>
          {/* Linha 3: trilho da barra em linha própria — nunca sobrepõe texto. */}
          <div
            className="hx-progress-track hx-header-hud-xp-track"
            role="progressbar"
            aria-valuenow={xpProfile.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Nível ${xpProfile.level}, ${xpProfile.progressPercent}% para o próximo nível`}
          >
            <div
              className="hx-progress-fill hx-header-hud-xp-fill"
              style={{ width: `${xpProfile.progressPercent}%` }}
            />
          </div>
        </Link>
      ) : (
        <Link href="/perfil" className="hx-header-hud-xp hx-header-hud-xp--error" title="XP indisponível">
          XP —
        </Link>
      )}
    </div>
  );
}

async function loadCoins(userId: string) {
  try {
    const profile = await getUserCoinProfile(userId);
    return {
      failed: false as const,
      coins: profile.coins,
      booster:
        profile.boosterMultiplier > 1 && profile.boosterExpiresAt
          ? {
              multiplier: profile.boosterMultiplier,
              expiresAt: profile.boosterExpiresAt.toISOString(),
            }
          : null,
    };
  } catch {
    try {
      const wallet = await getUserWallet(userId);
      return { failed: false as const, coins: wallet.coins, booster: null };
    } catch {
      return { failed: true as const, coins: 0, booster: null };
    }
  }
}

type Props = {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  compact?: boolean;
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
 * Abreviação pt-BR para valores gigantes (mesma regra do HUD do header).
 * O valor completo vai sempre no `title` + aria-label.
 */
function formatCompactPtBr(value: number): string {
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

export function XpProgressBar({
  level,
  currentXp,
  xpToNextLevel,
  progressPercent,
  compact = false,
}: Props) {
  const percent = clampPercent(progressPercent);
  const countFull = `${formatInt(currentXp)}/${formatInt(xpToNextLevel)} XP`;
  const countFullSpaced = `${formatInt(currentXp)} / ${formatInt(xpToNextLevel)} XP`;
  const countVisual = `${formatCompactPtBr(currentXp)}/${formatCompactPtBr(xpToNextLevel)} XP`;
  const countVisualSpaced = `${formatCompactPtBr(currentXp)} / ${formatCompactPtBr(xpToNextLevel)} XP`;
  const levelLabel = `Nível ${formatInt(level)}`;
  const levelFull = `Nível ${level}`;

  if (compact) {
    return (
      <div className="flex w-full min-w-0 max-w-full flex-col gap-1.5 overflow-hidden" title={`${levelFull} — ${countFull} (${percent}%)`}>
        <div className="flex min-w-0 max-w-full items-center justify-between gap-2 text-xs">
          <span
            className="min-w-0 max-w-[45%] flex-none truncate font-semibold hx-accent-text"
            title={levelFull}
          >
            {levelLabel}
          </span>
          <span
            className="min-w-0 max-w-full flex-1 truncate text-right tabular-nums text-[hsl(var(--sidebar-foreground)/0.72)]"
            title={countFull}
          >
            {countVisual}
          </span>
        </div>
        <div
          className="hx-progress-track h-2 relative w-full min-w-0 max-w-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${levelFull}, ${percent}% para o próximo nível`}
        >
          <div className="hx-progress-fill max-w-full" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden" title={`${levelFull} — ${countFullSpaced} (${percent}%)`}>
      <div className="mb-2 flex min-w-0 max-w-full items-center justify-between gap-2 text-sm">
        <span
          className="min-w-0 max-w-[45%] flex-none truncate text-lg font-bold hx-accent-text"
          title={levelFull}
        >
          {levelLabel}
        </span>
        <span
          className="min-w-0 max-w-full flex-1 truncate text-right tabular-nums text-[hsl(var(--sidebar-foreground)/0.72)]"
          title={countFullSpaced}
        >
          {countVisualSpaced}
        </span>
      </div>
      <div
        className="hx-progress-track h-4 relative w-full min-w-0 max-w-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${levelFull}, ${percent}% para o próximo nível`}
      >
        <div className="hx-progress-fill max-w-full" style={{ width: `${percent}%` }} />
        <div className="xp-neon-dot" aria-hidden="true" />
      </div>
      <p className="mt-2 truncate text-xs font-medium tabular-nums text-[hsl(var(--sidebar-foreground)/0.55)]">
        {percent}% para o próximo nível
      </p>
    </div>
  );
}

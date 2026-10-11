"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Award, BookOpen, Coins, Flame, Star, Target, Trophy, Users, X, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type AchievementToastItem = {
  key: string;
  title: string;
  description: string;
  /** Nome do ícone conforme `AchievementIcon` de achievements.ts */
  icon: string;
  /** "bronze" | "silver" | "gold" */
  tier: string;
  /**
   * Recompensa exibida no card quando aplicável.
   *
   * Hoje as conquistas NÃO concedem XP/moedas por si só (o XP/moedas vem das
   * ações de aula/simulado separadamente) — por isso estes campos são
   * opcionais e o card os omite quando ausentes. Nunca invente valores:
   * só preencha quando houver recompensa real vinculada ao desbloqueio.
   */
  xpReward?: number;
  coinReward?: number;
};

type ToastEntry = AchievementToastItem & {
  /** id único para a instância na fila (pode existir mais de uma tentativa). */
  instanceId: string;
};

// ---------------------------------------------------------------------------
// Ícones mapeados por nome de campo
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ElementType> = {
  book: BookOpen,
  trophy: Trophy,
  star: Star,
  target: Target,
  coins: Coins,
  users: Users,
  zap: Zap,
  award: Award,
  flame: Flame,
};

// ---------------------------------------------------------------------------
// Cores dos tiers
// ---------------------------------------------------------------------------

const TIER_CLASSES: Record<string, string> = {
  bronze: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-700/40",
  silver: "text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/60 dark:border-slate-600/40",
  gold: "text-yellow-500 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700/40",
};

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
};

const ICON_CONTAINER_CLASSES: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  silver: "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  gold: "bg-yellow-100 text-yellow-500 dark:bg-yellow-900/40 dark:text-yellow-300",
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

export const MAX_ACHIEVEMENT_TOASTS = 5;
export const ACHIEVEMENT_TOAST_TIMEOUT_MS = 6000;
export const ACHIEVEMENT_TOAST_EXIT_MS = 250;
export const ACHIEVEMENT_TOAST_SESSION_PREFIX = "hx-achievement-toast-shown:";

// Mantém o nome antigo para compatibilidade com imports existentes.
const MAX_QUEUE = MAX_ACHIEVEMENT_TOASTS;
const TIMEOUT_MS = ACHIEVEMENT_TOAST_TIMEOUT_MS;
const EXIT_MS = ACHIEVEMENT_TOAST_EXIT_MS;
const SESSION_KEY_PREFIX = ACHIEVEMENT_TOAST_SESSION_PREFIX;

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type State = { queue: ToastEntry[] };
type Action =
  | { type: "push"; items: ToastEntry[] }
  | { type: "dismiss"; instanceId: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "push": {
      // FIFO com teto de 5 visíveis: mantém os mais recentes.
      const combined = [...state.queue, ...action.items];
      return { queue: combined.slice(-MAX_QUEUE) };
    }
    case "dismiss":
      return { queue: state.queue.filter((t) => t.instanceId !== action.instanceId) };
  }
}

// ---------------------------------------------------------------------------
// Helpers — dedupe por sessão (compartilhado com o host global)
// ---------------------------------------------------------------------------

export function isAchievementToastShown(key: string): boolean {
  try {
    return Boolean(sessionStorage.getItem(`${SESSION_KEY_PREFIX}${key}`));
  } catch {
    return false;
  }
}

export function markAchievementToastShown(key: string): void {
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${key}`, "1");
  } catch {
    // Ignora erro de acesso ao storage.
  }
}

// Aliases internos (mantêm o comportamento original do componente).
function wasShownInSession(key: string): boolean {
  return isAchievementToastShown(key);
}

function markShownInSession(key: string): void {
  markAchievementToastShown(key);
}

let instanceCounter = 0;

export function resetAchievementToastCounterForTests(): void {
  instanceCounter = 0;
}

// ---------------------------------------------------------------------------
// AchievementToast
// ---------------------------------------------------------------------------

/**
 * Renderiza uma pilha FIFO de toasts de conquista (máx. 5 simultâneos).
 * Cada toast dura 6s e pode ser fechado manualmente.
 * Deduplica via sessionStorage para não repetir na mesma sessão.
 */
export function AchievementToast({
  achievements,
}: {
  achievements: AchievementToastItem[];
}) {
  const [{ queue }, dispatch] = useReducer(reducer, { queue: [] });

  // Sempre que a prop `achievements` mudar, tenta enfileirar os novos
  useEffect(() => {
    if (achievements.length === 0) return;

    const newEntries: ToastEntry[] = [];
    for (const item of achievements) {
      if (!item?.key) continue;
      if (wasShownInSession(item.key)) continue;
      markShownInSession(item.key);
      instanceCounter += 1;
      newEntries.push({ ...item, instanceId: `ach-${instanceCounter}` });
    }

    if (newEntries.length === 0) return;
    dispatch({ type: "push", items: newEntries });
  }, [achievements]);

  if (queue.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[200] flex flex-col gap-3"
      aria-live="polite"
      role="status"
      aria-label="Conquistas desbloqueadas"
    >
      {queue.map((entry) => (
        <ToastCard
          key={entry.instanceId}
          entry={entry}
          onDismiss={() => dispatch({ type: "dismiss", instanceId: entry.instanceId })}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToastCard — um card individual
// ---------------------------------------------------------------------------

function ToastCard({
  entry,
  onDismiss,
}: {
  entry: ToastEntry;
  onDismiss: () => void;
}) {
  const tier = entry.tier in TIER_CLASSES ? entry.tier : "bronze";
  const IconComponent = ICON_MAP[entry.icon] ?? Award;
  const tierClass = TIER_CLASSES[tier];
  const iconContainerClass = ICON_CONTAINER_CLASSES[tier];
  const [leaving, setLeaving] = useState(false);
  const dismissedRef = useRef(false);

  const xpReward = typeof entry.xpReward === "number" && entry.xpReward > 0 ? entry.xpReward : null;
  const coinReward =
    typeof entry.coinReward === "number" && entry.coinReward > 0 ? entry.coinReward : null;
  const hasReward = xpReward !== null || coinReward !== null;

  // Ciclo de vida: entrada (CSS) → permanência 6s com barra de progresso →
  // saída animada (250ms) → dismiss. Fechar manual segue o mesmo caminho.
  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), TIMEOUT_MS - EXIT_MS);
    const dismissTimer = window.setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        onDismiss();
      }
    }, TIMEOUT_MS);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(dismissTimer);
    };
    // onDismiss é estável o suficiente (dispatch) — recriar timers por entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.instanceId]);

  function handleManualClose() {
    if (dismissedRef.current) return;
    setLeaving(true);
    window.setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        onDismiss();
      }
    }, EXIT_MS);
  }

  return (
    <div
      className={cn(
        // Estrutura e sombra
        "pointer-events-auto w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-xl shadow-black/30 backdrop-blur-sm",
        // Cor de fundo/texto/borda vinda do tier
        tierClass,
        // Entrada animada; respeita prefers-reduced-motion.
        // O keyframe `achievement-slide-in` vive em `src/styles/animations.css`.
        !leaving &&
          "motion-safe:animate-[achievement-slide-in_0.3s_ease-out] motion-reduce:animate-none",
        // Saída animada nos últimos 250ms (manual ou automática).
        leaving && "motion-safe:animate-[achievement-toast-out_0.25s_ease-in_forwards] motion-reduce:animate-none",
      )}
      role="alert"
      aria-label={`Conquista desbloqueada: ${entry.title}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Ícone */}
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            iconContainerClass,
          )}
          aria-hidden="true"
        >
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          {/* Badges: "Nova conquista" + tier */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-current/20 bg-current/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              Nova conquista
            </span>
            <span className="inline-flex items-center rounded-full border border-current/20 bg-current/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              {TIER_LABEL[tier] ?? tier}
            </span>
          </div>

          {/* Título */}
          <p className="truncate text-sm font-bold leading-snug">
            {entry.title}
          </p>

          {/* Descrição */}
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed opacity-75">
            {entry.description}
          </p>

          {/* Recompensa — só quando houver valor real (nunca inventado). */}
          {hasReward && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold">
              {xpReward !== null && (
                <span className="inline-flex items-center gap-1" aria-label={`Recompensa: ${xpReward} XP`}>
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />+{xpReward} XP
                </span>
              )}
              {coinReward !== null && (
                <span className="inline-flex items-center gap-1" aria-label={`Recompensa: ${coinReward} moedas`}>
                  <Coins className="h-3.5 w-3.5" aria-hidden="true" />+{coinReward} moedas
                </span>
              )}
            </p>
          )}
        </div>

        {/* Botão fechar */}
        <button
          type="button"
          onClick={handleManualClose}
          aria-label={`Fechar notificação: ${entry.title}`}
          className="shrink-0 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de permanência (6s) — escondida para reduced-motion. */}
      <div className="overflow-hidden rounded-b-xl px-4 pb-2 motion-reduce:hidden" aria-hidden="true">
        <div
          className="h-0.5 w-full origin-left rounded-full bg-current opacity-30 motion-safe:animate-[achievement-toast-progress_6s_linear_forwards]"
          style={{ animationDuration: `${TIMEOUT_MS}ms` }}
        />
      </div>
    </div>
  );
}

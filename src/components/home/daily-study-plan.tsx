"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Target,
  RefreshCw,
  Radio,
  Flame,
  Users,
  Sparkles,
  Trophy,
  CheckCircle,
  Clock,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { DailyPlan, DailyPlanTask } from "@/services/daily-plan.service";

type Props = {
  dailyPlan: DailyPlan;
  onCompleteTask?: (taskId: string) => Promise<void>;
};

const TASK_ICONS: Record<DailyPlanTask["type"], LucideIcon> = {
  lesson: BookOpen,
  exam: Target,
  review: RefreshCw,
  live: Radio,
  streak: Flame,
  social: Users,
};

const TASK_COLORS: Record<DailyPlanTask["type"], string> = {
  lesson: "sky",
  exam: "amber",
  review: "violet",
  live: "rose",
  streak: "orange",
  social: "emerald",
};

const TASK_LABELS: Record<DailyPlanTask["type"], string> = {
  lesson: "Aula",
  exam: "Simulado",
  review: "Revisão",
  live: "Ao vivo",
  streak: "Sequência",
  social: "Social",
};

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes}min`;
}

export function DailyStudyPlan({ dailyPlan, onCompleteTask }: Props) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    new Set(dailyPlan.tasks.filter((t) => t.completed).map((t) => t.id))
  );
  const [animatingTask, setAnimatingTask] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleCompleteTask = async (task: DailyPlanTask) => {
    if (completedTasks.has(task.id)) return;

    setAnimatingTask(task.id);
    setShowConfetti(true);

    // Optimistic update
    setCompletedTasks((prev) => new Set(prev).add(task.id));

    try {
      if (onCompleteTask) {
        await onCompleteTask(task.id);
      }
    } catch {
      // Revert on error
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    } finally {
      setTimeout(() => {
        setAnimatingTask(null);
        setShowConfetti(false);
      }, 600);
    }
  };

  const completionRate = dailyPlan.totalCount > 0
    ? Math.round((dailyPlan.completedCount / dailyPlan.totalCount) * 100)
    : 0;

  const isComplete = dailyPlan.completedCount === dailyPlan.totalCount && dailyPlan.totalCount > 0;

  return (
    <section data-tour="daily-study-plan">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ">
        <div className="flex items-center gap-3">
          <span className="hx-icon-box bg-gradient-to-br from-amber-400 to-orange-400 text-white animate-pulse-subtle">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold hx-text-title">Plano de estudos do dia</h2>
              {isComplete && (
                <Badge variant="default" className="animate-bounce-in">
                  <CheckCircle className="h-3 w-3" />
                  Completo!
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm hx-text-muted">
              {dailyPlan.completedCount} de {dailyPlan.totalCount} tarefas concluídas
              {dailyPlan.streakBonus > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-300">
                  <Zap className="h-3 w-3" />
                  Bônus de sequência: +{dailyPlan.streakBonus} XP
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center ">
          <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-white/10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#progress-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${282.7 * (completionRate / 100)} 282.7`}
              className="transition-all duration-1000 ease-out"
              style={{
                strokeDashoffset: 0,
                filter: "drop-shadow(0 0 6px hsl(var(--sidebar-highlight)))",
              }}
            />
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--sidebar-highlight))" />
                <stop offset="100%" stopColor="hsl(var(--sidebar-highlight))/0.6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-white">{completionRate}%</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">concluído</span>
          </div>
        </div>
      </div>

      {/* Rewards Preview */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3 ">
        <div className="rounded-lg border border-white/10 bg-[var(--surface)] p-3 text-center group/hx-lift">
          <div className="flex items-center justify-center gap-1.5 text-sky-300">
            <Zap className="h-4 w-4" />
            <span className="text-lg font-bold text-white">{dailyPlan.totalXpReward.toLocaleString("pt-BR")}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">XP total do dia</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[var(--surface)] p-3 text-center group/hx-lift">
          <div className="flex items-center justify-center gap-1.5 text-amber-300">
            <Trophy className="h-4 w-4" />
            <span className="text-lg font-bold text-white">{dailyPlan.totalCoinReward.toLocaleString("pt-BR")}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Moedas do dia</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[var(--surface)] p-3 text-center group/hx-lift">
          <div className="flex items-center justify-center gap-1.5 text-emerald-300">
            <Clock className="h-4 w-4" />
            <span className="text-lg font-bold text-white">
              {formatMinutes(dailyPlan.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0))}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Tempo estimado</p>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {dailyPlan.tasks.map((task) => {
          const isCompleted = completedTasks.has(task.id);
          const isAnimating = animatingTask === task.id;
          const Icon = TASK_ICONS[task.type];

          return (
            <div
              key={task.id}
              className={cn(
                "relative group hx-lift overflow-hidden",
                isAnimating && "animate-bounce-in ring-2 ring-emerald-400/50",
              )}
            >
              <Card
                padding="md"
                className={cn(
                  "h-full hx-lift relative overflow-hidden transition-all duration-500",
                  "border-[hsl(var(--sidebar-border))] bg-[var(--surface)]",
                  "hover:border-[hsl(var(--sidebar-highlight))/0.3] hover:bg-[hsl(var(--sidebar-highlight))/0.06]",
                  isCompleted && "opacity-70 border-emerald-400/30 bg-emerald-400/5",
                  isAnimating && "ring-2 ring-emerald-400 scale-[1.02]",
                )}
              >
                {/* Task type badge */}
                <div className="absolute top-3 right-3 z-10 ">
                  <Badge
                    variant={isCompleted ? "emerald" : "sky"}
                    className={cn(
                      "text-[10px]",
                      isCompleted ? "bg-emerald-400/20 text-emerald-300" : "",
                    )}
                  >
                    {TASK_LABELS[task.type]}
                  </Badge>
                </div>

                {/* Completion checkmark overlay */}
                {isCompleted && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10 bg-emerald-400/10"
                    aria-hidden="true"
                  >
                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                  </div>
                )}

                <div className={cn("relative flex flex-col h-full", isCompleted && "pointer-events-none")}>
                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mb-3 ">
                    <span
                      className={cn(
                        "hx-icon-box flex-shrink-0 transition-all duration-300 group-hover:scale-110",
                        isCompleted
                          ? "bg-emerald-400/20 text-emerald-300"
                          : `bg-${TASK_COLORS[task.type]}-400/15 text-${TASK_COLORS[task.type]}-300`,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className={cn(
                        "font-semibold text-white truncate transition-colors",
                        isCompleted && "line-through text-slate-500",
                      )}>
                        {task.title}
                      </h3>
                      <p className={cn(
                        "mt-1 text-xs truncate transition-colors",
                        isCompleted ? "text-slate-600" : "text-slate-400",
                      )}>
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mb-3 ">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatMinutes(task.estimatedMinutes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      +{task.xpReward} XP
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-2.5 w-2.5" />
                      +{task.coinReward}
                    </span>
                  </div>

                  {/* Priority indicator */}
                  <div className="mb-3 ">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          task.priority === "high" && "bg-red-400 w-full",
                          task.priority === "medium" && "bg-amber-400 w-2/3",
                          task.priority === "low" && "bg-sky-400 w-1/3",
                        )}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                      Prioridade: {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                    </p>
                  </div>

                  {/* Action button */}
                  <div className="mt-auto pt-3 border-t border-white/5">
                    {isCompleted ? (
                      <Button
                        variant="outline"
                        className="w-full justify-center gap-2 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                        disabled
                      >
                        <CheckCircle className="h-4 w-4" />
                        Concluída
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between group",
                          `hover:border-${TASK_COLORS[task.type]}-400/50 hover:bg-${TASK_COLORS[task.type]}-400/10`,
                        )}
                        onClick={() => handleCompleteTask(task)}
                        disabled={isAnimating}
                      >
                        <span>Marcar como feita</span>
                        <ArrowRight
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            isAnimating ? "animate-spin" : "group-hover:translate-x-1",
                          )}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Confetti burst */}
                {showConfetti && isAnimating && (
                  <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <ConfettiPiece key={j} delay={j * 50} />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {/* CTA to full plan page */}
      <div className="mt-6 ">
        <Link
          href="/plano-diario"
          className="w-full hx-lift flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm font-semibold hx-text-body hover:border-[hsl(var(--sidebar-highlight))/0.3] hover:bg-[hsl(var(--sidebar-highlight))/0.06] transition-all"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition">
            <Sparkles className="h-4 w-4" />
          </span>
          Ver plano completo e histórico
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

const CONFETTI_PIECES = [
  { color: "#fcd34d", size: 8, x: 18, y: 24, rotation: 30, circle: true },
  { color: "#f97316", size: 11, x: 31, y: 60, rotation: 105, circle: false },
  { color: "#22d3ee", size: 7, x: 47, y: 35, rotation: 210, circle: true },
  { color: "#a78bfa", size: 12, x: 63, y: 54, rotation: 285, circle: false },
  { color: "#4ade80", size: 9, x: 78, y: 27, rotation: 150, circle: true },
  { color: "#fb7185", size: 10, x: 88, y: 66, rotation: 330, circle: false },
] as const;

function ConfettiPiece({ delay }: { delay: number }) {
  const piece = CONFETTI_PIECES[(delay / 50 - 1) % CONFETTI_PIECES.length];

  return (
    <div
      className="absolute"
      style={{
        left: `${piece.x}%`,
        top: `${piece.y}%`,
        width: `${piece.size}px`,
        height: `${piece.size}px`,
        background: piece.color,
        borderRadius: piece.circle ? "50%" : "0",
        transform: `rotate(${piece.rotation}deg)`,
        animation: `confetti-fall 800ms ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    />
  );
}

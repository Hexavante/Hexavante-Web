"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, BarChart3, BookOpen, Flame, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { XpProgressBar } from "@/components/gamification/xp-progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import {
  resolveAppTheme,
  resolveProfileBackground,
  getProfileBackgroundStyle,
  getProfileFrameStyle,
  themeFxClasses,
} from "@/lib/cosmetics";
import type { getStudentHomeData } from "@/services/student.service";
import type { DailyPlan } from "@/services/daily-plan.service";

type DashboardData = Awaited<ReturnType<typeof getStudentHomeData>> & {
  dailyPlan?: DailyPlan | null;
  cosmetics?: {
    themeId: string | null;
    themeClassName: string;
    avatarBorderClassName: string | null;
    profileBackgroundId: string | null;
    frameId: string | null;
  };
};

type Props = {
  data: DashboardData;
  userName: string;
  userAvatar?: string | null;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Target,
  Award,
  BarChart3,
  Flame,
  Zap,
  Sparkles,
  Trophy,
};

export function StudentDashboard({ data, userName, userAvatar }: Props) {
  const {
    xpProfile,
    inProgress,
    completedCount,
    recentXp,
    lastExam,
    dailyPlan,
    cosmetics,
  } = data;

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const theme = resolveAppTheme(cosmetics?.themeId ?? null);
  const background = resolveProfileBackground(cosmetics?.profileBackgroundId ?? null);
  const backgroundStyle = getProfileBackgroundStyle(cosmetics?.profileBackgroundId ?? null);
  const frameStyle = getProfileFrameStyle(cosmetics?.frameId ?? null);
  const frameAnimation = cosmetics?.frameId ? resolveProfileBackground(cosmetics?.frameId)?.animationClass : "";
  const backgroundAnimation = background?.animationClass ?? "";
  const themeEffects = themeFxClasses(cosmetics?.themeId ?? null);

  const combinedStyle = {
    ...backgroundStyle,
    ...frameStyle,
  };

  const greetingName = userName.split(" ")[0];

  return (
    <Card
      padding="md"
      className={cn(
        "relative overflow-hidden shadow-2xl shadow-black/30 backdrop-blur transition-all duration-500",
        "hx-hero-card",
        theme.className !== "theme-default" && theme.className,
        themeEffects,
        backgroundAnimation,
        frameAnimation,
      )}
      style={Object.keys(combinedStyle).length > 0 ? combinedStyle : undefined}
    >
      {/* Animated background glow */}
      {backgroundStyle && (
        <div
          className="absolute inset-0 -z-10 opacity-60 animate-bg-breathe pointer-events-none"
          style={backgroundStyle}
          aria-hidden="true"
        />
      )}

      {/* Theme gradient overlay */}
      {theme.id !== "default" && (
        <div
          className="absolute inset-0 -z-10 opacity-15 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-mid), var(--theme-gradient-to))`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Floating particles for premium themes */}
      {(theme.id === "cyberpunk" || theme.id === "sakura" || theme.id === "midnight") && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-30 animate-float"
              style={{
                width: `${20 + i * 15}px`,
                height: `${20 + i * 15}px`,
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
                background: `var(--theme-glow-${(i % 2) + 1})`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${15 + i * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={userAvatar}
            alt={userName}
            size="lg"
            className={cn("ring-2 ring-offset-2 ring-offset-[var(--background)]", cosmetics?.avatarBorderClassName)}
          />
          <div>
            <p className="text-sm font-semibold text-white">Olá, {greetingName}!</p>
            <p className="mt-0.5 text-xs text-slate-400">Seu painel de estudos</p>
          </div>
        </div>
        {xpProfile && (
          <Badge variant="sky" className="shrink-0 animate-slide-in-right">
            <Sparkles className="h-3.5 w-3.5" />
            Nível {xpProfile.level}
          </Badge>
        )}
      </div>

      {xpProfile && (
        <div className="mt-4 animate-fade-in-up">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>{xpProfile.totalXp.toLocaleString("pt-BR")} XP total</span>
            <span>{xpProfile.progressPercent}% do nível {xpProfile.level + 1}</span>
          </div>
          <XpProgressBar {...xpProfile} />
        </div>
      )}

      {/* Daily Plan Preview - compact */}
      {dailyPlan && dailyPlan.tasks.length > 0 && (
        <div className="mt-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="hx-icon-box text-amber-400">
                <BookOpen className="h-4 w-4" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide hx-accent-text">Plano de hoje</p>
            </div>
            <Badge variant="sky" className="text-xs">
              {dailyPlan.completedCount}/{dailyPlan.totalCount} concluídas
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dailyPlan.tasks.slice(0, 3).map((task, i) => {
              const TaskIcon = ICON_MAP[task.icon] ?? BookOpen;
              return (
                <Link
                  key={task.id}
                  href={task.href}
                  className={cn(
                    "group hx-lift flex items-center gap-2 rounded-lg border p-3 transition",
                    "border-[hsl(var(--sidebar-border))] bg-[var(--surface)] hover:border-[hsl(var(--sidebar-highlight))/0.3] hover:bg-[hsl(var(--sidebar-highlight))/0.06]",
                    task.completed && "opacity-60 line-through",
                    hoveredTask === task.id && "ring-2 ring-[hsl(var(--sidebar-highlight))/0.5]",
                  )}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition group-hover:scale-105",
                      task.completed
                        ? "bg-emerald-400/20 text-emerald-300"
                        : "bg-white/5 text-slate-400 group-hover:text-white",
                    )}
                  >
                    <TaskIcon className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-medium">
                    {task.title}
                  </span>
                  {task.completed && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center text-emerald-300">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </Link>
              );
            })}
            {dailyPlan.tasks.length > 3 && (
              <Link
                href="/plano-diario"
                className={cn(
                  "group hx-lift flex flex-col items-center justify-center gap-1 rounded-lg border p-3 transition",
                  "border-dashed border-white/15 bg-white/[0.02] text-slate-400 hover:border-[hsl(var(--sidebar-highlight))/0.3] hover:bg-[hsl(var(--sidebar-highlight))/0.06]",
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition">
                  <ArrowRight className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium">+{dailyPlan.tasks.length - 3} tarefas</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <div className={cn(
          "relative rounded-lg border p-3 transition overflow-hidden",
          "border-[hsl(var(--sidebar-border))] bg-[var(--surface)]",
          "hover:border-[hsl(var(--sidebar-highlight))/0.3] hover:bg-[hsl(var(--sidebar-highlight))/0.06]",
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sidebar-highlight))/0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="relative text-xs text-slate-400">Em andamento</p>
          <p className="relative mt-1 text-2xl font-bold text-white">{inProgress.length}</p>
        </div>
        <div className={cn(
          "relative rounded-lg border p-3 transition overflow-hidden",
          "border-[hsl(var(--sidebar-border))] bg-[var(--surface)]",
          "hover:border-[hsl(var(--sidebar-highlight))/0.3] hover:bg-[hsl(var(--sidebar-highlight))/0.06]",
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="relative text-xs text-slate-400">Concluídos</p>
          <p className="relative mt-1 text-2xl font-bold text-white">{completedCount}</p>
        </div>
        <div className={cn(
          "relative rounded-lg border p-3 transition overflow-hidden",
          "border-[hsl(var(--sidebar-border))] bg-[var(--surface)]",
          "hover:border-amber-400/30 hover:bg-amber-400/10",
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="relative text-xs text-slate-400">Ranking</p>
          <Link
            href="/ranking"
            className="relative mt-1 inline-flex items-center gap-1 text-sm font-semibold hx-accent-link"
          >
            <Trophy className="h-4 w-4" />
            Ver top
          </Link>
        </div>
      </div>

      {inProgress.length > 0 && !data.continuation ? (
        <div className="mt-5 space-y-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Continue estudando
          </p>
          {inProgress.map((enrollment, i) => (
            <Link
              key={enrollment.id}
              href={`/courses/${enrollment.course.slug}/learn`}
              className={cn(
                "group hx-lift flex items-center justify-between gap-3 rounded-lg border p-3 transition",
                "border-[hsl(var(--sidebar-border))] bg-[var(--surface)]",
                "hover:border-[hsl(var(--sidebar-highlight))/0.3] hover:bg-[hsl(var(--sidebar-highlight))/0.06]",
              )}
              style={{ animationDelay: `${0.22 + i * 0.05}s` }}
            >
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {enrollment.course.title}
                </span>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>{Math.round(enrollment.progress)}% concluído</span>
                  <span className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                    <span
                      className="h-full bg-[hsl(var(--sidebar-highlight))] block transition-all duration-500"
                      style={{ width: `${Math.min(100, enrollment.progress)}%` }}
                    />
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-[hsl(var(--sidebar-highlight))] transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-6 text-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <BookOpen className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm text-slate-300">Nenhum curso em andamento.</p>
          <LinkButton href="/courses" variant="outline" size="sm" className="mt-4">
            Explorar cursos
          </LinkButton>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
        <LinkButton href="/simulados" variant="outline" size="sm" className="group">
          <Target className="h-4 w-4 group-hover:text-sky-300 transition-colors" />
          Simulados
        </LinkButton>
        <LinkButton href="/certificados" variant="outline" size="sm" className="group">
          <Award className="h-4 w-4 group-hover:text-amber-300 transition-colors" />
          Certificados
        </LinkButton>
        <LinkButton href="/estatisticas" variant="outline" size="sm" className="group">
          <BarChart3 className="h-4 w-4 group-hover:text-cyan-300 transition-colors" />
          Estatísticas
        </LinkButton>
        <LinkButton href="/perfil" variant="ghost" size="sm" className="group">
          <span className="group-hover:text-violet-300 transition-colors">Meu perfil</span>
        </LinkButton>
      </div>

      {(recentXp[0] || lastExam) && (
        <div className="mt-4 rounded-lg border border-white/8 bg-slate-950/30 p-3 text-xs text-slate-400 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <p className="font-semibold text-slate-300">Última atividade</p>
          {recentXp[0] && (
            <p className="mt-1 flex items-center gap-2">
              <span className="hx-icon-box text-emerald-400"><Zap className="h-3.5 w-3.5" /></span>
              +{recentXp[0].amount} XP — {recentXp[0].description ?? recentXp[0].source}
            </p>
          )}
          {lastExam && (
            <p className="mt-1 flex items-center gap-2">
              <span className="hx-icon-box text-amber-400"><Target className="h-3.5 w-3.5" /></span>
              Simulado {lastExam.exam.title}: {Math.round(lastExam.score)}%
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

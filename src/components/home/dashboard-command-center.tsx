"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart2,
  BarChart3,
  BookOpen,
  Radio,
  Target,
  Users,
  Zap,
  Flame,
  Trophy,
  BookMarked,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  DASHBOARD_QUICK_ACTIONS,
  type DashboardPendingItem,
} from "@/services/dashboard-pending.service";

type Props = {
  pendingItems: DashboardPendingItem[];
};

const toneStyles: Record<DashboardPendingItem["tone"], string> = {
  sky: "hx-tone-sky hover:border-[hsl(var(--sidebar-highlight))/0.4]",
  violet: "hx-tone-violet hover:border-violet-400/40",
  amber: "hx-tone-amber hover:border-amber-400/40",
  orange: "hx-tone-orange hover:border-orange-400/40",
  emerald: "hx-tone-emerald hover:border-emerald-400/40",
};

const QUICK_ACTION_META: Record<
  string,
  { icon: LucideIcon; tone: string; iconTone: string }
> = {
  "/courses": {
    icon: BookOpen,
    tone: "hover:border-[hsl(var(--sidebar-highlight))/0.35] hover:bg-[hsl(var(--sidebar-highlight))/0.1]",
    iconTone: "bg-[hsl(var(--sidebar-highlight))/0.15] hx-accent-text",
  },
  "/simulados": {
    icon: Target,
    tone: "hover:border-teal-400/35 hover:bg-teal-400/10",
    iconTone: "bg-teal-400/15 text-teal-300",
  },
  "/estatisticas": {
    icon: BarChart3,
    tone: "hover:border-cyan-400/35 hover:bg-cyan-400/10",
    iconTone: "bg-cyan-400/15 text-cyan-300",
  },
  "/ranking": {
    icon: BarChart2,
    tone: "hover:border-amber-400/35 hover:bg-amber-400/10",
    iconTone: "bg-amber-400/15 text-amber-300",
  },
  "/certificados": {
    icon: Award,
    tone: "hover:border-yellow-400/35 hover:bg-yellow-400/10",
    iconTone: "bg-yellow-400/15 text-yellow-300",
  },
  "/live-rooms": {
    icon: Radio,
    tone: "hover:border-rose-400/35 hover:bg-rose-400/10",
    iconTone: "bg-rose-400/15 text-rose-300",
  },
};

const defaultQuickMeta = {
  icon: Zap,
  tone: "hover:border-[hsl(var(--sidebar-highlight))/0.35] hover:bg-[hsl(var(--sidebar-highlight))/0.1]",
  iconTone: "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))/0.72]",
};

const PENDING_ICONS: Record<DashboardPendingItem["tone"], LucideIcon> = {
  sky: BookMarked,
  violet: Radio,
  amber: Flame,
  orange: Trophy,
  emerald: Zap,
};

export function DashboardCommandCenter({ pendingItems }: Props) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      pendingItems.forEach((_, i) => {
        setTimeout(() => {
          setVisibleItems((prev) => new Set(prev).add(i));
        }, 50 + i * 80);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingItems.length]);

  return (
    <section className="mt-8" data-tour="dashboard-command">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 animate-slide-in-left">
        <div>
          <div className="flex items-center gap-2 hx-accent-text animate-fade-in">
            <Zap className="h-4 w-4 animate-pulse-subtle" />
            <p className="text-xs font-bold uppercase tracking-wide">Central de estudos</p>
          </div>
          <h2 className="mt-1 text-lg font-bold hx-text-title animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            Sua rotina de hoje
          </h2>
          <p className="mt-1 text-sm hx-text-muted animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Um clique para a próxima ação importante.
          </p>
        </div>
        {pendingItems.length > 0 && (
          <span className="animate-fade-in shrink-0" style={{ animationDelay: "0.15s" }}>
            <Badge variant="outline" className="text-xs">
              {pendingItems.filter((i) => !i.id.includes("streak")).length} ações pendentes
            </Badge>
          </span>
        )}
      </div>

      {pendingItems.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {pendingItems.map((item, i) => {
            const Icon = PENDING_ICONS[item.tone];
            const isVisible = visibleItems.has(i);
            return (
              <div
                key={item.id}
                className={cn(
                  "hx-lift group relative overflow-hidden",
                  !isVisible && "opacity-0 translate-y-4",
                  isVisible && "animate-slide-in-up",
                )}
                style={{
                  animationDelay: `${0.15 + i * 0.08}s`,
                  transitionDelay: `${0.15 + i * 0.08}s`,
                }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group hx-lift flex h-full flex-col rounded-xl border p-4 transition-all duration-300",
                    toneStyles[item.tone],
                    "hover:shadow-lg hover:shadow-[hsl(var(--sidebar-highlight))/0.1]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-all duration-300 group-hover:scale-110",
                        "border-current/30 bg-current/10 text-current",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-[hsl(var(--sidebar-highlight))] transition-colors">
                        {item.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs opacity-80">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                      Prioridade: {item.priority === 0 ? "Alta" : item.priority === 1 ? "Média" : "Baixa"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-current group-hover:gap-2 transition-all">
                      Abrir
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  {/* Progress ring for streak */}
                  {item.id === "streak" && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <Card padding="md" className="mt-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide hx-text-subtle">Atalhos rápidos</p>
          <span className="text-xs text-slate-500">{DASHBOARD_QUICK_ACTIONS.length} disponíveis</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {DASHBOARD_QUICK_ACTIONS.map((action, i) => {
            const meta = QUICK_ACTION_META[action.href] ?? defaultQuickMeta;
            const Icon = meta.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "group hx-lift flex items-center gap-2.5 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold hx-text-body transition-all duration-300",
                  meta.tone,
                  "hover:shadow-md hover:shadow-[hsl(var(--sidebar-highlight))/0.05]",
                )}
                style={{ animationDelay: `${0.35 + i * 0.05}s` }}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                    meta.iconTone,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

function Badge({ variant = "outline", children, className }: { variant?: "outline" | "default"; children: React.ReactNode; className?: string }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";
  const variants = {
    outline: "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10",
    default: "bg-[hsl(var(--sidebar-highlight))/0.2] text-[hsl(var(--sidebar-highlight))]",
  };
  return <span className={cn(base, variants[variant], className)}>{children}</span>;
}
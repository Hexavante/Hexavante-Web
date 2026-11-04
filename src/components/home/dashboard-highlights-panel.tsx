"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Radio, Target, Award, ExternalLink, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { DashboardHighlights } from "@/services/dashboard-goals.service";

type Props = {
  highlights: DashboardHighlights;
};

function formatEventDate(date: Date): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff < 0) return "Iniciado";
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function DashboardHighlightsPanel({ highlights }: Props) {
  const { nextGoal, lastCertificate, nextLiveEvent } = highlights;
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const cards = ["goal", "certificate", "live"].filter((c) => {
      if (c === "goal") return nextGoal;
      if (c === "certificate") return lastCertificate;
      if (c === "live") return nextLiveEvent;
      return false;
    });

    cards.forEach((card, i) => {
      setTimeout(() => {
        setVisibleCards((prev) => new Set(prev).add(card));
      }, 100 + i * 120);
    });
  }, [nextGoal, lastCertificate, nextLiveEvent]);

  const hasContent = nextGoal || lastCertificate || nextLiveEvent;

  if (!hasContent) return null;

  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-5" data-tour="dashboard-highlights">
      {nextGoal && (
        <div
          className={cn(
            "relative group hx-lift overflow-hidden",
            !visibleCards.has("goal") && "opacity-0 translate-y-6",
            visibleCards.has("goal") && "animate-slide-in-up",
          )}
          style={{
            animationDelay: "0.1s",
            transitionDelay: "0.1s",
          }}
          onMouseEnter={() => setHoveredCard("goal")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Card
            padding="md"
            className={cn(
              "h-full hx-lift relative overflow-hidden transition-all duration-500",
              "border-[hsl(var(--sidebar-highlight))/0.22] bg-[hsl(var(--sidebar-highlight))/0.06]",
              hoveredCard === "goal" && "ring-2 ring-[hsl(var(--sidebar-highlight))/0.4] shadow-xl shadow-[hsl(var(--sidebar-highlight))/0.1]",
            )}
          >
            {/* Animated background */}
            <div
              className={cn(
                "absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 pointer-events-none",
                hoveredCard === "goal" && "opacity-100",
              )}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sidebar-highlight))/0.15] via-transparent to-transparent" />
              <div className="absolute top-0 right-0 h-24 w-24 bg-[hsl(var(--sidebar-highlight))/0.1] rounded-full blur-2xl" />
            </div>

            <div className="relative flex flex-col h-full z-10">
              <div className="flex items-start gap-3 animate-fade-in-left">
                <span className={cn(
                  "hx-icon-box flex-shrink-0 transition-all duration-300 group-hover:scale-110",
                  "bg-[hsl(var(--sidebar-highlight))/0.15] hx-accent-text",
                )}>
                  <Target className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide hx-accent-text">Próxima meta</p>
                    {nextGoal.progress >= 100 && (
                      <Badge variant="default" className="text-[10px]">
                        <CheckCircle className="h-2.5 w-2.5" />
                        Concluída
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate font-semibold text-white group-hover:text-[hsl(var(--sidebar-highlight))] transition-colors">
                    {nextGoal.courseTitle}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{nextGoal.label}</p>
                </div>
              </div>

              <div className="mt-4 flex-1 flex flex-wrap gap-x-3 gap-y-2 items-end justify-between animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <div>
                  <div className="mb-2 flex justify-between text-xs text-slate-400">
                    <span>Progresso</span>
                    <span className="font-bold text-white">{nextGoal.progress}%</span>
                  </div>
                  <div className="hx-progress-track h-1.5 relative overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-gradient-to-r from-[hsl(var(--sidebar-highlight))] to-[hsl(var(--sidebar-highlight))/0.7] transition-all duration-1000 ease-out",
                        nextGoal.progress >= 100 && "animate-pulse-glow",
                      )}
                      style={{ width: `${Math.min(100, nextGoal.progress)}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold hx-accent-link group-hover:gap-2 transition-all">
                    Continuar
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>

              <Link
                href={`/courses/${nextGoal.courseSlug}/learn`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hx-accent-link group-hover:gap-2 transition-all animate-fade-in-up"
                style={{ animationDelay: "0.15s" }}
              >
                Ir para o curso
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {lastCertificate && (
        <div
          className={cn(
            "relative group hx-lift overflow-hidden",
            !visibleCards.has("certificate") && "opacity-0 translate-y-6",
            visibleCards.has("certificate") && "animate-slide-in-up",
          )}
          style={{
            animationDelay: "0.2s",
            transitionDelay: "0.2s",
          }}
          onMouseEnter={() => setHoveredCard("certificate")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Card
            padding="md"
            className={cn(
              "h-full hx-lift relative overflow-hidden transition-all duration-500",
              "border-amber-400/20 bg-amber-400/5",
              hoveredCard === "certificate" && "ring-2 ring-amber-400/40 shadow-xl shadow-amber-400/10",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 pointer-events-none",
                hoveredCard === "certificate" && "opacity-100",
              )}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-transparent" />
              <div className="absolute top-0 right-0 h-24 w-24 bg-amber-400/10 rounded-full blur-2xl" />
            </div>

            <div className="relative flex flex-col h-full z-10">
              <div className="flex items-start gap-3 animate-fade-in-left">
                <span className={cn(
                  "hx-icon-box flex-shrink-0 transition-all duration-300 group-hover:scale-110 animate-bounce-subtle",
                  "bg-amber-400/15 text-amber-300",
                )}>
                  <Award className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-300">Certificado recente</p>
                  <p className="mt-1 truncate font-semibold text-white">{lastCertificate.courseTitle}</p>
                  <p className="mt-1 text-sm text-slate-400">Código: {lastCertificate.code}</p>
                </div>
              </div>

              <div className="mt-4 flex-1 flex flex-wrap gap-x-3 gap-y-2 items-end justify-between animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Emitido em {new Date(lastCertificate.issuedAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <Badge variant="default" className="bg-amber-400/20 text-amber-300">
                    <CheckCircle className="h-2.5 w-2.5" />
                    Verificado
                  </Badge>
                </div>
              </div>

              <Link
                href={`/certificados/${lastCertificate.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors animate-fade-in-up"
                style={{ animationDelay: "0.15s" }}
              >
                Ver certificado
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {nextLiveEvent && (
        <div
          className={cn(
            "relative group hx-lift overflow-hidden",
            !visibleCards.has("live") && "opacity-0 translate-y-6",
            visibleCards.has("live") && "animate-slide-in-up",
          )}
          style={{
            animationDelay: "0.3s",
            transitionDelay: "0.3s",
          }}
          onMouseEnter={() => setHoveredCard("live")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Card
            padding="md"
            className={cn(
              "h-full hx-lift relative overflow-hidden transition-all duration-500",
              nextLiveEvent.status === "LIVE"
                ? "border-red-400/25 bg-red-400/5"
                : "border-violet-400/20 bg-violet-400/5",
              hoveredCard === "live" && nextLiveEvent.status === "LIVE"
                ? "ring-2 ring-red-400/40 shadow-xl shadow-red-400/10"
                : hoveredCard === "live" && "ring-2 ring-violet-400/40 shadow-xl shadow-violet-400/10",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 pointer-events-none",
                hoveredCard === "live" && "opacity-100",
              )}
              aria-hidden="true"
            >
              <div
                className="absolute inset-0"
                style={{
                  background: nextLiveEvent.status === "LIVE"
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)"
                    : "linear-gradient(135deg, rgba(168, 85, 247, 0.1), transparent)",
                }}
              />
              <div
                className="absolute top-0 right-0 h-24 w-24 rounded-full blur-2xl"
                style={{
                  background: nextLiveEvent.status === "LIVE"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(168, 85, 247, 0.1)",
                }}
              />
            </div>

            <div className="relative flex flex-col h-full z-10">
              <div className="flex items-start gap-3 animate-fade-in-left">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-all duration-300 group-hover:scale-110",
                    nextLiveEvent.status === "LIVE"
                      ? "border-red-400/30 bg-red-400/10 text-red-300"
                      : "border-violet-400/25 bg-violet-400/10 text-violet-300",
                  )}
                >
                  <Radio className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-violet-300">
                      Próximo evento
                    </p>
                    {nextLiveEvent.status === "LIVE" && (
                      <Badge variant="red">
                        Ao vivo
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate font-semibold text-white">{nextLiveEvent.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {nextLiveEvent.instructorName}
                    {nextLiveEvent.courseTitle ? ` · ${nextLiveEvent.courseTitle}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex-1 flex flex-wrap gap-x-3 gap-y-2 items-end justify-between animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatEventDate(nextLiveEvent.scheduledAt)}</span>
                  <span className="px-1 text-slate-600">·</span>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatRelativeTime(nextLiveEvent.scheduledAt)}</span>
                </div>
              </div>

              <Link
                href={nextLiveEvent.href}
                className={cn(
                  "mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors animate-fade-in-up",
                  nextLiveEvent.status === "LIVE"
                    ? "text-red-300 hover:text-red-200"
                    : "text-violet-300 hover:text-violet-200",
                )}
                style={{ animationDelay: "0.15s" }}
              >
                {nextLiveEvent.status === "LIVE" ? "Entrar agora" : "Ver sala"}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
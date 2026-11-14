"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Play, Target, Zap, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ClientRelativeTime } from "@/components/ui/client-relative-time";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { StudyContinuation } from "@/services/study-continuation.service";

type Props = {
  continuation: StudyContinuation | null;
};

const ICON_MAP = {
  lesson: Play,
  exam: Target,
};

export function StudyContinueHero({ continuation }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!continuation) {
    return (
      <Card
        padding="md"
        data-tour="study-continue"
        className={cn(
          "relative overflow-hidden border-dashed border-[hsl(var(--sidebar-highlight))/0.25]",
          "bg-[hsl(var(--sidebar-highlight))/0.06] hx-hero-card ",
        )}
      >
        <div className="absolute inset-0 -z-10 opacity-5" aria-hidden="true">
          <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-[hsl(var(--sidebar-highlight))/0.1] to-transparent" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative">
          <div className="relative z-10">
            <Badge variant="sky" className=" ">
              <TrendingUp className="h-3.5 w-3.5" />
              Comece sua jornada
            </Badge>
            <h2 className="mt-3 text-xl font-bold hx-text-title ">
              Nenhum estudo em andamento
            </h2>
            <p className="mt-2 text-sm hx-text-muted ">
              Matricule-se em um curso ou faça um simulado para retomar daqui.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 relative z-10 ">
            <LinkButton href="/courses" className="min-h-11 group">
              <BookOpen className="h-4 w-4 group-hover:rotate-6 transition-transform" />
              Explorar cursos
            </LinkButton>
            <LinkButton href="/simulados" variant="outline" className="min-h-11 group">
              <Target className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Simulados
            </LinkButton>
          </div>
        </div>
      </Card>
    );
  }

  const isExam = continuation.type === "exam";
  const IconComponent = ICON_MAP[continuation.type];
  const displayProgress = isExam ? Math.round(continuation.examScore ?? continuation.progress) : Math.round(continuation.progress);

  return (
    <Card
      padding="md"
      data-tour="study-continue"
      className={cn(
        "relative overflow-hidden hx-hero-card ",
        isExam ? "border-amber-400/20 bg-amber-400/5" : "border-[hsl(var(--sidebar-highlight))/0.22] bg-[hsl(var(--sidebar-highlight))/0.06]",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background glow */}
      <div
        className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{ opacity: isHovered ? 0.15 : 0 }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--sidebar-highlight))/0.2] via-transparent to-[hsl(var(--sidebar-highlight))/0.2]" />
        {isExam && (
          <div className="absolute top-0 right-0 h-32 w-32 bg-amber-400/10 rounded-full blur-2xl" />
        )}
      </div>

      {/* Floating accent particles */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-0 transition-opacity duration-500 animate-float"
            style={{
              opacity: isHovered ? 0.4 : 0,
              width: `${12 + i * 8}px`,
              height: `${12 + i * 8}px`,
              left: `${15 + i * 20}%`,
              top: `${20 + i * 15}%`,
              background: isExam ? "rgba(249, 115, 22, 0.6)" : "var(--theme-glow-1)",
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${12 + i * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 relative z-10">
          <div className="flex flex-wrap items-center gap-2 ">
            <Badge
              variant={isExam ? "amber" : "sky"}
              className={cn("group", isHovered && "animate-pulse-glow")}
            >
              {isExam ? (
                <Target className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              ) : (
                <Play className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
              )}
              Continue estudando
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 ">
              <Clock className="h-3.5 w-3.5" />
              <ClientRelativeTime date={continuation.lastStudyAt} />
            </span>
          </div>

          <h2 className="mt-3 truncate text-xl font-black hx-text-title ">
            {isExam ? continuation.examTitle : continuation.courseTitle}
          </h2>
          <p className="mt-1 text-sm hx-text-muted ">
            {isExam
              ? `Última nota: ${Math.round(continuation.examScore ?? continuation.progress)}% — tente melhorar`
              : `Próxima aula: ${continuation.lessonTitle}`}
          </p>

          {!isExam && (
            <div className="mt-4 ">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Progresso do curso</span>
                <span>{displayProgress}%</span>
              </div>
              <div className="hx-progress-track h-2 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[hsl(var(--sidebar-highlight))] to-[hsl(var(--sidebar-highlight))/0.7] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, displayProgress)}%` }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                />
              </div>
            </div>
          )}

          {isExam && (
            <div className="mt-4 ">
              <div className="flex items-center gap-3 text-sm">
                <div className="hx-icon-box text-amber-400 animate-bounce-subtle">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="font-medium text-amber-200">
                  XP extra por melhorar a nota: +{Math.max(0, 100 - displayProgress) * 2} XP
                </span>
              </div>
            </div>
          )}
        </div>

        <Link
          href={continuation.href}
          className={cn(
            "relative hx-hero-btn group shrink-0 z-10 overflow-hidden",
            isExam
              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
              : "bg-gradient-to-r from-[hsl(var(--sidebar-highlight))] to-[hsl(var(--sidebar-highlight))/0.8]",
          )}
        >
          <span className="relative flex items-center gap-2 px-6 py-3 text-sm font-bold text-white">
            {isExam ? "Ver simulado" : "Retomar aula"}
            <ArrowRight
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                isHovered ? "translate-x-1" : "translate-x-0",
              )}
            />
          </span>
          {/* Ripple effect */}
          <span
            className={cn(
              "absolute inset-0 bg-white/20 rounded-inherit transform scale-0 transition-transform duration-500",
              isHovered && "scale-150 opacity-0",
            )}
            aria-hidden="true"
          />
        </Link>
      </div>
    </Card>
  );
}
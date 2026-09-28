"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { completeOnboardingTourAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";

type TourStep = {
  id: string;
  title: string;
  description: string;
  target?: string;
  mobileTarget?: string;
  placement?: "center" | "bottom" | "right";
};

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Hexavante",
    description:
      "Sua plataforma para estudar com foco: cursos, simulados, ranking e estatísticas em um só lugar.",
    placement: "center",
  },
  {
    id: "continue",
    title: "Retome em um clique",
    description:
      "Aqui você volta direto para a última aula ou simulado — sem perder tempo procurando.",
    target: '[data-tour="study-continue"]',
    placement: "bottom",
  },
  {
    id: "command",
    title: "Central de estudos",
    description:
      "Pendências do dia, notificações e atalhos rápidos ficam organizados nesta área.",
    target: '[data-tour="dashboard-command"]',
    placement: "bottom",
  },
  {
    id: "gamification",
    title: "XP e moedas",
    description:
      "Acompanhe seu nível e saldo no topo. Estudar gera XP; moedas liberam personalização na loja.",
    target: '[data-tour="header-gamification"]',
    placement: "bottom",
  },
  {
    id: "stats",
    title: "Suas estatísticas",
    description:
      "Resumo do progresso na introdução. A página completa em Estatísticas traz XP, simulados e sequência.",
    target: '[data-tour="personal-stats"]',
    placement: "bottom",
  },
  {
    id: "recommendations",
    title: "Cursos recomendados",
    description: "Sugestões com base no que você já estuda — ideal para expandir sua trilha.",
    target: '[data-tour="course-recommendations"]',
    placement: "bottom",
  },
  {
    id: "navigation",
    title: "Menu de navegação",
    description:
      "No celular, use o botão ☰ no topo. No desktop, o menu lateral traz cursos, simulados e comunidade.",
    target: '[data-tour="sidebar-nav"]',
    mobileTarget: '[data-tour="sidebar-toggle"]',
    placement: "bottom",
  },
  {
    id: "done",
    title: "Tudo pronto!",
    description:
      "Explore a introdução, abra Estatísticas quando quiser detalhes e comece sua próxima aula agora.",
    placement: "center",
  },
];

type Props = {
  show: boolean;
};

type Rect = { top: number; left: number; width: number; height: number };

const CARD_WIDTH = 352;
const PAD = 8;

function resolveStepTarget(step: TourStep, isMobile: boolean): string | undefined {
  if (isMobile && step.mobileTarget) return step.mobileTarget;
  return step.target;
}

function SpotlightOverlay({
  rect,
  onDismiss,
}: {
  rect: Rect | null;
  onDismiss: () => void;
}) {
  if (!rect) {
    return (
      <button
        type="button"
        className="absolute inset-0 bg-black/78"
        onClick={onDismiss}
        aria-label="Fechar tour"
      />
    );
  }

  const top = Math.max(0, rect.top - PAD);
  const left = Math.max(0, rect.left - PAD);
  const width = rect.width + PAD * 2;
  const height = rect.height + PAD * 2;
  const panel = "absolute bg-black/78";

  return (
    <>
      <button type="button" className={cn(panel, "inset-x-0 top-0")} style={{ height: top }} onClick={onDismiss} aria-label="Fechar tour" />
      <button type="button" className={panel} style={{ top, left: 0, width: left, height }} onClick={onDismiss} aria-hidden />
      <button
        type="button"
        className={panel}
        style={{ top, left: left + width, right: 0, height }}
        onClick={onDismiss}
        aria-hidden
      />
      <button
        type="button"
        className={panel}
        style={{ top: top + height, left: 0, right: 0, bottom: 0 }}
        onClick={onDismiss}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute rounded-xl ring-2 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
        style={{ top, left, width, height }}
      />
    </>
  );
}

function OnboardingTourActive({ onDismiss }: { onDismiss: () => void }) {
  const isMobile = useIsMobile();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties | undefined>(undefined);
  const [anchorBottom, setAnchorBottom] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const rafRef = useRef<number | null>(null);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;
  const isCenter = !resolveStepTarget(step, isMobile) || step.placement === "center";

  const updateTarget = useCallback(() => {
    const selector = resolveStepTarget(step, isMobile);

    if (!selector) {
      setTargetRect(null);
      setCardStyle(undefined);
      setAnchorBottom(false);
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      setTargetRect(null);
      setCardStyle(undefined);
      setAnchorBottom(false);
      return;
    }

    if (!isMobile) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    } else {
      el.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
    }

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        setTargetRect(null);
        setCardStyle(undefined);
        setAnchorBottom(isMobile);
        return;
      }

      const nextRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
      setTargetRect(nextRect);

      if (isMobile || step.placement === "center" || !step.placement) {
        setCardStyle(undefined);
        setAnchorBottom(isMobile && Boolean(selector));
        return;
      }

      setAnchorBottom(false);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cardW = Math.min(CARD_WIDTH, viewportWidth - 32);
      const margin = 16;

      if (step.placement === "right") {
        const left = Math.min(
          nextRect.left + nextRect.width + margin,
          viewportWidth - cardW - margin,
        );
        const top = Math.min(
          Math.max(margin, nextRect.top),
          viewportHeight - 280 - margin,
        );
        setCardStyle({ top, left, width: cardW });
        return;
      }

      const belowTop = nextRect.top + nextRect.height + 14;
      const fitsBelow = belowTop + 260 < viewportHeight - margin;
      const top = fitsBelow
        ? belowTop
        : Math.max(margin, nextRect.top - 260 - 14);
      const left = Math.min(
        Math.max(margin, nextRect.left),
        viewportWidth - cardW - margin,
      );
      setCardStyle({ top, left, width: cardW });
    };

    window.setTimeout(measure, isMobile ? 80 : 240);
  }, [isMobile, step]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const rafId = requestAnimationFrame(updateTarget);

    const onLayoutChange = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTarget);
    };

    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);
    return () => {
      cancelAnimationFrame(rafId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [stepIndex, updateTarget]);

  async function finish() {
    setFinishing(true);
    try {
      await completeOnboardingTourAction();
      onDismiss();
    } catch {
      onDismiss();
    } finally {
      setFinishing(false);
    }
  }

  async function handleNext() {
    if (isLast) {
      await finish();
      return;
    }
    setStepIndex((index) => index + 1);
  }

  function handleBack() {
    if (isFirst) return;
    setStepIndex((index) => index - 1);
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal aria-label="Tour de boas-vindas">
      <SpotlightOverlay rect={isCenter ? null : targetRect} onDismiss={() => void finish()} />

      <div
        className={cn(
          "absolute z-[101] w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0b1018] shadow-2xl shadow-black/50",
          isCenter && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          anchorBottom &&
            "bottom-[max(1rem,env(safe-area-inset-bottom,1rem))] left-1/2 top-auto -translate-x-1/2 translate-y-0",
        )}
        style={!anchorBottom && !isCenter ? cardStyle : undefined}
      >
        <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/10 via-transparent to-sky-400/10 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {isCenter ? (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-400/25 bg-black/40 p-1.5 sm:h-11 sm:w-11">
                  <Image
                    src="/brand/hexavante-logo.webp"
                    alt=""
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                    aria-hidden
                  />
                </span>
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 sm:h-10 sm:w-10">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/90 sm:text-[11px]">
                  Passo {stepIndex + 1} de {TOUR_STEPS.length}
                </p>
                <h2 className="mt-0.5 text-base font-bold text-white sm:mt-1 sm:text-lg">{step.title}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void finish()}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="text-sm leading-6 text-slate-300 sm:leading-7">{step.description}</p>

          <div className="mt-3 flex gap-1.5 sm:mt-4">
            {TOUR_STEPS.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition",
                  index <= stepIndex ? "bg-cyan-400" : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={() => void finish()}
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Pular
          </button>

          <div className="flex items-center gap-2">
            {!isFirst ? (
              <Button type="button" variant="outline" onClick={handleBack} className="min-h-9 sm:min-h-10">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            ) : null}
            <Button onClick={() => void handleNext()} disabled={finishing} className="min-h-9 sm:min-h-10">
              {finishing ? "Salvando..." : isLast ? "Começar" : "Próximo"}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TourPortal({ onDismiss }: { onDismiss: () => void }) {
  return createPortal(<OnboardingTourActive onDismiss={onDismiss} />, document.body);
}

export function OnboardingTour({ show }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <ClientOnly>
      <TourPortal onDismiss={() => setDismissed(true)} />
    </ClientOnly>
  );
}

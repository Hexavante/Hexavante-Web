"use client";

/**
 * Tutorial em vídeo (substitui o antigo tour passo-a-passo).
 *
 * Modal centralizado com o vídeo no meio e dois botões:
 *  - "Pular tutorial"            → completeOnboardingTourAction() e fecha, sem recompensa;
 *  - "Assistir e ganhar 100 moedas" → dá play; a recompensa SÓ é resgatada no
 *    `onEnded` (fechar no meio = pular, sem moedas).
 *
 * Fonte do vídeo é única e configurável (NEXT_PUBLIC_TUTORIAL_VIDEO_URL).
 * Sem arquivo/URL não há como "assistir", então o botão de recompensa fica
 * DESABILITADO com aviso (nunca completa sem recompensa: quem não assistiu
 * não ganha — a única saída é "Pular tutorial").
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Coins, Play, Sparkles, X } from "lucide-react";
import {
  claimTutorialVideoRewardAction,
  completeOnboardingTourAction,
  type ClaimTutorialRewardResult,
} from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";

const VIDEO_SRC = process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_URL ?? "/videos/tutorial.mp4";
/** Sem fonte configurada não há o que reproduzir (ver fallback no JSX). */
const hasVideoSource = VIDEO_SRC.trim().length > 0;

type Phase = "ready" | "playing" | "reward";

type Props = {
  show: boolean;
};

type ActiveProps = {
  onDismiss: () => void;
};

function TutorialVideoModalActive({ onDismiss }: ActiveProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const secondaryRef = useRef<HTMLButtonElement>(null);
  /** Evita complete duplicado (X/ESC depois do onEnded, double clique no Pular). */
  const completedRef = useRef(false);
  /** onEnded pode disparar mais de uma vez em alguns navegadores. */
  const rewardedRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  /** true quando o arquivo não existe/carrega (404, rede) ou não há fonte. */
  const [videoFailed, setVideoFailed] = useState(!hasVideoSource);
  const [reward, setReward] = useState<ClaimTutorialRewardResult | null>(null);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(true);
    onDismiss();
  }, [onDismiss]);

  /** Pular (X, ESC, overlay ou botão): completa o onboarding SEM recompensa. */
  const skip = useCallback(async () => {
    if (completedRef.current) {
      close();
      return;
    }
    completedRef.current = true;
    try {
      await completeOnboardingTourAction();
    } catch {
      // Server Action indisponível: fecha mesmo assim, sem quebrar a UI.
    }
    close();
  }, [close]);

  const handleEnded = useCallback(async () => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    setPhase("reward");

    let result: ClaimTutorialRewardResult;
    try {
      result = await claimTutorialVideoRewardAction();
    } catch {
      result = { success: false, error: "Não foi possível resgatar a recompensa." };
    }
    setReward(result);

    // O tutorial foi assistido até o fim: o onboarding encerra mesmo que o
    // resgate falhe (ex.: sessão expirou) — só a moeda fica pendente.
    if (!completedRef.current) {
      completedRef.current = true;
      try {
        await completeOnboardingTourAction();
      } catch {
        // ignora: o modal fecha de qualquer forma
      }
    }

    closeTimer.current = setTimeout(close, 1500);
  }, [close]);

  const handleWatch = useCallback(async () => {
    if (!hasVideoSource || videoFailed) return;
    setPhase("playing");
    try {
      await videoRef.current?.play();
    } catch {
      // play() rejeitou (fonte inválida / política do navegador): volta e
      // deixa o fallback de "Vídeo em breve" assumir via onError.
      setPhase("ready");
      setVideoFailed(true);
    }
  }, [videoFailed]);

  // Foco no botão principal; se o vídeo não está disponível (primário
  // desabilitado), foca o "Pular tutorial" para manter um alvo focável.
  useEffect(() => {
    const primary = primaryRef.current;
    if (primary && !primary.disabled) primary.focus();
    else secondaryRef.current?.focus();
  }, [videoFailed]);

  // ESC fecha = pular; trava o scroll do body enquanto o modal está aberto.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void skip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [skip]);

  const showFallback = videoFailed;
  const watching = phase === "playing";
  const rewarding = phase === "reward";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/78 p-4"
      onClick={() => void skip()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hx-tutorial-video-title"
        className="hx-dark-surface w-[min(96vw,44rem)] overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0b1018] shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-400/10 via-transparent to-sky-400/10 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 sm:h-10 sm:w-10">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/90 sm:text-[11px]">
                Tutorial
              </p>
              <h2 id="hx-tutorial-video-title" className="mt-0.5 text-base font-bold text-white sm:mt-1 sm:text-lg">
                Conheça o Hexavante em vídeo
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void skip()}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar tutorial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="mx-auto w-[min(92vw,40rem)]">
            {showFallback ? (
              <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-cyan-400/25 bg-black/40 px-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-white">Vídeo em breve</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">
                    O tutorial ainda não está disponível. Você pode pular por
                    enquanto e assistir quando ele for publicado.
                  </p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                data-testid="tutorial-video"
                src={VIDEO_SRC}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full rounded-xl border border-white/10 bg-black"
                onEnded={() => void handleEnded()}
                onError={() => setVideoFailed(true)}
              />
            )}
          </div>

          <div aria-live="polite" className="mt-4 min-h-9">
            {rewarding && (
              <div className="hx-tutorial-reward flex items-center justify-center gap-2">
                {reward?.success ? (
                  <>
                    <Coins className="h-5 w-5 text-amber-300" />
                    <span className="text-lg font-black text-amber-300">+100 moedas</span>
                    <span className="text-sm text-slate-300">
                      {reward.alreadyClaimed ? "já resgatadas" : "recebidas!"}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">
                    {reward?.error ?? "Resgatando recompensa…"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <button
            ref={secondaryRef}
            type="button"
            onClick={() => void skip()}
            disabled={closing || rewarding}
            className="text-sm text-slate-400 transition hover:text-white disabled:opacity-60"
          >
            Pular tutorial
          </button>

          {rewarding ? (
            <Button ref={primaryRef} onClick={close} className="min-h-9 sm:min-h-10">
              Começar
            </Button>
          ) : (
            <Button
              ref={primaryRef}
              onClick={() => void handleWatch()}
              disabled={!hasVideoSource || videoFailed || watching || closing}
              className="min-h-9 sm:min-h-10"
            >
              {watching ? "Assistindo…" : "Assistir e ganhar 100 moedas"}
              {!watching && <Play className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {!hasVideoSource || videoFailed ? (
          <p className="border-t border-white/10 px-4 py-2.5 text-center text-xs text-amber-300/90 sm:px-5">
            O vídeo do tutorial ainda não está disponível — a recompensa só pode
            ser resgatada assistindo até o fim.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TutorialVideoPortal({ onDismiss }: ActiveProps) {
  return createPortal(<TutorialVideoModalActive onDismiss={onDismiss} />, document.body);
}

export function TutorialVideoModal({ show }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <ClientOnly>
      <TutorialVideoPortal onDismiss={() => setDismissed(true)} />
    </ClientOnly>
  );
}

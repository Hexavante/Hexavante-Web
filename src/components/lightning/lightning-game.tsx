"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coins,
  Flame,
  Send,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { submitLightningAction } from "@/app/actions/lightning";
import { LIGHTNING_TIME_LIMIT_SECONDS } from "@/services/lightning-challenge.service";
import { dispatchAchievementUnlocked } from "@/lib/achievement-events";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { LightningQuestion, LightningResult } from "@/services/lightning-challenge.service";

type Props = {
  questions: LightningQuestion[];
  timeLimitSeconds?: number;
};

type Phase = "ready" | "playing" | "submitting" | "done";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatSeconds(total: number): string {
  const s = Math.max(0, total);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function maxStreak(flags: boolean[]): number {
  let best = 0;
  let cur = 0;
  for (const f of flags) {
    cur = f ? cur + 1 : 0;
    if (cur > best) best = cur;
  }
  return best;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function LightningGame({ questions, timeLimitSeconds = LIGHTNING_TIME_LIMIT_SECONDS }: Props) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(timeLimitSeconds);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<LightningResult | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const startedAtRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const total = questions.length;
  const active = questions[index];
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [questions, answers],
  );

  const doSubmit = useCallback(
    async (finalAnswers: Record<string, string>, elapsed: number) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase("submitting");
      setSubmitError(null);

      const payload = questions
        .filter((q) => finalAnswers[q.id])
        .map((q) => ({ questionId: q.id, alternativeId: finalAnswers[q.id] }));

      // Sem respostas: evita chamada inútil ao servidor.
      if (payload.length === 0) {
        const res = await submitLightningAction([], elapsed);
        if (res.played) {
          setAlreadyPlayed(true);
          setPhase("done");
          router.refresh();
          return;
        }
        setSubmitError(res.error ?? "Responda ao menos uma questão para enviar.");
        setPhase("playing");
        submittedRef.current = false;
        return;
      }

      const res = await submitLightningAction(payload, elapsed);
      if (!res.success) {
        setSubmitError(res.error ?? "Erro ao enviar o desafio.");
        setPhase("playing");
        submittedRef.current = false;
        return;
      }
      if (res.played || !res.result) {
        setAlreadyPlayed(true);
        setPhase("done");
        router.refresh();
        return;
      }
      setResult(res.result);
      setPhase("done");
      if (res.newAchievementKeys?.length) {
        dispatchAchievementUnlocked(res.newAchievementKeys);
      }
      router.refresh();
    },
    [questions, router],
  );

  // Countdown durante o jogo; ao zerar, envia automaticamente.
  useEffect(() => {
    if (phase !== "playing") return;
    if (remaining <= 0) {
      const elapsed = Math.min(
        Math.floor((Date.now() - startedAtRef.current) / 1000),
        timeLimitSeconds,
      );
      void doSubmit(answers, elapsed);
      return;
    }
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, remaining, answers, doSubmit, timeLimitSeconds]);

  const start = () => {
    startedAtRef.current = Date.now();
    setRemaining(timeLimitSeconds);
    setPhase("playing");
  };

  const selectAlternative = useCallback(
    (questionId: string, alternativeId: string) => {
      if (phase !== "playing") return;
      setAnswers((prev) => ({ ...prev, [questionId]: alternativeId }));
    },
    [phase],
  );

  // Navegação por teclado: 1-6 / A-F selecionam, setas trocam de questão,
  // Enter avança (ou envia na última).
  useEffect(() => {
    if (phase !== "playing" || !active) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
      const key = e.key.toUpperCase();
      const letterIdx = LETTERS.indexOf(key);
      const numIdx = ["1", "2", "3", "4", "5", "6"].indexOf(e.key);
      const optIdx = letterIdx >= 0 ? letterIdx : numIdx;
      if (optIdx >= 0 && optIdx < active.alternatives.length) {
        e.preventDefault();
        selectAlternative(active.id, active.alternatives[optIdx].id);
        optionRefs.current[optIdx]?.focus();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, total - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (index < total - 1) {
          setIndex(index + 1);
        } else {
          const elapsed = Math.min(
            Math.floor((Date.now() - startedAtRef.current) / 1000),
            timeLimitSeconds,
          );
          void doSubmit(answers, elapsed);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, active, index, total, answers, doSubmit, selectAlternative, timeLimitSeconds]);

  // Move o foco para a pergunta ao trocar (acessibilidade).
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (phase === "playing") headingRef.current?.focus();
  }, [index, phase]);

  const critical = remaining <= 10;
  const resultFlags = result ? questions.map((q) => result.answers.find((a) => a.questionId === q.id)?.correct ?? false) : [];
  const bestStreak = result ? maxStreak(resultFlags) : 0;
  const allCorrect = result != null && result.score === result.totalQuestions && result.totalQuestions > 0;

  if (phase === "done") {
    if (alreadyPlayed) {
      return (
        <Card padding="lg" className="text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-300" />
          <CardTitle className="mt-3">Você já jogou hoje!</CardTitle>
          <CardDescription>
            O Desafio Relâmpago permite 1 tentativa por dia. Volte amanhã para uma nova sequência.
          </CardDescription>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                router.push("/desafio-relampago");
                router.refresh();
              }}
            >
              Ver resultado de hoje
            </Button>
          </div>
        </Card>
      );
    }
    if (!result) return null;
    return (
      <section aria-live="polite" aria-label="Resultado do Desafio Relâmpago">
        <Card padding="lg" className="text-center">
          {allCorrect && !reducedMotion ? (
            <p aria-hidden className="text-4xl">⚡🏆⚡</p>
          ) : (
            <Trophy className="mx-auto h-10 w-10 text-amber-300" />
          )}
          <p className="mt-3 text-xs font-bold uppercase tracking-wide hx-accent-text">
            Desafio concluído
          </p>
          <h2 className="mt-1 text-3xl font-black hx-text-title">
            {result.score}/{result.totalQuestions} acertos
          </h2>
          {allCorrect && (
            <p className="mt-2 text-sm font-semibold text-amber-200">
              Pontuação perfeita! Bônus de +30 XP aplicado. 🎉
            </p>
          )}
          <div className="mx-auto mt-5 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <Zap className="mx-auto h-4 w-4 text-amber-300" />
              <p className="mt-1 text-xl font-black text-white">+{result.xpAwarded}</p>
              <p className="text-xs text-slate-400">XP</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <Coins className="mx-auto h-4 w-4 text-yellow-300" />
              <p className="mt-1 text-xl font-black text-white">+{result.coinsAwarded}</p>
              <p className="text-xs text-slate-400">moedas</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <Flame className="mx-auto h-4 w-4 text-orange-300" />
              <p className="mt-1 text-xl font-black text-white">{bestStreak}x</p>
              <p className="text-xs text-slate-400">sequência</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <Clock3 className="mx-auto h-4 w-4 text-cyan-300" />
              <p className="mt-1 text-xl font-black text-white">{formatSeconds(result.timeUsedSeconds)}</p>
              <p className="text-xs text-slate-400">tempo usado</p>
            </div>
          </div>

          <ol className="mx-auto mt-6 max-w-lg space-y-2 text-left">
            {questions.map((q, i) => {
              const ok = resultFlags[i];
              return (
                <li
                  key={q.id}
                  className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                >
                  {ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                  )}
                  <span className="hx-text-body">
                    <strong>Q{i + 1}:</strong> {ok ? "acertou" : "errou"}
                    {q.subject ? <span className="text-slate-500"> · {q.subject}</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/simulados")}>
              Praticar simulados
            </Button>
            {/* O XP do relâmpago é registrado como transação de XP, visível em /historico?aba=atividades. */}
            <Button onClick={() => router.push("/historico?aba=atividades")}>
              Ver histórico
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (phase === "ready") {
    return (
      <Card padding="lg" className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-200">
          <Zap className="h-7 w-7" />
        </span>
        <CardTitle className="mt-4 text-xl">Pronto para o relâmpago?</CardTitle>
        <CardDescription>
          {total} questões de múltipla escolha em {formatSeconds(timeLimitSeconds)}. O cronômetro
          começa ao tocar em iniciar — responda rápido, cada acerto vale 15 XP + 3 moedas.
        </CardDescription>
        <div className="mt-5">
          <Button size="lg" onClick={start}>
            <Zap className="h-4 w-4" />
            Iniciar desafio
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Teclado: 1–{Math.min(total > 0 ? (active?.alternatives.length ?? 4) : 4, 6)} ou A–
          {LETTERS[Math.min((active?.alternatives.length ?? 4) - 1, 5)]} selecionam · setas navegam ·
          Enter avança/envia.
        </p>
      </Card>
    );
  }

  if (!active) return null;

  const selected = answers[active.id];
  const elapsed = timeLimitSeconds - remaining;

  return (
    <div>
      <div
        role="timer"
        aria-label={`Tempo restante: ${formatSeconds(remaining)}`}
        className={cn(
          "flex items-center justify-between rounded-xl border px-3 py-3 backdrop-blur sm:px-4",
          critical
            ? "border-red-400/40 bg-red-500/10"
            : remaining <= 20
              ? "border-amber-400/40 bg-amber-500/10"
              : "border-white/10 bg-slate-950/80",
        )}
      >
        <span className="flex items-center gap-2 text-sm text-slate-300">
          <Clock3 className="h-4 w-4" />
          Tempo restante
        </span>
        <span
          aria-hidden
          className={cn(
            "font-mono text-lg font-bold",
            critical ? "text-red-300" : remaining <= 20 ? "text-amber-300" : "text-white",
          )}
        >
          {formatSeconds(remaining)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total} aria-label={`Questão ${index + 1} de ${total}`}>
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ir para a questão ${i + 1}${answers[q.id] ? " (respondida)" : ""}`}
            className={cn(
              "h-2 flex-1 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
              i === index
                ? "bg-amber-300"
                : answers[q.id]
                  ? "bg-emerald-400/70"
                  : "bg-white/10 hover:bg-white/20",
            )}
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400" aria-live="polite">
        Questão {index + 1} de {total} · {answeredCount}/{total} respondidas ·{" "}
        {formatSeconds(elapsed)} decorridos
      </p>

      <Card padding="lg" className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="amber">
            Q{index + 1}/{total}
          </Badge>
          {active.subject && <Badge variant="default">{active.subject}</Badge>}
          {selected && (
            <Badge variant="emerald">
              <CheckCircle2 className="h-3 w-3" /> respondida
            </Badge>
          )}
        </div>

        <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-lg font-bold leading-snug hx-text-title focus:outline-none">
          {active.statement}
        </h2>

        <div className="mt-4 grid gap-2" role="radiogroup" aria-label={`Alternativas da questão ${index + 1}`}>
          {active.alternatives.map((alt, i) => {
            const isSelected = selected === alt.id;
            return (
              <button
                key={alt.id}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => selectAlternative(active.id, alt.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
                  isSelected
                    ? "border-amber-300/60 bg-amber-400/10 font-semibold text-white"
                    : "border-white/10 bg-white/[0.03] hx-text-body hover:border-white/25 hover:bg-white/[0.06]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-black",
                    isSelected
                      ? "border-amber-300/60 bg-amber-300/20 text-amber-200"
                      : "border-white/15 bg-white/5 text-slate-400",
                  )}
                >
                  {LETTERS[i]}
                </span>
                <span className="min-w-0 flex-1">{alt.text}</span>
                {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-200" />}
              </button>
            );
          })}
        </div>

        {submitError && (
          <div className="mt-4">
            <Alert variant="danger">{submitError}</Alert>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0 || phase !== "playing"}
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          {index < total - 1 ? (
            <Button onClick={() => setIndex((i) => Math.min(i + 1, total - 1))} disabled={phase !== "playing"}>
              Próxima
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                const e = Math.min(
                  Math.floor((Date.now() - startedAtRef.current) / 1000),
                  timeLimitSeconds,
                );
                void doSubmit(answers, e);
              }}
              disabled={phase !== "playing"}
            >
              {phase === "submitting" ? (
                "Enviando…"
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar ({answeredCount}/{total})
                </>
              )}
            </Button>
          )}
        </div>
        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <Sparkles className="h-3 w-3" />
          O tempo esgotando envia automaticamente com as respostas marcadas.
        </p>
      </Card>
    </div>
  );
}

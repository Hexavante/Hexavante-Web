"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { submitExamAction, submitExamTimeoutAction, type ActionResult } from "@/app/actions/exam";
import { ExamQuestionImage } from "@/components/exams/exam-question-image";
import { ExamTimer } from "@/components/exams/exam-timer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { indexToAlternativeLetter } from "@/lib/exam-alternatives";

type Question = {
  id: string;
  statement: string;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageDisplaySize?: "SMALL" | "MEDIUM" | "LARGE" | "FULL" | null;
  orderNumber: number;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  alternatives: { id: string; text: string }[];
};

type ExamFormProps = {
  slug: string;
  attemptId: string;
  title: string;
  questions: Question[];
  startedAt: string;
  timeLimitMinutes?: number | null;
};

const initialState: ActionResult = { success: false };
const ESSAY_MAX = 4000;
const PAGINATED_THRESHOLD = 15;

export function ExamForm({
  slug,
  attemptId,
  title,
  questions,
  startedAt,
  timeLimitMinutes,
}: ExamFormProps) {
  const isPaginated = questions.length >= PAGINATED_THRESHOLD;
  const [state, formAction, pending] = useActionState(submitExamAction, initialState);
  const [, timeoutAction, timeoutPending] = useActionState(submitExamTimeoutAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutFormRef = useRef<HTMLFormElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<Record<string, string>>({});
  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const activeQuestion = questions[activeIndex];
  const activeQuestionId = activeQuestion?.id ?? "";

  // Restaura rascunhos do sessionStorage após hidratação (sem branch window no render).
  useEffect(() => {
    const drafts: Record<string, string> = {};
    const choices: Record<string, string> = {};
    const map: Record<string, boolean> = {};
    try {
    for (const question of questions) {
      if (question.type !== "ESSAY") {
        const choice = sessionStorage.getItem(`exam-choice-${attemptId}-${question.id}`);
        if (choice && question.alternatives.some((alt) => alt.id === choice)) {
          choices[question.id] = choice;
          map[question.id] = true;
        }
        continue;
      }
      const saved = sessionStorage.getItem(`exam-essay-${attemptId}-${question.id}`);
      if (saved) {
        drafts[question.id] = saved;
        map[question.id] = saved.trim().length > 0;
      }
    }
    } catch { return; }
    if (Object.keys(map).length === 0) return;

    const id = window.setTimeout(() => {
      setEssayDrafts(drafts);
      setMcAnswers(choices);
      setAnswered((prev) => ({ ...prev, ...map }));
    }, 0);
    return () => window.clearTimeout(id);
  }, [questions, attemptId]);

  const syncTimeoutForm = useCallback(() => {
    const main = formRef.current;
    const timeout = timeoutFormRef.current;
    if (!main || !timeout) return;

    for (const question of questions) {
      if (question.type === "ESSAY") {
        const essayInput = timeout.querySelector<HTMLTextAreaElement>(
          `textarea[name="essay_${question.id}"]`,
        );
        if (essayInput) {
          essayInput.value = essayDrafts[question.id] ?? "";
        }
        continue;
      }

      const answerId = isPaginated
        ? mcAnswers[question.id]
        : main.querySelector<HTMLInputElement>(`input[name="q_${question.id}"]:checked`)?.value;
      const hidden = timeout.querySelector<HTMLInputElement>(`input[name="q_${question.id}"]`);
      if (hidden && answerId) hidden.value = answerId;
    }
  }, [questions, essayDrafts, isPaginated, mcAnswers]);

  const handleExpire = useCallback(() => {
    const main = formRef.current;
    const timeout = timeoutFormRef.current;
    if (!main) return;

    if (timeLimitMinutes && timeout) {
      syncTimeoutForm();
      timeout.requestSubmit();
      return;
    }

    main.requestSubmit();
  }, [timeLimitMinutes, syncTimeoutForm]);

  const markAnswered = (questionId: string) => {
    setAnswered((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleEssayChange = (questionId: string, value: string) => {
    const trimmed = value.slice(0, ESSAY_MAX);
    setEssayDrafts((prev) => ({ ...prev, [questionId]: trimmed }));
    try { sessionStorage.setItem(`exam-essay-${attemptId}-${questionId}`, trimmed); } catch { /* A resposta continua em memória. */ }
    setAnswered((prev) => ({ ...prev, [questionId]: trimmed.trim().length > 0 }));
    if (isPaginated) {
      const idx = questions.findIndex((q) => q.id === questionId);
      if (idx >= 0) setActiveIndex(idx);
    }
  };

  const handleMcChange = (questionId: string, alternativeId: string) => {
    setMcAnswers((prev) => ({ ...prev, [questionId]: alternativeId }));
    try { sessionStorage.setItem(`exam-choice-${attemptId}-${questionId}`, alternativeId); } catch { /* A resposta continua em memória. */ }
    markAnswered(questionId);
    if (isPaginated) {
      const idx = questions.findIndex((q) => q.id === questionId);
      if (idx >= 0) setActiveIndex(idx);
    }
  };

  const goToQuestion = (index: number) => {
    setActiveIndex(index);
    if (!isPaginated) {
      const question = questions[index];
      if (question) {
        document.getElementById(`question-${question.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  const answeredCount = Object.values(answered).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {timeLimitMinutes ? (
        <ExamTimer
          mode="countdown"
          startedAt={startedAt}
          attemptId={attemptId}
          timeLimitMinutes={timeLimitMinutes}
          onExpire={handleExpire}
        />
      ) : (
        <ExamTimer mode="elapsed" startedAt={startedAt} attemptId={attemptId} />
      )}

      {isPaginated && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-200">
              Questão {activeIndex + 1} de {questions.length}
            </span>
            <span className="text-slate-400">
              {answeredCount}/{questions.length} respondidas
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-label="Progresso do simulado"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-sky-400 transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {questions.map((question, index) => (
          <button
            key={question.id}
            type="button"
            onClick={() => goToQuestion(index)}
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition",
              (isPaginated ? index === activeIndex : activeQuestionId === question.id)
                ? "border-teal-400/50 bg-teal-400/15 text-teal-200"
                : answered[question.id]
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-sky-400/30",
            )}
            aria-label={`Questão ${question.orderNumber}`}
            aria-current={isPaginated && index === activeIndex ? "step" : undefined}
          >
            {question.orderNumber}
          </button>
        ))}
      </div>

      <form ref={formRef} action={formAction} className="space-y-8">
        <input type="hidden" name="attemptId" value={attemptId} />
        <input type="hidden" name="slug" value={slug} />

        {isPaginated ? (
          activeQuestion ? (
            <QuestionField
              question={activeQuestion}
              essayDrafts={essayDrafts}
              mcAnswers={mcAnswers}
              onEssayChange={handleEssayChange}
              onMcChange={handleMcChange}
            />
          ) : null
        ) : (
          questions.map((question) => (
            <QuestionField
              key={question.id}
              question={question}
              essayDrafts={essayDrafts}
              mcAnswers={mcAnswers}
              onEssayChange={handleEssayChange}
              onMcChange={handleMcChange}
              showInDocument
            />
          ))
        )}

        {isPaginated &&
          questions.map((question) =>
            question.type === "ESSAY" ? (
              <input
                key={question.id}
                type="hidden"
                name={`essay_${question.id}`}
                value={essayDrafts[question.id] ?? ""}
              />
            ) : mcAnswers[question.id] ? (
              <input
                key={question.id}
                type="hidden"
                name={`q_${question.id}`}
                value={mcAnswers[question.id]}
              />
            ) : null,
          )}

        {isPaginated && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={activeIndex === 0}
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={activeIndex >= questions.length - 1}
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setActiveIndex((index) => Math.min(questions.length - 1, index + 1))}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {state.error && (
          <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending || timeoutPending} className="min-h-11 w-full sm:w-auto">
          {pending ? "Corrigindo..." : `Finalizar ${title}`}
        </Button>
      </form>

      {timeLimitMinutes ? (
        <form ref={timeoutFormRef} action={timeoutAction} className="hidden" aria-hidden>
          <input type="hidden" name="attemptId" value={attemptId} />
          <input type="hidden" name="slug" value={slug} />
          {questions.map((question) =>
            question.type === "ESSAY" ? (
              <textarea key={question.id} name={`essay_${question.id}`} defaultValue="" rows={1} />
            ) : (
              <input key={question.id} type="hidden" name={`q_${question.id}`} defaultValue="" />
            ),
          )}
        </form>
      ) : null}
    </div>
  );
}

type QuestionFieldProps = {
  question: Question;
  essayDrafts: Record<string, string>;
  mcAnswers: Record<string, string>;
  onEssayChange: (questionId: string, value: string) => void;
  onMcChange: (questionId: string, alternativeId: string) => void;
  showInDocument?: boolean;
};

function QuestionField({
  question,
  essayDrafts,
  mcAnswers,
  onEssayChange,
  onMcChange,
  showInDocument = false,
}: QuestionFieldProps) {
  const useNativeInputs = showInDocument;

  return (
    <fieldset
      id={showInDocument ? `question-${question.id}` : undefined}
      className="scroll-mt-28 rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/15 sm:p-5"
    >
      <legend className="mb-3 block w-full text-base font-semibold text-white">
        <span className="block break-words">
          {question.orderNumber}. {question.statement}
          {question.type === "ESSAY" && (
            <span className="ml-2 text-xs font-normal text-amber-300">(Dissertativa)</span>
          )}
        </span>
        <ExamQuestionImage
          url={question.imageUrl}
          naturalWidth={question.imageWidth}
          naturalHeight={question.imageHeight}
          displaySize={question.imageDisplaySize}
          alt={`Imagem da questão ${question.orderNumber}`}
        />
      </legend>

      {question.type === "ESSAY" ? (
        <div className="space-y-2">
          {useNativeInputs ? (
            <Textarea
              name={`essay_${question.id}`}
              rows={12}
              maxLength={ESSAY_MAX}
              value={essayDrafts[question.id] ?? ""}
              onChange={(event) => onEssayChange(question.id, event.target.value)}
              placeholder="Digite sua resposta..."
              required
            />
          ) : (
            <Textarea
              rows={12}
              maxLength={ESSAY_MAX}
              value={essayDrafts[question.id] ?? ""}
              onChange={(event) => onEssayChange(question.id, event.target.value)}
              placeholder="Digite sua resposta..."
            />
          )}
          <p className="text-right text-xs text-slate-500">
            {(essayDrafts[question.id] ?? "").length}/{ESSAY_MAX} caracteres
          </p>
        </div>
      ) : question.alternatives.length === 0 ? (
        <p className="text-sm text-amber-300">
          Esta questão não possui alternativas cadastradas. Avise o suporte.
        </p>
      ) : (
        <div className="space-y-2">
          {question.alternatives.map((alt, index) => (
            <label
              key={alt.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-slate-950/35 px-3 py-3 transition hover:border-teal-400/30 hover:bg-teal-400/10 sm:py-2.5"
            >
              <input
                type="radio"
                name={useNativeInputs ? `q_${question.id}` : undefined}
                value={alt.id}
                checked={mcAnswers[question.id] === alt.id}
                required={useNativeInputs}
                className="mt-1.5 h-5 w-5 shrink-0 accent-teal-400"
                onChange={() => onMcChange(question.id, alt.id)}
              />
              <span className="min-w-0 flex-1 text-sm leading-6 text-slate-300">
                <span className="mr-2 font-semibold text-teal-300">
                  {indexToAlternativeLetter(index)})
                </span>
                {alt.text}
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

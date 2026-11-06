"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateInstructorExam } from "@/app/actions/instructor-exam";
import type { InstructorExamEditInput } from "@/lib/instructor-exam-edit";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Initial = Omit<InstructorExamEditInput, "questions"> & {
  questions: (InstructorExamEditInput["questions"][number] & {
    essay: boolean;
  })[];
};
export function InstructorExamEditForm({
  id,
  revision,
  requestId,
  initial,
}: {
  id: string;
  revision: string;
  requestId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const changeQuestion = (
    index: number,
    values: Partial<Initial["questions"][number]>,
  ) =>
    setData((current) => ({
      ...current,
      questions: current.questions.map((q, i) =>
        i === index ? { ...q, ...values } : q,
      ),
    }));
  return (
    <form
      className="max-w-3xl space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        setBusy(true);
        setError("");
        try {
          const result = await updateInstructorExam(
            id,
            revision,
            requestId,
            data,
          );
          if ("error" in result) {
            setError(result.error ?? "Não foi possível salvar.");
            return;
          }
          router.push(
            "/instructor/simulados?enviado=1" +
              (result.newVersion ? "&novaVersao=1" : ""),
          );
          router.refresh();
        } catch {
          setError(
            "Não foi possível salvar. Suas alterações continuam aqui para tentar novamente.",
          );
        } finally {
          submitting.current = false;
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-6">
        <section className="hx-card space-y-4 p-5">
          <h2 className="font-semibold">Apresentação da prova</h2>
          <label className="block">
            Título
            <Input
              required
              minLength={3}
              maxLength={140}
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </label>
          <label className="block">
            Tipo de prova
            <NativeSelect
              value={data.examType}
              onChange={(e) =>
                setData({
                  ...data,
                  examType: e.target.value as Initial["examType"],
                })
              }
            >
              <option>ENEM</option>
              <option>VESTIBULAR</option>
              <option>TECNOLOGIA</option>
            </NativeSelect>
          </label>
          <label className="block">
            Descrição
            <textarea
              className="hx-input min-h-24 w-full"
              maxLength={20000}
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
            />
          </label>
          <label className="block">
            Tempo em minutos (opcional)
            <Input
              type="number"
              min={1}
              max={300}
              value={data.timeLimit ?? ""}
              onChange={(e) =>
                setData({
                  ...data,
                  timeLimit: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </label>
        </section>
        {data.questions.map((q, index) => (
          <fieldset key={q.id ?? index} className="hx-card space-y-4 p-5">
            <legend className="px-2 font-semibold">Questão {index + 1}</legend>
            <label className="block">
              Enunciado
              <textarea
                className="hx-input min-h-28 w-full"
                required
                minLength={5}
                maxLength={5000}
                value={q.statement}
                onChange={(e) =>
                  changeQuestion(index, { statement: e.target.value })
                }
              />
            </label>
            {q.essay ? (
              <label className="block">
                Resposta esperada
                <textarea
                  className="hx-input min-h-24 w-full"
                  maxLength={10000}
                  value={q.expectedAnswer}
                  onChange={(e) =>
                    changeQuestion(index, { expectedAnswer: e.target.value })
                  }
                />
              </label>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {q.alternatives.map((text, i) => (
                    <label key={i}>
                      Alternativa {String.fromCharCode(65 + i)}
                      <Input
                        required
                        maxLength={1500}
                        value={text}
                        onChange={(e) =>
                          changeQuestion(index, {
                            alternatives: q.alternatives.map((a, j) =>
                              i === j ? e.target.value : a,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="block">
                  Resposta correta
                  <NativeSelect
                    required
                    value={q.correct < 0 ? "" : q.correct}
                    onChange={(e) =>
                      changeQuestion(index, { correct: Number(e.target.value) })
                    }
                  >
                    <option value="" disabled>
                      Selecione o gabarito
                    </option>
                    {q.alternatives.map((_, i) => (
                      <option key={i} value={i}>
                        {String.fromCharCode(65 + i)}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={q.alternatives.length >= 6}
                    onClick={() =>
                      changeQuestion(index, {
                        alternatives: [...q.alternatives, ""],
                      })
                    }
                  >
                    Adicionar alternativa
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={q.alternatives.length <= 2}
                    onClick={() =>
                      changeQuestion(index, {
                        alternatives: q.alternatives.slice(0, -1),
                        correct:
                          q.correct === q.alternatives.length - 1
                            ? -1
                            : q.correct,
                      })
                    }
                  >
                    Remover última alternativa
                  </Button>
                </div>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              disabled={data.questions.length <= 1}
              onClick={() =>
                setData({
                  ...data,
                  questions: data.questions.filter((_, i) => i !== index),
                })
              }
            >
              Remover questão {index + 1}
            </Button>
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={data.questions.length >= 200}
            onClick={() =>
              setData({
                ...data,
                questions: [
                  ...data.questions,
                  {
                    statement: "",
                    alternatives: ["", "", "", ""],
                    correct: -1,
                    essay: false,
                  },
                ],
              })
            }
          >
            Adicionar questão
          </Button>
          <Button type="submit">
            {busy ? "Salvando…" : "Salvar e enviar para moderação"}
          </Button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

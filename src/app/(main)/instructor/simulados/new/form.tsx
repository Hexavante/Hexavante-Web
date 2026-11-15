"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitInstructorExam } from "@/app/actions/instructor-exam";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLeaveWarning } from "@/hooks/use-leave-warning";

const LETTERS = ["A", "B", "C", "D"];
const MAX_QUESTIONS = 50;

export function InstructorExamForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const nextKey = useRef(1);
  const [keys, setKeys] = useState([0]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  // Um simulado tem muita digitação: avisa antes de fechar a aba sem enviar.
  useLeaveWarning(dirty && !busy);

  return (
    <form
      className="max-w-3xl space-y-6"
      onChange={() => setDirty(true)}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        const text = (name: string) => String(data.get(name) ?? "");
        setBusy(true);
        setError("");
        try {
          const result = await submitInstructorExam(requestId, {
            title: text("title"),
            examType: text("type") as "ENEM" | "VESTIBULAR" | "TECNOLOGIA",
            questions: keys.map((key) => ({
              statement: text("q" + key),
              correct: Number(text("correct" + key)),
              alternatives: [0, 1, 2, 3].map((i) => text(key + "-a" + i)),
            })),
          });
          if (result.error) {
            setError(result.error);
            setBusy(false);
            return;
          }
          setDirty(false);
          router.push("/instructor/simulados?enviado=1");
        } catch {
          setError("Falha ao enviar. Suas questões continuam aqui.");
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-6">
        <section className="hx-card space-y-4 p-5">
          <h2 className="font-semibold">Apresentação da prova</h2>
          <div>
            <Label htmlFor="exam-title">Título</Label>
            <Input
              id="exam-title"
              name="title"
              required
              minLength={3}
              maxLength={140}
              placeholder="Ex.: Funções do 1º grau — 10 questões"
            />
          </div>
          <div>
            <Label htmlFor="exam-type">Tipo de prova</Label>
            <NativeSelect id="exam-type" name="type">
              <option value="ENEM">ENEM</option>
              <option value="VESTIBULAR">Vestibular</option>
              <option value="TECNOLOGIA">Tecnologia</option>
            </NativeSelect>
          </div>
          <p className="text-sm text-slate-500">
            Descrição, tempo de prova e mais alternativas por questão podem ser ajustados na edição,
            depois de enviar.
          </p>
        </section>

        {keys.map((key, index) => (
          <fieldset key={key} className="hx-card space-y-4 p-5">
            <legend className="px-2 font-semibold">Questão {index + 1}</legend>
            <div>
              <Label htmlFor={"q" + key}>Enunciado</Label>
              <textarea
                id={"q" + key}
                name={"q" + key}
                className="hx-input min-h-28 w-full"
                required
                minLength={5}
                maxLength={5000}
              />
            </div>
            <div>
              <p className="hx-label">Alternativas — marque a correta</p>
              <div className="space-y-2">
                {LETTERS.map((letter, i) => (
                  <div key={letter} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={"correct" + key}
                      value={i}
                      required
                      className="h-4 w-4 shrink-0 accent-emerald-500"
                      aria-label={`Alternativa ${letter} é a correta`}
                    />
                    <span className="w-4 shrink-0 text-sm font-semibold text-slate-400">{letter}</span>
                    <Input
                      name={key + "-a" + i}
                      required
                      maxLength={1500}
                      aria-label={`Texto da alternativa ${letter}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            {keys.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setKeys(keys.filter((item) => item !== key))}
              >
                Remover questão {index + 1}
              </Button>
            )}
          </fieldset>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            type="button"
            disabled={keys.length >= MAX_QUESTIONS}
            onClick={() => setKeys([...keys, nextKey.current++])}
          >
            Adicionar questão
          </Button>
          <Button type="submit">
            {busy ? "Enviando…" : "Enviar para moderação"}
          </Button>
          <span className="text-sm text-slate-500">
            {keys.length} de {MAX_QUESTIONS} questões
          </span>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

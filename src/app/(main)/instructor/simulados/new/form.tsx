"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitInstructorExam } from "@/app/actions/instructor-exam";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function InstructorExamForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const nextKey = useRef(1);
  const [keys, setKeys] = useState([0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="max-w-3xl space-y-5"
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
          router.push("/instructor/simulados?enviado=1");
        } catch {
          setError("Falha ao enviar. Suas questões continuam aqui.");
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-4">
        <label className="block">
          Título
          <Input name="title" required minLength={3} maxLength={140} />
        </label>
        <label className="block">
          Tipo de prova
          <NativeSelect name="type">
            <option>ENEM</option>
            <option>VESTIBULAR</option>
            <option>TECNOLOGIA</option>
          </NativeSelect>
        </label>
        {keys.map((key, index) => (
          <fieldset
            key={key}
            className="space-y-3 rounded-xl border border-[var(--border)] p-4"
          >
            <legend className="px-2 font-bold">Questão {index + 1}</legend>
            <label className="block">
              Enunciado
              <Input name={"q" + key} required minLength={5} maxLength={5000} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {["A", "B", "C", "D"].map((letter, i) => (
                <label key={letter}>
                  Alternativa {letter}
                  <Input name={key + "-a" + i} required maxLength={1500} />
                </label>
              ))}
            </div>
            <label className="block">
              Resposta correta
              <NativeSelect name={"correct" + key} required defaultValue="">
                <option value="" disabled>
                  Selecione o gabarito
                </option>
                {["A", "B", "C", "D"].map((letter, i) => (
                  <option key={letter} value={i}>
                    {letter}
                  </option>
                ))}
              </NativeSelect>
            </label>
            {keys.length > 1 && (
              <button
                type="button"
                onClick={() => setKeys(keys.filter((item) => item !== key))}
              >
                Remover questão
              </button>
            )}
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            type="button"
            disabled={keys.length >= 50}
            onClick={() => setKeys([...keys, nextKey.current++])}
          >
            Adicionar questão
          </Button>
          <Button type="submit">
            {busy ? "Enviando…" : "Enviar para moderação"}
          </Button>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

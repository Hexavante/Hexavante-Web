"use client";

import { CreationSection } from "@/components/ui/creation-section";

import { useRef, useState } from "react";
import type { ActionResult } from "@/app/actions/exam-admin";
import { ExamCoverUpload, type ExamCoverUploadHandle } from "@/components/exams/exam-cover-upload";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SuccessPopup } from "@/components/ui/success-popup";

type Props = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial?: {
    title?: string;
    examType?: string;
    description?: string | null;
    coverImage?: string | null;
    timeLimit?: number | null;
    isPublished?: boolean;
    isPremiumOnly?: boolean;
  };
  submitLabel: string;
  cancelHref: string;
};

export function ExamFormShell({ action, initial, submitLabel, cancelHref }: Props) {
  const coverRef = useRef<ExamCoverUploadHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    try {
      const url = await coverRef.current?.uploadIfNeeded();
      const form = formRef.current;
      if (!form) return;

      const formData = new FormData(form);
      if (coverRef.current?.isRemoved()) {
        formData.set("coverImage", "");
        formData.set("removeCover", "true");
      } else if (url) {
        formData.set("coverImage", url);
        formData.set("removeCover", "false");
      }

      const result = await action({ success: false }, formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(true);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao salvar simulado.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <SuccessPopup show={success} message="Simulado criado com sucesso!" />
      <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <CreationSection number="01" title="Apresentação do simulado" hint="Dê um nome à prova e explique quais conteúdos serão avaliados.">

        <div>
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" placeholder="Ex.: Matemática do ENEM · Geometria" required defaultValue={initial?.title} />
        </div>
        <div>
          <Label htmlFor="examType">Tipo</Label>
          <NativeSelect
            id="examType"
            name="examType"
            defaultValue={initial?.examType ?? "TECNOLOGIA"}
          >
            <option value="ENEM">ENEM</option>
            <option value="VESTIBULAR">Vestibular</option>
            <option value="TECNOLOGIA">Tecnologia</option>
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initial?.description ?? ""}
          />
        </div>
        <ExamCoverUpload ref={coverRef} initialUrl={initial?.coverImage} />
        </CreationSection>
        <CreationSection number="02" title="Regras da prova" hint="Escolha quem pode participar. Deixe o tempo em branco para uma prova sem limite.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="timeLimit">Tempo limite (min)</Label>
            <Input
              id="timeLimit"
              name="timeLimit"
              type="number"
              min={1}
              max={300}
              placeholder="Ex: 60"
              defaultValue={initial?.timeLimit != null ? String(initial.timeLimit) : ""}
            />
          </div>
          <div>
            <Label htmlFor="isPublished">Status</Label>
            <NativeSelect
              id="isPublished"
              name="isPublished"
              defaultValue={initial?.isPublished ? "true" : "false"}
            >
              <option value="false">Rascunho</option>
              <option value="true">Publicado</option>
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="isPremiumOnly">Acesso</Label>
            <NativeSelect
              id="isPremiumOnly"
              name="isPremiumOnly"
              defaultValue={initial?.isPremiumOnly ? "true" : "false"}
            >
              <option value="false">Todos os alunos</option>
              <option value="true">Somente Premium</option>
            </NativeSelect>
          </div>
        </div>
        </CreationSection>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
          <AppLink
            href={cancelHref}
            muted
            className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 hover:border-sky-400/40 hover:bg-sky-400/10"
          >
            Cancelar
          </AppLink>
        </div>
      </form>
    </>
  );
}

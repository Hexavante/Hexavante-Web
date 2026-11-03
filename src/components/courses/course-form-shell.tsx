"use client";

import { CreationSection } from "@/components/ui/creation-section";

import { useRef, useState } from "react";
import type { ActionResult } from "@/app/actions/course";
import {
  CourseCoverUpload,
  type CourseCoverUploadHandle,
} from "@/components/courses/course-cover-upload";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SuccessPopup } from "@/components/ui/success-popup";

type Props = {
  categories: { id: string; name: string }[];
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial?: {
    title?: string;
    categoryId?: string;
    shortDescription?: string | null;
    description?: string | null;
    tags?: string;
    coverImage?: string | null;
    thumbnailUrl?: string | null;
    level?: string;
    estimatedHours?: number | null;
    progressionType?: string;
    isPublished?: boolean;
  };
  submitLabel: string;
  cancelHref: string;
};

export function CourseFormShell({ categories, action, initial, submitLabel, cancelHref }: Props) {
  const [newCategory, setNewCategory] = useState("");
  const coverRef = useRef<CourseCoverUploadHandle>(null);
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
      setError(submitError instanceof Error ? submitError.message : "Erro ao salvar curso.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <SuccessPopup show={success} message="Curso criado com sucesso!" />
      <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <CreationSection number="01" title="Apresentação do curso" hint="Conte o que o aluno vai aprender e escolha a categoria.">

        <div>
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" placeholder="Ex.: Java do primeiro programa às classes" required defaultValue={initial?.title} />
        </div>
        <div>
          <Label htmlFor="categoryId">Categoria</Label>
            <NativeSelect
              id="categoryId"
              name="categoryId"
              disabled={Boolean(newCategory.trim())}
              required={!newCategory.trim()}
              defaultValue={initial?.categoryId ?? ""}
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-slate-500">
              Não encontrou a categoria? Cadastre uma nova abaixo — ela passará por aprovação do
              moderador antes de ficar disponível para todos.
            </p>
            <div>
              <Label htmlFor="newCategory">Criar nova categoria (opcional)</Label>
              <Input
                id="newCategory"
                name="newCategory"
                placeholder="Ex: Inteligência Artificial"
                value={newCategory}
                onChange={event => setNewCategory(event.target.value)}
              />
            </div>
          </div>
        <div>
          <Label htmlFor="shortDescription">Descrição curta</Label>
          <Input
            id="shortDescription"
            name="shortDescription"
            defaultValue={initial?.shortDescription ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="description">Descrição completa</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={initial?.description ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="Ex: javascript, frontend, iniciante"
              defaultValue={initial?.tags ?? ""}
            />
            <p className="mt-1 text-xs text-slate-500">
              Ajudam a categorizar e recomendar seu curso.
            </p>
          </div>
        <CourseCoverUpload ref={coverRef} initialUrl={initial?.coverImage ?? initial?.thumbnailUrl} />
        </CreationSection>
        <CreationSection number="02" title="Ritmo de estudo" hint="Defina o nível e se as aulas devem ser seguidas em ordem.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="level">Nível</Label>
            <NativeSelect id="level" name="level" defaultValue={initial?.level ?? "BEGINNER"}>
              <option value="BEGINNER">Iniciante</option>
              <option value="INTERMEDIATE">Intermediário</option>
              <option value="ADVANCED">Avançado</option>
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="estimatedHours">Carga horária (h)</Label>
            <Input
              id="estimatedHours"
              name="estimatedHours"
              type="number"
              min={1}
              max={500}
              placeholder="Ex: 20"
              defaultValue={initial?.estimatedHours != null ? String(initial.estimatedHours) : ""}
            />
          </div>
          <div>
            <Label htmlFor="progressionType">Progressão</Label>
            <NativeSelect
              id="progressionType"
              name="progressionType"
              defaultValue={initial?.progressionType ?? "FREE"}
            >
              <option value="FREE">Livre</option>
              <option value="PROGRESSIVE">Progressiva</option>
            </NativeSelect>
          </div>
          {initial && (
            <div>
              <Label htmlFor="isPublished">Visibilidade</Label>
              <NativeSelect
                id="isPublished"
                name="isPublished"
                defaultValue={initial?.isPublished ? "true" : "false"}
              >
                <option value="false">Rascunho (oculto)</option>
                <option value="true">Publicado</option>
              </NativeSelect>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Na progressão livre, o aluno escolhe a próxima aula. Na progressiva, segue a sequência do curso.
        </p>
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

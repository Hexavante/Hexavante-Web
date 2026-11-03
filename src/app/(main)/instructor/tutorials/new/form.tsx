"use client";

import { CreationSection } from "@/components/ui/creation-section";
import { startTransition, useActionState, useRef, useState } from "react";
import { Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { createTutorialAction, type ActionResult } from "@/app/actions/tutorial";
import { MindMapField } from "@/components/courses/mind-map-field";
import { VideoUploadInput } from "@/components/tutorials/video-upload-input";
import {
  TutorialThumbnailUpload,
  type TutorialThumbnailUploadHandle,
} from "@/components/tutorials/tutorial-thumbnail-upload";
import { SuccessPopup } from "@/components/ui/success-popup";

const initialState: ActionResult = { success: false };

type Category = { id: string; name: string };

export default function NewTutorialForm({ categories }: { categories: Category[] }) {
  const [state, formAction, isPending] = useActionState(createTutorialAction, initialState);
  const thumbRef = useRef<TutorialThumbnailUploadHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);
    setUploading(true);
    try {
      const url = await thumbRef.current?.uploadIfNeeded();
      const form = formRef.current;
      if (!form) return;
      const formData = new FormData(form);
      if (thumbRef.current?.isRemoved()) {
        formData.set("thumbnailUrl", "");
      } else if (url) {
        formData.set("thumbnailUrl", url);
      }
      startTransition(() => formAction(formData));
    } catch (submitError) {
      if (
        submitError instanceof Error &&
        (submitError as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
      ) {
        throw submitError;
      }
      setUploadError(
        submitError instanceof Error ? submitError.message : "Erro ao enviar miniatura.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell>
      <SuccessPopup show={state.success} message="Tutorial criado com sucesso!" />

      <Link
        href="/instructor/tutorials"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <PageHeader
        badge="Novo tutorial"
        icon={Video}
        title="Criar Tutorial"
        description="Adicione um vídeo tutorial para a comunidade."
      />

      <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
        <CreationSection number="01" title="Sobre o tutorial" hint="Apresente a técnica que o aluno vai aprender.">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-300">
            Título *
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
            placeholder="Ex: Como usar Promise.all"
          />
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-slate-300">
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
          >
            <option value="">Nenhuma</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-300">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
            placeholder="Descreva o conteúdo do tutorial..."
          />
        </div>

        <MindMapField />
        </CreationSection>
        <CreationSection number="02" title="Vídeo e capa" hint="Adicione o vídeo da demonstração e escolha a imagem que aparece no catálogo.">
        <VideoUploadInput />

        <TutorialThumbnailUpload ref={thumbRef} />

        <div>
          <label htmlFor="duration" className="mb-1.5 block text-sm font-medium text-slate-300">
            Duração (segundos)
          </label>
          <input
            id="duration"
            name="duration"
            type="number"
            min={1}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
            placeholder="Ex: 300"
          />
        </div>

        </CreationSection>
        <CreationSection number="03" title="Publicação" hint="Deixe a publicação desmarcada para guardar como rascunho.">
        <div>
          <label htmlFor="tags" className="mb-1.5 block text-sm font-medium text-slate-300">
            Tags (separadas por vírgula)
          </label>
          <input
            id="tags"
            name="tags"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
            placeholder="javascript, promise, async"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400/30"
            />
            Publicar imediatamente
          </label>
        </div>

        </CreationSection>
        {state.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        {uploadError && (
          <p className="text-sm text-red-400">{uploadError}</p>
        )}

        <Button type="submit" disabled={isPending || uploading}>
          {isPending || uploading ? "Criando..." : "Criar tutorial"}
        </Button>
      </form>
    </PageShell>
  );
}

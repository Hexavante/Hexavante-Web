"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { Video, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { DurationField } from "@/components/tutorials/duration-field";
import {
  updateTutorialAction,
  deleteTutorialAction,
  type ActionResult,
} from "@/app/actions/tutorial";
import { MindMapField } from "@/components/courses/mind-map-field";
import { splitMindMap } from "@/lib/mind-map";
import { VideoUploadInput } from "@/components/tutorials/video-upload-input";
import {
  TutorialThumbnailUpload,
  type TutorialThumbnailUploadHandle,
} from "@/components/tutorials/tutorial-thumbnail-upload";

const initialState: ActionResult = { success: false };

type Tutorial = {
  id: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  isPublished: boolean;
  categoryId?: string | null;
  tags: string[];
};

type Category = { id: string; name: string };

export default function EditTutorialForm({
  tutorial,
  categories,
}: {
  tutorial: Tutorial;
  categories: Category[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    (prev: ActionResult, formData: FormData) =>
      updateTutorialAction(tutorial.id, prev, formData),
    initialState,
  );
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
        formData.set("removeThumbnail", "true");
      } else {
        formData.set("removeThumbnail", "false");
        if (url) formData.set("thumbnailUrl", url);
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

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este tutorial?")) return;
    await deleteTutorialAction(tutorial.id);
    router.push("/instructor/tutorials");
  }

  return (
    <PageShell>
      <Link
        href="/instructor/tutorials"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <PageHeader
        badge="Editar tutorial"
        icon={Video}
        title={tutorial.title}
        description="Atualize as informações do tutorial."
        action={
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        }
      />

      <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
        <div>
          <label htmlFor="title" className="hx-label">
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={3}
            defaultValue={tutorial.title}
            className="hx-input"
          />
        </div>

        <div>
          <label htmlFor="categoryId" className="hx-label">
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={tutorial.categoryId ?? ""}
            className="hx-select"
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
          <label htmlFor="description" className="hx-label">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={splitMindMap(tutorial.description).description}
            className="hx-input"
          />
        </div>

        <MindMapField initial={splitMindMap(tutorial.description).topics.join("\n")} />
        <VideoUploadInput initialUrl={tutorial.videoUrl ?? ""} />

        <TutorialThumbnailUpload ref={thumbRef} initialUrl={tutorial.thumbnailUrl ?? null} />

        <DurationField initialSeconds={tutorial.duration} />

        <div>
          <label htmlFor="tags" className="hx-label">
            Tags (separadas por vírgula)
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={tutorial.tags.join(", ")}
            className="hx-input"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={tutorial.isPublished}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400/30"
            />
            Publicado
          </label>
        </div>

        {state.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        {uploadError && (
          <p className="text-sm text-red-400">{uploadError}</p>
        )}
        {state.success && (
          <p className="text-sm text-emerald-400">Tutorial atualizado!</p>
        )}

        <Button type="submit" disabled={isPending || uploading}>
          {isPending || uploading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </PageShell>
  );
}

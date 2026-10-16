"use client";

import { useState, useTransition } from "react";
import { NotebookPen } from "lucide-react";
import { saveLessonNoteAction } from "@/app/actions/lesson-learning";
import { useToast } from "@/components/ui/toast";

type Props = {
  courseSlug: string;
  lessonId: string;
  initialNote: string | null;
};

function LessonNotesPanelInner({ courseSlug, lessonId, initialNote }: Props) {
  const [content, setContent] = useState(initialNote ?? "");
  const [saved, setSaved] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const dirty = content !== saved;

  function handleSave() {
    startTransition(async () => {
      const result = await saveLessonNoteAction(courseSlug, lessonId, content);
      if (result.success) {
        setSaved(content);
        toast("Nota salva.", "success");
      } else {
        toast(result.error ?? "Erro ao salvar nota.", "error");
      }
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-sky-300" />
        <h3 className="text-sm font-bold text-white">Minhas anotações</h3>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Anote pontos importantes desta aula..."
        rows={4}
        className="hx-textarea w-full min-h-[100px] resize-y"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{dirty ? "Alterações não salvas" : "Salvo"}</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || !dirty}
          className="hx-btn-primary min-h-10 px-4 text-sm disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar nota"}
        </button>
      </div>
    </div>
  );
}

export function LessonNotesPanel(props: Props) {
  return (
    <LessonNotesPanelInner
      key={`${props.lessonId}:${props.initialNote ?? ""}`}
      {...props}
    />
  );
}

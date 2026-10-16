"use client";

import { useState, useEffect, useRef } from "react";
import { NotebookPen, Check, Clock, AlertCircle } from "lucide-react";
import { saveLessonNote, getLessonNote } from "@/lib/go-api";
import { useToast } from "@/components/ui/toast";

type Props = {
  courseSlug: string;
  lessonId: string;
  initialNote: string | null;
};

export function SmartNotesPanel({ lessonId, initialNote }: Props) {
  const [content, setContent] = useState(initialNote ?? "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Ao trocar de aula, busca a nota atualizada direto da API Go
  useEffect(() => {
    let active = true;
    getLessonNote(lessonId).then((res) => {
      if (active && res.success && res.data) {
        setContent(res.data.content || "");
        setSaveStatus("saved");
      }
    });
    return () => {
      active = false;
    };
  }, [lessonId]);

  // Função veloz de autosave com debounce (conforme documento conceitual)
  const triggerAutoSave = (newText: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSaveStatus("unsaved");

    debounceTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const res = await saveLessonNote(lessonId, newText);
      if (res.success) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
        toast("Erro ao sincronizar nota na nuvem.", "error");
      }
    }, 800); // 800ms debounce
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    triggerAutoSave(text);
  };

  const handleManualSave = async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaveStatus("saving");
    const res = await saveLessonNote(lessonId, content);
    if (res.success) {
      setSaveStatus("saved");
      toast("Nota salva!", "success");
    } else {
      setSaveStatus("error");
      toast("Falha ao salvar nota.", "error");
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Smart Notes</h3>
        </div>

        {/* Indicador de Salvamento Automático do Documento */}
        <div className="flex items-center gap-1.5 text-xs">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-sky-400">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              Salvando...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Salvo automaticamente
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              Rascunho
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-rose-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Erro ao salvar
            </span>
          )}
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Escreva seus insights e resumos aqui... Eles são salvos instantaneamente."
        rows={4}
        className="hx-textarea w-full min-h-[110px] resize-y text-sm focus:border-emerald-500/50"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Disponível na sua Biblioteca Central e em todos os dispositivos
        </p>
        <button
          type="button"
          onClick={handleManualSave}
          disabled={saveStatus === "saving" || saveStatus === "saved"}
          className="hx-btn-primary min-h-8 px-3 text-xs disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Salvando..." : "Salvar agora"}
        </button>
      </div>
    </div>
  );
}

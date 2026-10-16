"use client";

import { useState, useEffect } from "react";
import { NotebookPen, Search, BookOpen, Clock, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { listUserNotes, SmartNote } from "@/lib/go-api";

export default function NotesLibraryPage() {
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "courses" | "exams">("all");

  useEffect(() => {
    let active = true;
    const fetchNotes = async () => {
      setLoading(true);
      const res = await listUserNotes(search);
      if (active && res.success && res.data) {
        setNotes(res.data);
      }
      if (active) setLoading(false);
    };

    const timer = setTimeout(fetchNotes, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const filteredNotes = notes.filter((n) => {
    if (filter === "courses") return !!n.lessonId;
    if (filter === "exams") return !!n.examId;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header da Biblioteca */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <NotebookPen className="h-6 w-6 text-emerald-400" />
            Caderno Central de Estudos
          </h1>
          <p className="text-sm text-slate-400">
            Todas as suas anotações reunidas, organizadas e sincronizadas em alta velocidade.
          </p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por palavra-chave, resumo ou título..."
            className="hx-input w-full pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              filter === "all" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"
            }`}
          >
            Todas ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("courses")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              filter === "courses" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"
            }`}
          >
            Cursos
          </button>
          <button
            type="button"
            onClick={() => setFilter("exams")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              filter === "exams" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"
            }`}
          >
            Simulados
          </button>
        </div>
      </div>

      {/* Lista de Anotações */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-500" />
          <h3 className="text-base font-semibold text-white">Nenhuma anotação encontrada</h3>
          <p className="mt-1 text-sm text-slate-400">
            {search ? "Tente pesquisar com outros termos." : "Abra uma aula ou simulado e comece a anotar no Smart Notes ao lado!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-500/40 hover:bg-white/[0.05]"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    <BookOpen className="h-3 w-3" />
                    {note.lessonName || "Aula de Estudo"}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-300">
                  {note.content}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[11px] text-slate-500">Sincronizado via Go API</span>
                {note.lessonId && (
                  <Link
                    href={`/app`}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Abrir no contexto <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

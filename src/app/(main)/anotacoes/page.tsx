"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ExternalLink,
  FileText,
  NotebookPen,
  RefreshCw,
  Search,
  Star,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { listUserNotes, type SmartNote } from "@/lib/go-api";

type NoteFilter = "all" | "favorites" | "courses" | "exams";

const FILTER_LABELS: Record<NoteFilter, string> = {
  all: "Todas",
  favorites: "Favoritas",
  courses: "Cursos",
  exams: "Simulados",
};

export default function NotesLibraryPage() {
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [filter, setFilter] = useState<NoteFilter>("all");

  useEffect(() => {
    let active = true;

    const fetchNotes = async () => {
      setLoading(true);
      setFailed(false);
      const res = await listUserNotes(search);
      if (!active) return;

      if (res.success && res.data) {
        setNotes(res.data);
      } else {
        setNotes([]);
        setFailed(true);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchNotes, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, reloadToken]);

  const counts = useMemo(
    () => ({
      all: notes.length,
      favorites: notes.filter((note) => note.isFavorite).length,
      courses: notes.filter((note) => Boolean(note.lessonId)).length,
      exams: notes.filter((note) => Boolean(note.examId)).length,
    }),
    [notes],
  );

  const filteredNotes = notes.filter((note) => {
    if (filter === "favorites") return note.isFavorite;
    if (filter === "courses") return Boolean(note.lessonId);
    if (filter === "exams") return Boolean(note.examId);
    return true;
  });

  return (
    <PageShell size="md">
      <PageHeader
        badge="Smart Notes"
        icon={NotebookPen}
        title="Caderno Central de Estudos"
        description="Todas as suas anotações de aulas e simulados reunidas, organizadas e sincronizadas."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por palavra-chave, resumo ou título..."
            aria-label="Buscar anotações"
            className="hx-input w-full pl-9 text-base"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filtrar anotações"
          className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 p-1"
        >
          {(Object.keys(FILTER_LABELS) as NoteFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded px-3 py-2 text-sm font-medium transition ${
                filter === key
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {FILTER_LABELS[key]} ({counts[key]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
      ) : failed ? (
        <EmptyState
          icon={RefreshCw}
          title="Não foi possível carregar suas anotações"
          description="A conexão com o caderno falhou. Verifique sua internet e tente novamente."
        >
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </EmptyState>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            notes.length === 0 && !search
              ? "Nenhuma anotação encontrada"
              : "Nada encontrado com esses filtros"
          }
          description={
            notes.length === 0 && !search
              ? "Abra uma aula ou simulado e use o Smart Notes para começar a anotar."
              : "Tente outra palavra-chave ou selecione outro filtro."
          }
        >
          {notes.length === 0 && !search && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--sidebar-highlight)/0.14)] px-4 py-2 text-sm font-semibold text-[hsl(var(--sidebar-highlight))] transition hover:bg-[hsl(var(--sidebar-highlight)/0.22)]"
              >
                <BookOpen className="h-4 w-4" />
                Explorar cursos
              </Link>
              <Link
                href="/simulados"
                className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <Target className="h-4 w-4" />
                Ver simulados
              </Link>
            </div>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <article
              key={note.id}
              className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-500/40 hover:bg-white/[0.05]"
            >
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {note.lessonId ? (
                    <Badge variant="emerald" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      {note.lessonName || "Aula"}
                    </Badge>
                  ) : note.examId ? (
                    <Badge variant="sky" className="gap-1">
                      <Target className="h-3 w-3" />
                      {note.examTitle || "Simulado"}
                    </Badge>
                  ) : (
                    <Badge>Anotação</Badge>
                  )}
                  {note.isFavorite && (
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" aria-label="Favorita" />
                  )}
                  <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {note.title && (
                  <h2 className="text-base font-bold leading-snug text-white">{note.title}</h2>
                )}
                <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-[15px] leading-6 text-slate-300">
                  {note.content}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-xs text-slate-500">Sincronizado</span>
                {note.lessonId ? (
                  <Link
                    href="/courses"
                    className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Abrir curso <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : note.examId ? (
                  <Link
                    href="/simulados"
                    className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Abrir simulado <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

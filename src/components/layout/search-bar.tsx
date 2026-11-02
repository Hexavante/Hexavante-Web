"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, Target, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Suggestion = {
  title: string;
  href: string;
  type: "curso" | "simulado";
};

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { results: Suggestion[] };
        if (controller.signal.aborted) return;
        setSuggestions(data.results ?? []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    router.push(`/courses?q=${encodeURIComponent(trimmed)}`);
    setIsOpen(false);
  };

  const clearQuery = () => {
    setQuery("");
    setLoading(false);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="navbar-search relative w-full">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setSuggestions([]);
            setLoading(next.trim().length >= 2);
            setIsOpen(next.trim().length >= 2);
            if (next.trim().length < 2) {
              setSuggestions([]);
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          placeholder="Buscar cursos, simulados, aulas..."
          aria-label="Buscar cursos, simulados e aulas"
          className="min-w-0 flex-1"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background)/0.98)] shadow-2xl shadow-black/40 backdrop-blur-xl">
          {loading && suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Buscando...</p>
          ) : suggestions.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                router.push(`/courses?q=${encodeURIComponent(query.trim())}`);
                setIsOpen(false);
              }}
              className="block w-full px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.06]"
            >
              Ver resultados para &quot;{query.trim()}&quot;
            </button>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {suggestions.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-[hsl(var(--sidebar-highlight)/0.1)] hover:text-white"
                  >
                    <span className="hx-accent-soft">
                      {item.type === "curso" ? (
                        <BookOpen className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        item.type === "curso"
                          ? "bg-[hsl(var(--sidebar-highlight)/0.15)] text-[hsl(var(--sidebar-highlight)/0.9)]"
                          : "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground)/0.85)]",
                      )}
                    >
                      {item.type}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/courses?q=${encodeURIComponent(query.trim())}`);
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
                >
                  Ver todos os cursos
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

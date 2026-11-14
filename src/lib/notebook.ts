import { z } from "zod";

export const NOTEBOOK_TITLE_MAX = 120;

export const notebookPageInput = z.object({
  id: z.string().uuid(),
  /** null = anotação livre, sem curso. */
  courseId: z.string().min(1).max(191).nullable(),
  title: z
    .string()
    .trim()
    .min(1, "Dê um título à página.")
    .max(NOTEBOOK_TITLE_MAX)
    .refine((t) => !t.includes("[[") && !t.includes("]]"), "O título não pode conter [[ ou ]]."),
  content: z.string().max(50000, "A página pode ter até 50 mil caracteres."),
  version: z.number().int().positive().nullable(),
});
export type NotebookPageInput = z.infer<typeof notebookPageInput>;
export type NotebookPageData = {
  id: string;
  courseId: string | null;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
};
export type NotebookCourse = { id: string; title: string; slug: string };
export type NotebookData = {
  courses: NotebookCourse[];
  pages: NotebookPageData[];
};
export type NotebookSaveData = {
  page: NotebookPageData;
  /** Outras páginas cujos links [[...]] foram atualizados por uma renomeação. */
  relinked: NotebookPageData[];
};
export type NotebookResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Links entre anotações: [[Título da nota]] ─────────────────────────────

const LINK_RE = /\[\[([^[\]\n]{1,120})\]\]/g;

/** Comparação de títulos sem diferenciar maiúsculas/espaços nas pontas. */
export function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase("pt-BR");
}

/** Títulos citados no texto, na ordem em que aparecem (sem repetição). */
export function extractLinks(content: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const match of content.matchAll(LINK_RE)) {
    const title = match[1].trim();
    const key = normalizeTitle(title);
    if (title && !seen.has(key)) {
      seen.add(key);
      result.push(title);
    }
  }
  return result;
}

export function linksTo(content: string, title: string): boolean {
  const target = normalizeTitle(title);
  return extractLinks(content).some((t) => normalizeTitle(t) === target);
}

/** Troca [[antigo]] por [[novo]] (sem diferenciar maiúsculas). */
export function renameLinks(content: string, oldTitle: string, newTitle: string): string {
  const target = normalizeTitle(oldTitle);
  return content.replace(LINK_RE, (whole, inner: string) =>
    normalizeTitle(inner) === target ? `[[${newTitle.trim()}]]` : whole,
  );
}

export type NotebookSegment = { type: "text"; text: string } | { type: "link"; title: string };

/** Quebra o texto em trechos e links, para renderizar no modo leitura. */
export function splitLinks(content: string): NotebookSegment[] {
  const segments: NotebookSegment[] = [];
  let last = 0;
  for (const match of content.matchAll(LINK_RE)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ type: "text", text: content.slice(last, start) });
    segments.push({ type: "link", title: match[1].trim() });
    last = start + match[0].length;
  }
  if (last < content.length) segments.push({ type: "text", text: content.slice(last) });
  return segments;
}

/**
 * Resolve um título para a página correspondente. Com títulos repetidos,
 * vence a editada mais recentemente.
 */
export function resolveLink<T extends { title: string; updatedAt: string }>(
  pages: T[],
  title: string,
): T | undefined {
  const target = normalizeTitle(title);
  return pages
    .filter((p) => normalizeTitle(p.title) === target)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

/** Páginas que apontam para `title` (exceto a própria). */
export function findBacklinks<T extends { id: string; content: string }>(
  pages: T[],
  title: string,
  selfId: string,
): T[] {
  if (!title.trim()) return [];
  return pages.filter((p) => p.id !== selfId && linksTo(p.content, title));
}

/**
 * Se o cursor está logo depois de um "[[" ainda não fechado, devolve o
 * termo digitado e onde ele começa — usado pelo autocompletar.
 */
export function pendingLinkQuery(
  content: string,
  cursor: number,
): { query: string; start: number } | null {
  const before = content.slice(0, cursor);
  const open = before.lastIndexOf("[[");
  if (open === -1) return null;
  const typed = before.slice(open + 2);
  if (typed.includes("]]") || typed.includes("\n") || typed.length > 120) return null;
  return { query: typed, start: open + 2 };
}

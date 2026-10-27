const GO_API_BASE_URL =
  process.env.NEXT_PUBLIC_GO_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.hexavante.com.br"
    : "http://localhost:3050");

export interface SmartNote {
  id: string;
  userId: string;
  lessonId?: string;
  lessonName?: string;
  content: string;
  isFavorite: boolean;
  updatedAt: string;
}

export interface StudyPreferences {
  userId: string;
  diagramType: "auto" | "flowchart" | "mindmap" | "timeline" | "sequence";
  detailLevel: "simple" | "intermediate" | "advanced";
  autoSuggest: boolean;
  animations: boolean;
  autoSaveNotes: boolean;
  updatedAt: string;
}

export type GoApiError = string | { code: string; message: string };

export interface GoApiResult<T> {
  success: boolean;
  data?: T;
  /** O Go devolve string; versões antigas devolviam { code, message }. */
  error?: GoApiError;
  code?: string;
}

export function goApiErrorMessage(error: GoApiError | undefined, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || fallback;
}

/**
 * Cliente HTTP rápido para a API em Go.
 * Passa cookies automaticamente no navegador (credentials: include).
 */
export async function fetchGoApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<GoApiResult<T>> {
  const url = `${GO_API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Hexavante-Client": "web",
        ...(options.headers || {}),
      },
    });

    const body = (await res.json()) as GoApiResult<T>;
    if (!res.ok && body.success !== false) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    return body;
  } catch (err) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Falha na comunicação com a API em Go",
      },
    };
  }
}

// === Smart Notes ===
export async function getLessonNote(lessonId: string) {
  return fetchGoApi<SmartNote>(`/api/v1/notes/lesson?lessonId=${encodeURIComponent(lessonId)}`);
}

export async function saveLessonNote(lessonId: string, content: string) {
  return fetchGoApi<{ saved: boolean; lessonId: string; updatedAt: string }>(`/api/v1/notes/lesson`, {
    method: "POST",
    body: JSON.stringify({ lessonId, content }),
  });
}

export async function listUserNotes(query = "") {
  const q = query ? `?q=${encodeURIComponent(query)}` : "";
  return fetchGoApi<SmartNote[]>(`/api/v1/notes${q}`);
}

export async function setNoteFavorite(noteId: string, isFavorite: boolean) {
  return fetchGoApi<{ id: string; isFavorite: boolean }>(
    `/api/v1/notes/${encodeURIComponent(noteId)}/favorite`,
    {
      method: "PATCH",
      body: JSON.stringify({ isFavorite }),
    },
  );
}

// === Visual Learning ===
export async function getStudyPreferences() {
  return fetchGoApi<StudyPreferences>(`/api/v1/visual/preferences`);
}

export async function updateStudyPreferences(prefs: Partial<StudyPreferences>) {
  return fetchGoApi<StudyPreferences>(`/api/v1/visual/preferences`, {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

// === Fast Study Progress ===
export async function completeLessonGo(lessonId: string, courseId: string) {
  return fetchGoApi<{ completed: boolean; progress: number }>(`/api/v1/study/complete-lesson`, {
    method: "POST",
    body: JSON.stringify({ lessonId, courseId }),
  });
}

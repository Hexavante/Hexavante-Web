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
  examId?: string;
  examTitle?: string;
  questionId?: string;
  title: string;
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

/**
 * Cliente HTTP rápido para a API em Go
 * Passa cookies automaticamente no navegador (credentials: include)
 */
export async function fetchGoApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
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

    const body = await res.json();
    return body;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: err.message || "Falha na comunicação com a API em Go",
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
  return fetchGoApi<{ success: boolean; completed: boolean }>(`/api/v1/study/complete-lesson`, {
    method: "POST",
    body: JSON.stringify({ lessonId, courseId }),
  });
}

/**
 * Typed API client — all fetch calls to the FastAPI backend.
 * The Vite proxy forwards /api/* to http://localhost:8000 in development.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Document {
  id: number;
  filename: string;
  file_size: number;
  pages: number;
  subject: string;
  title: string | null;
  subtitle: string | null;
  summary: string | null;
  concepts: string[] | null;
  created_at: string;
  flashcard_count: number;
  quiz_count: number;
  mastery: number;
}

export interface DocumentList {
  documents: Document[];
  total: number;
}

export interface Flashcard {
  id: number;
  doc_id: number;
  front: string;
  back: string;
  mastery: number;
}

export interface FlashcardsResponse {
  doc_id: number;
  doc_title: string;
  flashcards: Flashcard[];
}

export interface ReviewResponse {
  card_id: number;
  rating: string;
  new_mastery: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizResponse {
  doc_id: number;
  doc_title: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  question_id: number;
  question: string;
  selected_index: number;
  correct_index: number;
  is_correct: boolean;
  explanation: string;
  options: string[];
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
  pct: number;
  results: QuizResult[];
}

export interface ProgressStats {
  streak: number;
  cards_mastered: number;
  avg_score: number;
  due_today: number;
  overall_mastery: number;
  cards_reviewed: number;
  hours_studied: number;
  accuracy_rate: number;
}

export interface PerformancePoint {
  day: string;
  score: number;
}

export interface TopicMastery {
  topic: string;
  mastery: number;
}

export interface ProgressResponse {
  stats: ProgressStats;
  performance: PerformancePoint[];
  topics: TopicMastery[];
}

export interface UploadResponse {
  doc_id: number;
  filename: string;
  pages: number;
  title: string;
  flashcard_count: number;
  quiz_count: number;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export const api = {
  /** List all uploaded documents */
  listDocuments(): Promise<DocumentList> {
    return request("/api/documents");
  },

  /** Get a single document by ID */
  getDocument(id: number): Promise<Document> {
    return request(`/api/documents/${id}`);
  },

  /** Upload a file — returns processing results */
  uploadFile(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResponse>("/api/upload", {
      method: "POST",
      headers: {},  // let browser set Content-Type with boundary
      body: form,
    });
  },

  // ─── Flashcards ─────────────────────────────────────────────────────────────

  /** Get flashcards for a document */
  getFlashcards(docId: number): Promise<FlashcardsResponse> {
    return request(`/api/flashcards/${docId}`);
  },

  /** Record a card review rating */
  reviewCard(cardId: number, rating: "Easy" | "Medium" | "Hard"): Promise<ReviewResponse> {
    return request(`/api/flashcards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    });
  },

  // ─── Quiz ────────────────────────────────────────────────────────────────────

  /** Get quiz questions for a document */
  getQuiz(docId: number): Promise<QuizResponse> {
    return request(`/api/quiz/${docId}`);
  },

  /** Submit quiz answers and get score */
  submitQuiz(
    docId: number,
    answers: { question_id: number; selected_index: number }[]
  ): Promise<QuizSubmitResponse> {
    return request("/api/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ doc_id: docId, answers }),
    });
  },

  // ─── Progress ────────────────────────────────────────────────────────────────

  /** Get overall progress stats, performance history, and topic mastery */
  getProgress(): Promise<ProgressResponse> {
    return request("/api/progress");
  },

  // ─── Health ──────────────────────────────────────────────────────────────────

  health(): Promise<{ status: string; gemini: string }> {
    return request("/api/health");
  },
};

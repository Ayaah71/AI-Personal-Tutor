"""Pydantic models for API request/response validation."""

from pydantic import BaseModel
from typing import Optional


# ─── Documents ────────────────────────────────────────────────────────────────

class DocumentSummary(BaseModel):
    id: int
    filename: str
    file_size: int
    pages: int
    subject: str
    title: Optional[str]
    subtitle: Optional[str]
    summary: Optional[str]
    concepts: Optional[list[str]]
    created_at: str
    flashcard_count: int = 0
    quiz_count: int = 0
    mastery: int = 0


class DocumentList(BaseModel):
    documents: list[DocumentSummary]
    total: int


# ─── Flashcards ───────────────────────────────────────────────────────────────

class Flashcard(BaseModel):
    id: int
    doc_id: int
    front: str
    back: str
    mastery: int  # 0=new, 1=hard, 2=medium, 3=easy


class FlashcardsResponse(BaseModel):
    doc_id: int
    doc_title: str
    flashcards: list[Flashcard]


class ReviewRequest(BaseModel):
    rating: str  # 'Easy' | 'Medium' | 'Hard'


class ReviewResponse(BaseModel):
    card_id: int
    rating: str
    new_mastery: int


# ─── Quiz ─────────────────────────────────────────────────────────────────────

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: list[str]  # always 4 items
    correct_index: int
    explanation: str


class QuizResponse(BaseModel):
    doc_id: int
    doc_title: str
    questions: list[QuizQuestion]


class QuizAnswer(BaseModel):
    question_id: int
    selected_index: int


class QuizSubmitRequest(BaseModel):
    doc_id: int
    answers: list[QuizAnswer]


class QuizResult(BaseModel):
    question_id: int
    question: str
    selected_index: int
    correct_index: int
    is_correct: bool
    explanation: str
    options: list[str]


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    pct: float
    results: list[QuizResult]


# ─── Progress ─────────────────────────────────────────────────────────────────

class ProgressStats(BaseModel):
    streak: int
    cards_mastered: int
    avg_score: float
    due_today: int
    overall_mastery: float
    cards_reviewed: int
    hours_studied: float
    accuracy_rate: float


class PerformancePoint(BaseModel):
    day: str
    score: float


class TopicMastery(BaseModel):
    topic: str
    mastery: int


class ProgressResponse(BaseModel):
    stats: ProgressStats
    performance: list[PerformancePoint]
    topics: list[TopicMastery]


# ─── Upload ───────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    doc_id: int
    filename: str
    pages: int
    title: str
    flashcard_count: int
    quiz_count: int
    message: str

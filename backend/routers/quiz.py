"""
GET  /api/quiz/{doc_id}  — get quiz questions for a document
POST /api/quiz/submit    — submit answers, receive score + per-question results
"""

from fastapi import APIRouter, HTTPException
from database import get_conn
from models import (
    QuizResponse, QuizQuestion,
    QuizSubmitRequest, QuizSubmitResponse, QuizResult,
)

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.get("/{doc_id}", response_model=QuizResponse)
def get_quiz(doc_id: int):
    with get_conn() as conn:
        doc = conn.execute(
            "SELECT id, title FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        rows = conn.execute(
            "SELECT * FROM quiz_questions WHERE doc_id = ? ORDER BY id", (doc_id,)
        ).fetchall()

    questions = [
        QuizQuestion(
            id=r["id"],
            question=r["question"],
            options=[r["option_a"], r["option_b"], r["option_c"], r["option_d"]],
            correct_index=r["correct_index"],
            explanation=r["explanation"] or "",
        )
        for r in rows
    ]

    return QuizResponse(
        doc_id=doc_id,
        doc_title=doc["title"] or f"Document #{doc_id}",
        questions=questions,
    )


@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(body: QuizSubmitRequest):
    with get_conn() as conn:
        doc = conn.execute(
            "SELECT id FROM documents WHERE id = ?", (body.doc_id,)
        ).fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        results = []
        score = 0

        for answer in body.answers:
            row = conn.execute(
                "SELECT * FROM quiz_questions WHERE id = ?", (answer.question_id,)
            ).fetchone()
            if not row:
                continue

            is_correct = answer.selected_index == row["correct_index"]
            if is_correct:
                score += 1

            results.append(
                QuizResult(
                    question_id=row["id"],
                    question=row["question"],
                    selected_index=answer.selected_index,
                    correct_index=row["correct_index"],
                    is_correct=is_correct,
                    explanation=row["explanation"] or "",
                    options=[row["option_a"], row["option_b"], row["option_c"], row["option_d"]],
                )
            )

        total = len(results)
        pct = round(score / total * 100, 1) if total > 0 else 0.0

        # Record the attempt
        conn.execute(
            "INSERT INTO quiz_attempts (doc_id, score, total, pct) VALUES (?, ?, ?, ?)",
            (body.doc_id, score, total, pct),
        )

    return QuizSubmitResponse(score=score, total=total, pct=pct, results=results)

"""
GET  /api/flashcards/{doc_id}     — get all flashcards for a document
POST /api/flashcards/{id}/review  — submit Easy/Medium/Hard rating
"""

from fastapi import APIRouter, HTTPException
from database import get_conn
from models import FlashcardsResponse, Flashcard, ReviewRequest, ReviewResponse

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])

RATING_TO_MASTERY = {"Hard": 1, "Medium": 2, "Easy": 3}


@router.get("/{doc_id}", response_model=FlashcardsResponse)
def get_flashcards(doc_id: int):
    with get_conn() as conn:
        doc = conn.execute(
            "SELECT id, title FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        rows = conn.execute(
            "SELECT * FROM flashcards WHERE doc_id = ? ORDER BY id", (doc_id,)
        ).fetchall()

    cards = [
        Flashcard(
            id=r["id"],
            doc_id=r["doc_id"],
            front=r["front"],
            back=r["back"],
            mastery=r["mastery"],
        )
        for r in rows
    ]

    return FlashcardsResponse(
        doc_id=doc_id,
        doc_title=doc["title"] or f"Document #{doc_id}",
        flashcards=cards,
    )


@router.post("/{card_id}/review", response_model=ReviewResponse)
def review_flashcard(card_id: int, body: ReviewRequest):
    if body.rating not in RATING_TO_MASTERY:
        raise HTTPException(
            status_code=400,
            detail=f"rating must be one of: {list(RATING_TO_MASTERY.keys())}"
        )

    new_mastery = RATING_TO_MASTERY[body.rating]

    with get_conn() as conn:
        row = conn.execute(
            "SELECT id FROM flashcards WHERE id = ?", (card_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Flashcard not found")

        conn.execute(
            "UPDATE flashcards SET mastery = ?, last_review = datetime('now') WHERE id = ?",
            (new_mastery, card_id),
        )
        conn.execute(
            "INSERT INTO flashcard_reviews (card_id, rating) VALUES (?, ?)",
            (card_id, body.rating),
        )

    return ReviewResponse(
        card_id=card_id,
        rating=body.rating,
        new_mastery=new_mastery,
    )

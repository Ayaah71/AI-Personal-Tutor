"""
GET /api/documents        — list all documents
GET /api/documents/{id}   — get one document with full details
"""

import json
from fastapi import APIRouter, HTTPException
from database import get_conn
from models import DocumentSummary, DocumentList

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _row_to_doc(row, flashcard_count: int = 0, quiz_count: int = 0, mastery: int = 0) -> DocumentSummary:
    concepts_raw = row["concepts"] or "[]"
    try:
        concepts = json.loads(concepts_raw)
    except Exception:
        concepts = []

    return DocumentSummary(
        id=row["id"],
        filename=row["filename"],
        file_size=row["file_size"],
        pages=row["pages"],
        subject=row["subject"] or "General",
        title=row["title"],
        subtitle=row["subtitle"],
        summary=row["summary"],
        concepts=concepts,
        created_at=row["created_at"],
        flashcard_count=flashcard_count,
        quiz_count=quiz_count,
        mastery=mastery,
    )


@router.get("", response_model=DocumentList)
def list_documents():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM documents ORDER BY created_at DESC"
        ).fetchall()

        docs = []
        for row in rows:
            fc = conn.execute(
                "SELECT COUNT(*) as c FROM flashcards WHERE doc_id = ?", (row["id"],)
            ).fetchone()["c"]
            qc = conn.execute(
                "SELECT COUNT(*) as c FROM quiz_questions WHERE doc_id = ?", (row["id"],)
            ).fetchone()["c"]
            # mastery: avg flashcard mastery (0-3 → scale to 0-100)
            mastery_row = conn.execute(
                "SELECT AVG(mastery) as m FROM flashcards WHERE doc_id = ?", (row["id"],)
            ).fetchone()
            mastery_pct = round((mastery_row["m"] or 0) / 3 * 100)

            docs.append(_row_to_doc(row, fc, qc, mastery_pct))

    return DocumentList(documents=docs, total=len(docs))


@router.get("/{doc_id}", response_model=DocumentSummary)
def get_document(doc_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        fc = conn.execute(
            "SELECT COUNT(*) as c FROM flashcards WHERE doc_id = ?", (doc_id,)
        ).fetchone()["c"]
        qc = conn.execute(
            "SELECT COUNT(*) as c FROM quiz_questions WHERE doc_id = ?", (doc_id,)
        ).fetchone()["c"]
        mastery_row = conn.execute(
            "SELECT AVG(mastery) as m FROM flashcards WHERE doc_id = ?", (doc_id,)
        ).fetchone()
        mastery_pct = round((mastery_row["m"] or 0) / 3 * 100)

    return _row_to_doc(row, fc, qc, mastery_pct)

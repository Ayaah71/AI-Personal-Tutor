"""
POST /api/upload
Accepts a multipart file upload, extracts text, generates AI content,
stores everything in the database, and returns the document ID + stats.
"""

import json
from fastapi import APIRouter, File, UploadFile, HTTPException

from database import get_conn
from models import UploadResponse
from ai.extractor import extract_text
from ai.generator import generate_summary, generate_flashcards, generate_quiz

router = APIRouter(prefix="/api", tags=["upload"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".md"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    # ── Validate ──────────────────────────────────────────────────────────────
    from pathlib import Path
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    # ── Extract text ──────────────────────────────────────────────────────────
    try:
        raw_text, pages = extract_text(file.filename or "file", content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not extract text: {e}")

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the file")

    # ── AI generation ─────────────────────────────────────────────────────────
    summary_data = generate_summary(raw_text, file.filename or "")
    flashcards_data = generate_flashcards(raw_text, n=10)
    quiz_data = generate_quiz(raw_text, n=5)

    # ── Persist to database ───────────────────────────────────────────────────
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO documents
                (filename, file_size, pages, subject, title, subtitle, summary, concepts, raw_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                file.filename,
                len(content),
                pages,
                summary_data.get("subject", "General"),
                summary_data.get("title", file.filename),
                summary_data.get("subtitle", ""),
                summary_data.get("summary", ""),
                json.dumps(summary_data.get("concepts", [])),
                raw_text,
            ),
        )
        doc_id = cur.lastrowid

        # Flashcards
        for card in flashcards_data:
            conn.execute(
                "INSERT INTO flashcards (doc_id, front, back) VALUES (?, ?, ?)",
                (doc_id, card.get("front", ""), card.get("back", "")),
            )

        # Quiz questions
        for q in quiz_data:
            opts = q.get("options", ["", "", "", ""])
            while len(opts) < 4:
                opts.append("")
            conn.execute(
                """
                INSERT INTO quiz_questions
                    (doc_id, question, option_a, option_b, option_c, option_d, correct_index, explanation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    doc_id,
                    q.get("question", ""),
                    opts[0], opts[1], opts[2], opts[3],
                    q.get("correct_index", 0),
                    q.get("explanation", ""),
                ),
            )

    return UploadResponse(
        doc_id=doc_id,
        filename=file.filename or "",
        pages=pages,
        title=summary_data.get("title", file.filename or ""),
        flashcard_count=len(flashcards_data),
        quiz_count=len(quiz_data),
        message="Document processed successfully",
    )

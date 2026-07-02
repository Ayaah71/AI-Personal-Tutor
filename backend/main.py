"""
FastAPI application entry point.
Run with: uvicorn main:app --reload  (from the backend/ directory)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import upload, documents, flashcards, quiz, progress

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Personal Tutor API",
    description="Backend for the Scholar AI personal tutor application",
    version="1.0.0",
)

# ── CORS — allow the Vite dev server ──────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(flashcards.router)
app.include_router(quiz.router)
app.include_router(progress.router)


# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    init_db()
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        print("[AI] Gemini API key loaded [OK]")
    else:
        print("[AI] WARNING: GEMINI_API_KEY not set — AI features will use fallback placeholders")
        print("[AI] Get a free key at https://makersuite.google.com/app/apikey")
        print("[AI] Then add it to backend/.env: GEMINI_API_KEY=your_key")


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    api_key = os.getenv("GEMINI_API_KEY", "")
    return {
        "status": "ok",
        "gemini": "configured" if api_key else "missing — add GEMINI_API_KEY to .env",
    }

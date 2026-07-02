"""
Database setup and helpers — SQLite via the built-in sqlite3 module.
Tables:
  documents       — uploaded files and their extracted text + AI-generated summary
  flashcards      — AI-generated Q/A pairs per document
  quiz_questions  — AI-generated MCQ questions per document
  quiz_attempts   — individual quiz submissions
  flashcard_reviews — Easy / Medium / Hard ratings per card
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "tutor.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS documents (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                filename    TEXT    NOT NULL,
                file_size   INTEGER NOT NULL,
                pages       INTEGER DEFAULT 0,
                subject     TEXT    DEFAULT 'General',
                title       TEXT,
                subtitle    TEXT,
                summary     TEXT,
                concepts    TEXT,   -- JSON array stored as text
                raw_text    TEXT,
                created_at  TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS flashcards (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id      INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                front       TEXT    NOT NULL,
                back        TEXT    NOT NULL,
                mastery     INTEGER DEFAULT 0,  -- 0=new, 1=hard, 2=medium, 3=easy
                last_review TEXT,
                created_at  TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS quiz_questions (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id        INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                question      TEXT    NOT NULL,
                option_a      TEXT    NOT NULL,
                option_b      TEXT    NOT NULL,
                option_c      TEXT    NOT NULL,
                option_d      TEXT    NOT NULL,
                correct_index INTEGER NOT NULL,  -- 0=A,1=B,2=C,3=D
                explanation   TEXT,
                created_at    TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id        INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                score         INTEGER NOT NULL,
                total         INTEGER NOT NULL,
                pct           REAL    NOT NULL,
                attempted_at  TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS flashcard_reviews (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                card_id     INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
                rating      TEXT    NOT NULL,  -- 'Easy' | 'Medium' | 'Hard'
                reviewed_at TEXT    DEFAULT (datetime('now'))
            );
        """)
    print(f"[DB] Initialised at {DB_PATH}")

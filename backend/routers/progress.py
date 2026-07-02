"""
GET /api/progress/stats        — overall learner stats
GET /api/progress/performance  — daily quiz score history (last 14 days)
GET /api/progress/topics       — topic mastery breakdown
"""

from datetime import datetime, timedelta
from fastapi import APIRouter
from database import get_conn
from models import ProgressResponse, ProgressStats, PerformancePoint, TopicMastery

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("", response_model=ProgressResponse)
def get_progress():
    with get_conn() as conn:
        # ── Overall stats ──────────────────────────────────────────────────────
        total_cards = conn.execute(
            "SELECT COUNT(*) as c FROM flashcards"
        ).fetchone()["c"]

        mastered_cards = conn.execute(
            "SELECT COUNT(*) as c FROM flashcards WHERE mastery = 3"
        ).fetchone()["c"]

        avg_score_row = conn.execute(
            "SELECT AVG(pct) as a FROM quiz_attempts"
        ).fetchone()
        avg_score = round(avg_score_row["a"] or 0, 1)

        total_reviews = conn.execute(
            "SELECT COUNT(*) as c FROM flashcard_reviews"
        ).fetchone()["c"]

        total_attempts = conn.execute(
            "SELECT COUNT(*) as c FROM quiz_attempts"
        ).fetchone()["c"]

        # Streak: consecutive days with at least one review or quiz attempt
        streak = _compute_streak(conn)

        # Due today: cards with mastery < 3 (simplified — not true spaced repetition)
        due_today = conn.execute(
            "SELECT COUNT(*) as c FROM flashcards WHERE mastery < 3"
        ).fetchone()["c"]

        # Overall mastery %
        overall_mastery_row = conn.execute(
            "SELECT AVG(mastery) as m FROM flashcards"
        ).fetchone()
        overall_mastery = round((overall_mastery_row["m"] or 0) / 3 * 100, 1)

        # Estimated hours (assume 1 min per card review + 2 min per quiz attempt)
        hours_studied = round((total_reviews * 1 + total_attempts * 2) / 60, 1)

        # Accuracy: correct answers / total submitted
        correct_row = conn.execute(
            "SELECT SUM(score) as s, SUM(total) as t FROM quiz_attempts"
        ).fetchone()
        accuracy_rate = (
            round(correct_row["s"] / correct_row["t"] * 100, 1)
            if correct_row["t"]
            else 0.0
        )

        # ── Performance over last 14 days ──────────────────────────────────────
        performance = _daily_performance(conn, days=14)

        # ── Topic mastery (from document subjects) ────────────────────────────
        topics = _topic_mastery(conn)

    stats = ProgressStats(
        streak=streak,
        cards_mastered=mastered_cards,
        avg_score=avg_score,
        due_today=due_today,
        overall_mastery=overall_mastery,
        cards_reviewed=total_reviews,
        hours_studied=hours_studied,
        accuracy_rate=accuracy_rate,
    )

    return ProgressResponse(stats=stats, performance=performance, topics=topics)


def _compute_streak(conn) -> int:
    """Count consecutive days (from today backward) with any activity."""
    rows = conn.execute(
        """
        SELECT date(reviewed_at) as d FROM flashcard_reviews
        UNION
        SELECT date(attempted_at) as d FROM quiz_attempts
        ORDER BY d DESC
        """
    ).fetchall()

    if not rows:
        return 0

    unique_days = sorted({r["d"] for r in rows}, reverse=True)
    today = datetime.utcnow().date()
    streak = 0

    for i, day_str in enumerate(unique_days):
        day = datetime.strptime(day_str, "%Y-%m-%d").date()
        expected = today - timedelta(days=i)
        if day == expected:
            streak += 1
        else:
            break

    return streak


def _daily_performance(conn, days: int = 14) -> list[PerformancePoint]:
    """Average quiz score per day for the last N days."""
    rows = conn.execute(
        """
        SELECT date(attempted_at) as day, AVG(pct) as avg_pct
        FROM quiz_attempts
        WHERE attempted_at >= date('now', ?)
        GROUP BY date(attempted_at)
        ORDER BY day ASC
        """,
        (f"-{days} days",),
    ).fetchall()

    return [
        PerformancePoint(
            day=datetime.strptime(r["day"], "%Y-%m-%d").strftime("%b %d"),
            score=round(r["avg_pct"], 1),
        )
        for r in rows
    ]


def _topic_mastery(conn) -> list[TopicMastery]:
    """Mastery per subject (from documents table)."""
    rows = conn.execute(
        """
        SELECT d.subject, AVG(f.mastery) as avg_mastery
        FROM documents d
        JOIN flashcards f ON f.doc_id = d.id
        GROUP BY d.subject
        ORDER BY avg_mastery DESC
        """
    ).fetchall()

    return [
        TopicMastery(
            topic=r["subject"],
            mastery=round((r["avg_mastery"] or 0) / 3 * 100),
        )
        for r in rows
    ]

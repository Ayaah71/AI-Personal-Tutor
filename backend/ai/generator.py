"""
Google Gemini AI generation: summary, flashcards, and quiz questions.
Falls back to structured placeholder output if the API key is missing,
so the app still works end-to-end without a key during development.
"""

import os
import json
import re
import textwrap
from typing import Any

# ─── Gemini client setup ──────────────────────────────────────────────────────

_client = None


def _get_client():
    global _client
    if _client is None:
        try:
            import google.generativeai as genai

            api_key = os.getenv("GEMINI_API_KEY", "")
            if not api_key:
                return None
            genai.configure(api_key=api_key)
            _client = genai.GenerativeModel("gemini-1.5-flash")
        except ImportError:
            return None
    return _client


# ─── JSON extraction helper ───────────────────────────────────────────────────

def _parse_json(text: str) -> Any:
    """Strip markdown fences and parse JSON."""
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    return json.loads(text)


def _truncate(text: str, max_chars: int = 12000) -> str:
    """Truncate text to stay within Gemini context limits."""
    return text[:max_chars] if len(text) > max_chars else text


# ─── Summary ──────────────────────────────────────────────────────────────────

def generate_summary(text: str, filename: str = "") -> dict:
    """
    Returns:
        {
            "title": str,
            "subtitle": str,
            "summary": str,      # 3-4 paragraphs, key terms wrapped in <mark>...</mark>
            "concepts": [str],   # 6-10 key concept labels
            "subject": str
        }
    """
    client = _get_client()
    if client is None:
        return _fallback_summary(filename)

    prompt = textwrap.dedent(f"""
        You are an expert tutor. Analyse the following study material and return a JSON object.

        Rules:
        - "title": a concise title for this material (max 60 chars)
        - "subtitle": e.g. "Uploaded from PDF · <N> pages · Processed today"
        - "summary": 3-4 paragraphs in plain text. Wrap key terms with <mark>term</mark>.
        - "concepts": list of 6-10 key concept labels (short strings, not sentences)
        - "subject": one of Biology, Chemistry, Physics, Mathematics, History, Language, Economics, Computer Science, General

        Respond with ONLY a valid JSON object, no extra text.

        Study material:
        \"\"\"
        {_truncate(text)}
        \"\"\"
    """).strip()

    try:
        response = client.generate_content(prompt)
        data = _parse_json(response.text)
        return data
    except Exception as e:
        print(f"[AI] summary generation failed: {e}")
        return _fallback_summary(filename)


def _fallback_summary(filename: str) -> dict:
    name = filename.replace("_", " ").replace("-", " ").rsplit(".", 1)[0]
    return {
        "title": name or "Uploaded Document",
        "subtitle": "Document processed · AI generation unavailable",
        "summary": (
            "Summary generation requires a valid <mark>GEMINI_API_KEY</mark>. "
            "Set the key in your <mark>.env</mark> file and re-upload the document.\n\n"
            "The document was successfully parsed and stored. Once you add the API key, "
            "flashcards and quizzes will be generated automatically."
        ),
        "concepts": ["Add GEMINI_API_KEY to enable AI features"],
        "subject": "General",
    }


# ─── Flashcards ───────────────────────────────────────────────────────────────

def generate_flashcards(text: str, n: int = 10) -> list[dict]:
    """
    Returns a list of {"front": str, "back": str} dicts.
    """
    client = _get_client()
    if client is None:
        return _fallback_flashcards()

    prompt = textwrap.dedent(f"""
        You are an expert tutor creating flashcards from study material.

        Generate exactly {n} flashcards as a JSON array.
        Each item: {{"front": "<question or term>", "back": "<detailed answer/explanation>"}}

        Rules:
        - Front: a clear question or term (< 120 chars)
        - Back: a comprehensive explanation (2-5 sentences)
        - Cover the most important concepts from the material
        - Vary question types: definitions, mechanisms, comparisons, examples

        Respond with ONLY a valid JSON array, no extra text.

        Study material:
        \"\"\"
        {_truncate(text)}
        \"\"\"
    """).strip()

    try:
        response = client.generate_content(prompt)
        data = _parse_json(response.text)
        if isinstance(data, list):
            return data[:n]
        return _fallback_flashcards()
    except Exception as e:
        print(f"[AI] flashcard generation failed: {e}")
        return _fallback_flashcards()


def _fallback_flashcards() -> list[dict]:
    return [
        {
            "front": "AI generation unavailable — what do I need to do?",
            "back": "Add your GEMINI_API_KEY to the backend/.env file, then re-upload your document to generate real flashcards.",
        }
    ]


# ─── Quiz ─────────────────────────────────────────────────────────────────────

def generate_quiz(text: str, n: int = 5) -> list[dict]:
    """
    Returns a list of:
    {
        "question": str,
        "options": [str, str, str, str],  # always 4
        "correct_index": int,             # 0-3
        "explanation": str
    }
    """
    client = _get_client()
    if client is None:
        return _fallback_quiz()

    prompt = textwrap.dedent(f"""
        You are an expert tutor creating multiple-choice quiz questions.

        Generate exactly {n} MCQ questions as a JSON array.
        Each item:
        {{
            "question": "<clear question text>",
            "options": ["<A>", "<B>", "<C>", "<D>"],
            "correct_index": <0|1|2|3>,
            "explanation": "<2-3 sentence explanation of why the answer is correct>"
        }}

        Rules:
        - Exactly 4 options per question
        - One clearly correct answer
        - Plausible distractors (wrong answers that test understanding)
        - Explanation clarifies the concept tested

        Respond with ONLY a valid JSON array, no extra text.

        Study material:
        \"\"\"
        {_truncate(text)}
        \"\"\"
    """).strip()

    try:
        response = client.generate_content(prompt)
        data = _parse_json(response.text)
        if isinstance(data, list):
            return data[:n]
        return _fallback_quiz()
    except Exception as e:
        print(f"[AI] quiz generation failed: {e}")
        return _fallback_quiz()


def _fallback_quiz() -> list[dict]:
    return [
        {
            "question": "What is needed to enable AI-generated quiz questions?",
            "options": [
                "A paid subscription",
                "A GEMINI_API_KEY in the .env file",
                "An internet connection only",
                "No setup required",
            ],
            "correct_index": 1,
            "explanation": (
                "You need to add your GEMINI_API_KEY to the backend/.env file. "
                "Get a free key at https://makersuite.google.com/app/apikey — "
                "Gemini 1.5 Flash has a generous free tier."
            ),
        }
    ]

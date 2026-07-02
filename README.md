# AI Personal Tutor 📚🤖

An adaptive AI-powered learning system that transforms study materials into personalised summaries, flashcards, and quizzes — helping you learn faster and retain knowledge longer.

---

## 🚀 Features

- 📄 Upload **PDF**, **DOCX**, or **plain-text / Markdown** files
- 🧠 AI-generated **summaries** with highlighted key concepts
- 🃏 Auto-generated **flashcards** with mastery tracking (Easy / Medium / Hard)
- 📝 Auto-generated **multiple-choice quizzes** with explanations
- 📊 **Progress dashboard** — streak, accuracy rate, per-topic mastery chart
- ⚡ Works without an API key (falls back to structured placeholder content)

---

## 🧠 How It Works

1. User uploads a study document (PDF / DOCX / TXT)
2. Backend extracts and stores the raw text
3. **Google Gemini 1.5 Flash** generates:
   - A structured summary (title, subtitle, key concepts)
   - 10 flashcards (`front` / `back` pairs)
   - 5 MCQ quiz questions with explanations
4. Everything is persisted in a local **SQLite** database
5. User reviews cards, takes quizzes → mastery scores update automatically
6. Progress dashboard aggregates streaks, scores, and per-topic mastery

---

## 🛠 Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| **Python 3.11+** | Runtime |
| **FastAPI** | REST API framework |
| **SQLite** (via `sqlite3`) | Local persistence |
| **PyMuPDF** (`fitz`) | PDF text extraction |
| **python-docx** | DOCX text extraction |
| **Google Generative AI** (`gemini-1.5-flash`) | Summary / flashcard / quiz generation |
| **Pydantic** | Request / response validation |
| **python-dotenv** | `.env` config loading |
| **uvicorn** | ASGI server |

### Frontend
| Tool | Purpose |
|------|---------|
| **React 18** | UI framework |
| **Vite 6** | Build tool & dev server |
| **TypeScript** | Type-safe API client |
| **Tailwind CSS v4** | Utility-first styling |
| **Recharts** | Progress charts |
| **Lucide React** | Icons |

---

## 📁 Project Structure

```
AI-Personal-Tutor/
├── backend/
│   ├── main.py              # FastAPI app & CORS config
│   ├── database.py          # SQLite schema & helpers
│   ├── models.py            # Pydantic request/response models
│   ├── requirements.txt     # Python dependencies
│   ├── ai/
│   │   ├── extractor.py     # PDF / DOCX / TXT text extraction
│   │   └── generator.py     # Gemini summary, flashcard & quiz generation
│   └── routers/
│       ├── upload.py        # POST /api/upload
│       ├── documents.py     # GET /api/documents
│       ├── flashcards.py    # GET /api/flashcards/:id  POST /api/flashcards/:id/review
│       ├── quiz.py          # GET /api/quiz/:id  POST /api/quiz/submit
│       └── progress.py      # GET /api/progress
└── frontend/
    ├── index.html
    ├── vite.config.ts       # Vite + /api proxy to :8000
    └── src/
        ├── main.tsx
        ├── api.ts           # Typed fetch client
        ├── app/             # Page components
        └── styles/          # Global CSS
```

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Google Gemini API key](https://makersuite.google.com/app/apikey) *(optional — app works without one)*

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Optional: add your Gemini key
echo "GEMINI_API_KEY=your_key_here" > .env

uvicorn main:app --reload
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to the FastAPI backend at `localhost:8000`, so no extra CORS config is needed during development.

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload a document; triggers AI generation |
| `GET` | `/api/documents` | List all uploaded documents |
| `GET` | `/api/documents/{id}` | Get a single document |
| `GET` | `/api/flashcards/{doc_id}` | Get flashcards for a document |
| `POST` | `/api/flashcards/{card_id}/review` | Record a card review rating |
| `GET` | `/api/quiz/{doc_id}` | Get quiz questions for a document |
| `POST` | `/api/quiz/submit` | Submit quiz answers, get score |
| `GET` | `/api/progress` | Aggregate progress stats |
| `GET` | `/api/health` | Health check + Gemini key status |

---

## 🎯 Roadmap

- [ ] Spaced repetition scheduler (Anki-style)
- [ ] Multi-document topic linking
- [ ] Voice-based Q&A assistant
- [ ] Multi-language support
- [ ] User accounts & cloud sync

---

## 👨‍💻 Author

Built by an AI Engineer passionate about NLP, intelligent learning systems, and developer tooling.

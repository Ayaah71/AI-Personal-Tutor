# AI Personal Tutor 📚🤖

An adaptive AI-powered learning system that transforms study materials into personalized quizzes, summaries, and flashcards to help users learn faster and retain knowledge more effectively.

---

## 🚀 Features

- 📄 Upload PDFs, notes, or text materials
- 🧠 AI-powered summarization of content
- 📝 Automatic quiz generation (MCQs + short answers)
- 🔁 Adaptive learning based on user performance
- 🎯 Focus on weak areas using spaced repetition
- 📊 Progress tracking dashboard

---

## 🧠 How It Works

1. User uploads study material  
2. System extracts and chunks content  
3. Embedding model stores knowledge (FAISS / vector DB)  
4. LLM generates:
   - summaries  
   - flashcards  
   - quizzes  
5. User answers → system adapts difficulty

---

## 🛠 Tech Stack

- Python 🐍  
- FastAPI  
- Hugging Face Transformers  
- FAISS (vector search)  
- Streamlit / React (UI)  
- OpenAI / LLM API (optional)

---

## 📊 System Architecture

- Document Ingestion Layer  
- Embedding & Retrieval Layer  
- LLM Generation Layer  
- User Performance Tracker  
- Frontend Dashboard  

---

## 🎯 Future Improvements

- Spaced repetition scheduler (like Anki)
- Voice-based learning assistant
- Multi-language support
- Exam simulation mode

---

## 📷 Demo
(Add screenshots or GIF here)

---

## 👨‍💻 Author
Built by an AI Engineer passionate about NLP, recommender systems, and intelligent learning systems.

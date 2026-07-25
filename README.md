# PocketVerse

AI Creator Copilot for serialized audio storytelling. Catches continuity errors — character contradictions, timeline breaks, broken promises — using a **Story Memory Graph** and evidence-backed validation.

Built for the Pocket FM "Zero to One" Hackathon.

## Quick Start

### Backend (port 8000)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS — dark cinematic theme
- **Backend**: FastAPI + async SQLAlchemy + aiosqlite
- **LLM**: OpenAI `gpt-4.1-mini` via structured outputs

### Pipeline
```
Episodes → Extraction (LLM) → Story Memory Graph (DB)
                                       ↓
                              Validation Engine (deterministic)
                                       ↓
                              Explanation Layer (LLM explains findings)
                                       ↓
                              Re-validation (deterministic re-check)
```

## Team
PocketVerse Hackathon Team

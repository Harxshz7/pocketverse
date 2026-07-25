# PocketVerse Backend

AI Creator Copilot for serialized audio storytelling — FastAPI backend.

## Quick Start

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

## Architecture

```
Episodes (raw text)
       ↓
Memory Extraction (LLM call, structured output) → extraction.py
       ↓
Story Memory Graph (relational DB) → models.py + memory_graph.py
       ↓
Validation Engine (deterministic, zero LLM) → validation_engine.py
       ↓
Evidence Retrieval (from graph)
       ↓
Explanation Layer (LLM explains findings) → explanation.py
       ↓
Re-validation (deterministic re-check)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/episodes` | List episodes |
| POST | `/api/v1/episodes` | Ingest episode |
| GET | `/api/v1/episodes/{id}` | Get episode |
| PUT | `/api/v1/episodes/{id}` | Update episode |
| GET | `/api/v1/story-memory` | Get Story Memory Graph |
| POST | `/api/v1/episodes/{id}/validate` | Run validation |
| POST | `/api/v1/episodes/{id}/revalidate` | Re-validate after edit |
| GET | `/api/v1/episodes/{id}/issues` | Get issues |
| GET | `/api/v1/usage` | Token/cost stats |

## Environment Variables

- `OPENAI_API_KEY` — Required for LLM extraction and explanation
- `DATABASE_URL` — Default: `sqlite+aiosqlite:///./pocketverse.db`
- `MODEL_NAME` — Default: `gpt-4.1-mini`

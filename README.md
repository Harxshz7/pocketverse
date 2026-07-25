# StoryGuard (PocketVerse)

AI operating system for long-form story creators. StoryGuard ingests stories, builds permanent story memory, maintains a knowledge graph, detects plot holes, powers a writers room, and produces consistency-safe rewrites.

## Quick Start

### Backend (port 8000)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
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

- **Frontend**: React 19, Vite, TailwindCSS, moving to TypeScript, React Query, React Router, Zustand, React Flow, and shadcn/ui.
- **Backend**: FastAPI, Python 3.12, Pydantic v2, SQLAlchemy, Alembic, PostgreSQL, pgvector, Redis, Celery.
- **AI**: OpenAI structured outputs, embeddings, streaming responses, and retrieval-bounded prompt construction.

Architecture source of truth:

- `docs/architecture/system-architecture.md`
- `docs/architecture/folder-structure.md`
- `docs/architecture/database-schema.md`

The existing prototype API remains runnable while the production Clean Architecture modules are introduced phase by phase.

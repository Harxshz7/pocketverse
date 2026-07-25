# StoryGuard Backend

FastAPI backend for StoryGuard, the AI operating system for long-form story creators.

## Quick Start

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

## Architecture

The production architecture is layered under:

- `app/domain` for enums, entities, and domain invariants.
- `app/application` for use cases, commands, queries, services, and ports.
- `app/infrastructure` for SQLAlchemy, OpenAI, queues, storage, and parsers.
- `app/interfaces/http` for FastAPI routers and transport DTOs.

The prototype modules in `app/*.py` remain operational during migration.

## Database

Production schema ownership starts in:

- `app/infrastructure/persistence/models.py`
- `alembic/versions/202607250001_storyguard_foundation.py`

Run migrations from `backend/`:

```bash
alembic upgrade head
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
- `DATABASE_URL` — PostgreSQL async URL for production
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` — Async pipeline infrastructure
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` — File storage
- `JWT_SECRET_KEY` — Signing key for access and refresh tokens
- `MODEL_NAME`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS` — AI model configuration

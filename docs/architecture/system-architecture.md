# StoryGuard System Architecture

StoryGuard is the AI operating system for long-form story creation. The product must preserve a permanent, queryable understanding of a story universe while keeping AI calls bounded, auditable, and recoverable.

## Architecture Principles

- Clean Architecture: domain rules do not depend on FastAPI, SQLAlchemy, OpenAI, Redis, Celery, or Supabase.
- DDD: story, memory, graph, review, rewrite, and agent workflows are modeled as bounded contexts.
- CQRS where it pays off: write paths preserve invariants and audit trails; read paths serve dashboard views, graph views, and search with optimized projections.
- Asynchronous by default: uploads, extraction, embeddings, graph updates, plot-hole analysis, agents, rewrites, and analytics run as jobs.
- Retrieval first: the AI layer never sends entire stories to model providers. It composes context from graph facts, timeline slices, embeddings, rules, relationships, and episode history.
- Deterministic before generative: validation, safety checks, permissions, idempotency, and patch application run in application/domain code before any LLM explanation or rewrite is accepted.

## Backend Bounded Contexts

**Identity**
Owns users, roles, refresh tokens, audit attribution, and RBAC decisions.

**Library**
Owns stories, episodes, scenes, paragraphs, versions, and upload status.

**Ingestion**
Owns file intake, text extraction, normalization, chunking, episode detection, scene detection, paragraph detection, embeddings, and extraction jobs.

**Story Memory**
Owns characters, locations, objects, relationships, timeline events, rules, graph nodes, graph edges, entity mentions, and memory snapshots.

**AI Orchestration**
Owns model calls, structured output schemas, prompt assembly, token budgets, provider retries, rate limits, and AI job records.

**Plot Hole Engine**
Owns inconsistency detectors, severity classification, evidence selection, fix generation, and review lifecycle.

**Writers Room**
Owns specialized agents, independent agent runs, synthesis, recommendations, and creator feedback.

**Rewrite Engine**
Owns rewrite intents, constraints, candidate generation, consistency validation, accepted rewrites, and version creation.

**Analytics**
Owns derived metrics for story complexity, pacing, character density, unresolved promises, emotional movement, and issue trends.

## Runtime Flow

1. Authenticated creator uploads a file for a story.
2. API validates ownership, MIME type, file size, extension, and malware/safety constraints.
3. File is persisted to storage and an upload job is enqueued.
4. Worker extracts text, normalizes it, chunks it, detects episodes/scenes/paragraphs, and persists stable content records.
5. Embedding jobs run per paragraph/scene/summary chunk and persist vector rows with content hashes.
6. Extraction jobs call structured-output AI only on bounded chunks with known schema contracts.
7. Story Memory updates entities, relationships, rules, graph nodes, graph edges, and timeline events incrementally.
8. Plot-hole jobs run deterministic checks, retrieve evidence, and call AI only for explanation/fix drafting.
9. The dashboard reads from persisted API views and streams long-running job progress.

## Data Flow Boundaries

- HTTP handlers only validate transport concerns, call application services, and return DTOs.
- Application services own transactions, idempotency, authorization checks, and orchestration.
- Repositories expose persistence contracts and hide SQLAlchemy details from application code.
- Domain services own consistency rules and can run without database or network access.
- Infrastructure adapters own SQLAlchemy, OpenAI, Redis, Celery, Supabase, and file parsers.

## AI Context Policy

Every AI operation receives an explicit context budget and source plan:

- Graph facts: canonical entities, active relationships, rule state, lifecycle state, powers, objects, and aliases.
- Timeline slices: causally adjacent events, episode range windows, and contradiction candidates.
- Vector recall: semantically relevant paragraphs/scenes with source offsets and content hashes.
- Episode history: compact summaries and recent accepted versions.
- Review state: unresolved plot holes, accepted fixes, rejected suggestions, and creator feedback.

The prompt builder must emit a structured context manifest for auditability. Model responses that update memory must validate against JSON Schema and database invariants before persistence.

## API Surface

All public endpoints live under `/api/v1`. Long-running operations return job records and expose status polling plus server-sent event streams. Collection endpoints support pagination, filtering, ordering, and search. Mutations are idempotent where clients can retry safely.

## Deployment Target

- API: FastAPI on Python 3.12.
- Worker: Celery workers with Redis broker/result backend.
- Database: PostgreSQL with pgvector.
- Object storage: Supabase Storage.
- Frontend: React 19 + Vite + TypeScript deployed as static assets behind CDN.
- Observability: structured logs, request IDs, audit logs, job logs, model usage logs, and latency/cost counters.


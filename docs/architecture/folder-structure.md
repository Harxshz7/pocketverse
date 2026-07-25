# StoryGuard Folder Structure

The repository is split by deployable surface first, then by architectural responsibility.

```text
pocketverse/
  backend/
    app/
      core/
        config.py
        errors.py
        logging.py
        security.py
      domain/
        enums.py
        identity/
        library/
        memory/
        plot_holes/
        rewrites/
        writers_room/
      application/
        commands/
        queries/
        services/
        ports/
      infrastructure/
        ai/
        persistence/
        queue/
        storage/
        text_extraction/
      interfaces/
        http/
          api/
            v1/
              routers/
              dependencies.py
              pagination.py
              schemas.py
      main.py
    alembic/
      versions/
    tests/
      unit/
      integration/
      api/
      ai_pipeline/
  frontend/
    src/
      app/
      components/
      features/
      hooks/
      lib/
      routes/
      services/
      stores/
      styles/
      types/
  docs/
    architecture/
```

## Backend Rules

- `domain/` contains entities, value objects, enums, domain services, and invariants. It imports only Python standard library and Pydantic where value validation is useful.
- `application/` contains use cases, commands, queries, service interfaces, transactions, and DTO contracts.
- `infrastructure/` implements ports: SQLAlchemy repositories, OpenAI clients, Celery tasks, Redis rate limiters, Supabase storage, and file parsers.
- `interfaces/http/` contains FastAPI routers, dependencies, transport schemas, and response mapping.
- `core/` contains cross-cutting runtime primitives: settings, auth primitives, logging, error mapping, and request IDs.
- Existing prototype modules under `backend/app/*.py` remain only until their behavior is migrated into these boundaries.

## Frontend Rules

- `features/` owns product workflows such as stories, uploads, graph, plot holes, agents, rewrite, analytics, and settings.
- `components/` contains reusable UI primitives and layout components only.
- `services/` contains API clients generated or hand-written against backend DTOs.
- `stores/` contains Zustand stores for local UI state; server state belongs to React Query.
- `routes/` contains route definitions and page shells.
- TypeScript is mandatory for new frontend code.


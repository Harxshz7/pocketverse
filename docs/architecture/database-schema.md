# StoryGuard Database Schema

The production database is PostgreSQL with pgvector. SQLAlchemy models live in `backend/app/infrastructure/persistence/models.py`; Alembic owns schema evolution.

## Required Extensions

- `pgcrypto` for UUID generation when needed in raw SQL.
- `vector` for embedding search.

## Core Tables

| Table | Purpose |
| --- | --- |
| `users` | Creator identity, role, account status, and auth ownership. |
| `refresh_tokens` | Rotatable refresh-token sessions. |
| `stories` | Top-level story universe owned by a creator. |
| `episodes` | Ordered story installments and processing state. |
| `scenes` | Ordered scene slices within episodes. |
| `paragraphs` | Smallest stable text unit with offsets and hashes. |
| `characters` | Canonical character memory, aliases, status, motivations, powers, lifecycle state. |
| `locations` | Canonical places and world areas. |
| `objects` | Canonical story objects, artifacts, weapons, documents, and ownership state. |
| `relationships` | Directed character-to-character relationship state. |
| `timeline_events` | Ordered causal event memory across the story. |
| `story_rules` | World rules, power rules, social rules, and narrative constraints. |
| `embeddings` | Vector search rows for paragraphs, scenes, summaries, entities, and events. |
| `graph_nodes` | Canonical graph nodes for entities, events, rules, emotions, and episodes. |
| `graph_edges` | Incremental graph edges such as KNOWS, LOVES, PROMISED, KILLED, VISITED, OWNS. |
| `ai_jobs` | Durable async work records for extraction, embeddings, validation, agents, and rewrites. |
| `agents` | Writers-room agent definitions and model configuration. |
| `reviews` | Human/AI review sessions for validation and recommendations. |
| `plot_holes` | Persisted continuity issues with severity, evidence, and status. |
| `suggestions` | Fixes, recommendations, and rewrite suggestions attached to issues/reviews. |
| `versions` | Immutable content versions for stories, episodes, scenes, or paragraphs. |
| `rewrites` | Rewrite requests, constraints, outputs, and validation state. |
| `feedback` | Creator feedback on suggestions, agents, rewrites, and issues. |
| `audit_logs` | Security and product audit trail. |

## Indexing Strategy

- Ownership and list views: `(owner_id, deleted_at)`, `(story_id, status)`, `(story_id, sequence_number)`.
- Timeline: `(story_id, canonical_order)`, `(episode_id, local_order)`, `(story_id, event_type)`.
- Graph traversal: `(story_id, node_type, canonical_id)`, `(story_id, source_node_id, edge_type)`, `(story_id, target_node_id, edge_type)`.
- Entity lookup: normalized-name indexes per story for characters, locations, objects, and aliases in JSONB.
- Search: full-text indexes are planned on normalized content fields; vector indexes use pgvector HNSW cosine search.
- Jobs: `(status, scheduled_at)`, `(story_id, job_type, status)`, unique idempotency keys.

## Integrity Rules

- Every mutable table has `created_at`, `updated_at`, and optional `deleted_at`.
- Ordered child records enforce unique sequence positions within their parent.
- User-owned resources cascade only where deleting the parent makes orphaned data meaningless.
- AI outputs are persisted as structured JSON plus schema version and model metadata.
- Embeddings are content-hash keyed so unchanged text is not embedded again.
- Plot holes and suggestions preserve evidence source IDs and character offsets for reproducible reviews.


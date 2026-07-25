"""PocketVerse API — FastAPI application and route definitions.

All endpoints are versioned under /api/v1.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .database import async_session, get_db, init_db
from . import memory_graph, models
from .extraction import extract_story_elements
from .explanation import explain_finding, explain_findings
from .schemas import (
    EpisodeCreate,
    EpisodeListItem,
    EpisodeResponse,
    StoryMemoryGraph,
    ValidationFinding,
    ValidationIssueSchema,
)
from .token_logger import get_usage_summary
from .validation_engine import validate_episode

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("pocketverse.api")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PocketVerse API",
    description="AI Creator Copilot for serialized audio storytelling",
    version="0.1.0",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Initialize the database on startup."""
    await init_db()
    logger.info("PocketVerse API started — database initialized")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}


# ---------------------------------------------------------------------------
# Token usage
# ---------------------------------------------------------------------------


@app.get("/api/v1/usage")
async def usage():
    """Return current token/cost usage statistics."""
    return get_usage_summary()


# ---------------------------------------------------------------------------
# Episodes
# ---------------------------------------------------------------------------


@app.get("/api/v1/episodes", response_model=list[EpisodeListItem])
async def list_episodes(db: AsyncSession = Depends(get_db)):
    """List all ingested episodes."""
    episodes = await memory_graph.get_all_episodes(db)
    return [EpisodeListItem.model_validate(e) for e in episodes]


@app.get("/api/v1/episodes/{episode_id}", response_model=EpisodeResponse)
async def get_episode(episode_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single episode by ID."""
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")
    return EpisodeResponse.model_validate(episode)


@app.post("/api/v1/episodes", response_model=EpisodeResponse, status_code=201)
async def ingest_episode(body: EpisodeCreate, db: AsyncSession = Depends(get_db)):
    """Ingest a new episode — triggers extraction and updates the Story Memory Graph.

    Pipeline: raw text → LLM extraction → structured graph update.
    """
    # Check for duplicate episode number
    existing = await memory_graph.get_episode_by_number(db, body.number)
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Episode {body.number} already exists (id={existing.id})",
        )

    # 1. Create the episode record
    episode = models.Episode(
        number=body.number,
        title=body.title,
        raw_text=body.raw_text,
    )
    db.add(episode)
    await db.flush()

    logger.info("Created episode %d: '%s' (id=%d)", body.number, body.title, episode.id)

    # 2. Extract story elements via LLM
    existing_chars = await memory_graph.get_all_characters(db)
    existing_names = [c.name for c in existing_chars]

    extraction = await extract_story_elements(
        episode_text=body.raw_text,
        episode_number=body.number,
        existing_characters=existing_names,
    )

    # 3. Persist extracted elements into the Story Memory Graph

    # Characters
    char_name_to_id: dict[str, int] = {}
    for ec in extraction.characters:
        char = await memory_graph.get_or_create_character(
            db,
            name=ec.name,
            episode_id=episode.id,
            traits=ec.traits,
            motivations=ec.motivations,
            backstory=ec.backstory,
        )
        char_name_to_id[ec.name] = char.id

    # Build name→id map for all characters (including pre-existing)
    all_chars = await memory_graph.get_all_characters(db)
    full_name_map = {c.name: c.id for c in all_chars}

    # Relationships
    for er in extraction.relationships:
        a_id = full_name_map.get(er.character_a_name)
        b_id = full_name_map.get(er.character_b_name)
        if a_id and b_id:
            await memory_graph.add_relationship(
                db, a_id, b_id, er.type, er.description, episode.id
            )

    # Calculate global sequence offset
    all_events = await memory_graph.get_all_timeline_events(db)
    max_seq = max((e.sequence_order for e in all_events), default=0)

    # Timeline events
    for et in extraction.timeline_events:
        char_ids = [
            full_name_map[name]
            for name in et.characters_involved
            if name in full_name_map
        ]
        await memory_graph.add_timeline_event(
            db,
            episode_id=episode.id,
            event_description=et.event_description,
            characters_involved=char_ids,
            turning_point_type=et.turning_point_type.value if et.turning_point_type else None,
            sequence_order=max_seq + et.sequence_order,
        )

    # World rules
    for ew in extraction.world_rules:
        await memory_graph.add_world_rule(db, ew.rule, episode.id, ew.category)

    # Promises
    for ep in extraction.promises:
        await memory_graph.add_promise(db, ep.description, episode.id, ep.fulfilled)

    # Secrets
    for es in extraction.secrets:
        holder_id = full_name_map.get(es.holder_name)
        if holder_id:
            await memory_graph.add_secret(
                db, es.description, holder_id, episode.id, es.revealed
            )

    await db.commit()

    logger.info(
        "Extraction complete for ep%d: %d chars, %d rels, %d events, %d rules, %d promises, %d secrets",
        body.number,
        len(extraction.characters),
        len(extraction.relationships),
        len(extraction.timeline_events),
        len(extraction.world_rules),
        len(extraction.promises),
        len(extraction.secrets),
    )

    # Refresh to get created_at
    await db.refresh(episode)
    return EpisodeResponse.model_validate(episode)


# ---------------------------------------------------------------------------
# Story Memory Graph
# ---------------------------------------------------------------------------


@app.get("/api/v1/story-memory", response_model=StoryMemoryGraph)
async def get_story_memory(db: AsyncSession = Depends(get_db)):
    """Return the complete structured Story Memory Graph."""
    return await memory_graph.get_full_story_memory(db)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


@app.get(
    "/api/v1/episodes/{episode_id}/issues",
    response_model=list[ValidationIssueSchema],
)
async def get_episode_issues(
    episode_id: int, db: AsyncSession = Depends(get_db)
):
    """Get existing validation issues for an episode."""
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")

    issues = await memory_graph.get_issues_for_episode(db, episode_id)
    return [ValidationIssueSchema.model_validate(i) for i in issues]


@app.post(
    "/api/v1/episodes/{episode_id}/validate",
    response_model=list[ValidationIssueSchema],
)
async def validate_episode_endpoint(
    episode_id: int, db: AsyncSession = Depends(get_db)
):
    """Run the Validation Engine on an episode.

    Pipeline: deterministic checks → evidence retrieval → LLM explanation.
    Returns structured issues with full evidence and explanations.
    """
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")

    # 1. Run deterministic validation
    findings = await validate_episode(db, episode_id)

    if not findings:
        logger.info("No issues found for episode %d", episode_id)
        return []

    # 2. Generate explanations for each finding
    explanations = await explain_findings(findings, episode.number)

    # 3. Persist as ValidationIssues
    issues: list[models.ValidationIssue] = []
    for finding, explanation in zip(findings, explanations):
        issue = models.ValidationIssue(
            id=str(uuid.uuid4()),
            episode_id=episode_id,
            category=finding.category.value,
            status=finding.status.value,
            problem=explanation.problem,
            evidence=[e.model_dump() for e in finding.evidence],
            reasoning=explanation.reasoning,
            impact=explanation.impact,
            suggested_fixes=explanation.suggested_fixes,
            resolved=False,
        )
        db.add(issue)
        issues.append(issue)

    await db.commit()

    logger.info(
        "Validation of episode %d produced %d issues", episode_id, len(issues)
    )

    return [ValidationIssueSchema.model_validate(i) for i in issues]


@app.post(
    "/api/v1/episodes/{episode_id}/revalidate",
    response_model=list[ValidationIssueSchema],
)
async def revalidate_episode(
    episode_id: int, db: AsyncSession = Depends(get_db)
):
    """Re-run validation after a creator edit.

    Clears old issues, re-runs the validation engine, and returns
    updated statuses. Previously flagged issues that no longer appear
    are implicitly resolved.
    """
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")

    # Get old issues for comparison
    old_issues = await memory_graph.get_issues_for_episode(db, episode_id)
    old_summaries = {i.problem for i in old_issues}

    # Clear old issues
    await memory_graph.clear_issues_for_episode(db, episode_id)

    # Re-run validation
    findings = await validate_episode(db, episode_id)

    if not findings:
        # All issues resolved!
        await db.commit()
        logger.info("Re-validation: all issues resolved for episode %d", episode_id)
        return []

    # Generate explanations
    explanations = await explain_findings(findings, episode.number)

    # Persist new issues
    issues: list[models.ValidationIssue] = []
    for finding, explanation in zip(findings, explanations):
        # Check if this was a previously known issue
        was_known = explanation.problem in old_summaries

        issue = models.ValidationIssue(
            id=str(uuid.uuid4()),
            episode_id=episode_id,
            category=finding.category.value,
            status=finding.status.value,
            problem=explanation.problem,
            evidence=[e.model_dump() for e in finding.evidence],
            reasoning=explanation.reasoning,
            impact=explanation.impact,
            suggested_fixes=explanation.suggested_fixes,
            resolved=False,
        )
        db.add(issue)
        issues.append(issue)

    await db.commit()

    logger.info(
        "Re-validation of episode %d: %d issues remain (was %d)",
        episode_id,
        len(issues),
        len(old_issues),
    )

    return [ValidationIssueSchema.model_validate(i) for i in issues]


# ---------------------------------------------------------------------------
# Update episode (for re-validation flow)
# ---------------------------------------------------------------------------


@app.put("/api/v1/episodes/{episode_id}", response_model=EpisodeResponse)
async def update_episode(
    episode_id: int, body: EpisodeCreate, db: AsyncSession = Depends(get_db)
):
    """Update an episode's text (for the edit → re-validate flow)."""
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")

    episode.raw_text = body.raw_text
    episode.title = body.title
    await db.commit()
    await db.refresh(episode)

    return EpisodeResponse.model_validate(episode)

"""StoryGuard API - FastAPI application and route definitions.

All endpoints are versioned under /api/v1.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .core.request_context import RequestIdMiddleware
from .database import get_db, init_db
from . import memory_graph, models
from .extraction import extract_story_elements
from .explanation import explain_findings
from .interfaces.http.api.v1.router import api_v1_router
from .interfaces.http.errors import register_error_handlers
from .rewrites import generate_rewrite_variants
from .schemas import (
    EpisodeCreate,
    EpisodeListItem,
    EpisodeResponse,
    EpisodeVersionSchema,
    FinalVersionResponse,
    PatchAction,
    PatchDecisionRequest,
    PatchDecisionSchema,
    RewriteVariantSchema,
    StoryMemoryGraph,
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
# Shared helpers
# ---------------------------------------------------------------------------


async def _extract_episode_facts_into_graph(
    db: AsyncSession,
    episode: models.Episode,
    episode_text: str,
) -> None:
    """Run the standard extraction path and persist facts into the graph."""
    existing_chars = await memory_graph.get_all_characters(db)
    existing_names = [c.name for c in existing_chars]

    extraction = await extract_story_elements(
        episode_text=episode_text,
        episode_number=episode.number,
        existing_characters=existing_names,
    )

    for ec in extraction.characters:
        await memory_graph.get_or_create_character(
            db,
            name=ec.name,
            episode_id=episode.id,
            traits=ec.traits,
            motivations=ec.motivations,
            backstory=ec.backstory,
        )

    all_chars = await memory_graph.get_all_characters(db)
    full_name_map = {c.name: c.id for c in all_chars}

    for er in extraction.relationships:
        a_id = full_name_map.get(er.character_a_name)
        b_id = full_name_map.get(er.character_b_name)
        if a_id and b_id:
            await memory_graph.add_relationship(
                db, a_id, b_id, er.type, er.description, episode.id
            )

    all_events = await memory_graph.get_all_timeline_events(db)
    max_seq = max((e.sequence_order for e in all_events), default=0)

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

    for ew in extraction.world_rules:
        await memory_graph.add_world_rule(db, ew.rule, episode.id, ew.category)

    for ep in extraction.promises:
        await memory_graph.add_promise(db, ep.description, episode.id, ep.fulfilled)

    for es in extraction.secrets:
        holder_id = full_name_map.get(es.holder_name)
        if holder_id:
            await memory_graph.add_secret(
                db, es.description, holder_id, episode.id, es.revealed
            )

    logger.info(
        "Extraction complete for ep%d: %d chars, %d rels, %d events, %d rules, %d promises, %d secrets",
        episode.number,
        len(extraction.characters),
        len(extraction.relationships),
        len(extraction.timeline_events),
        len(extraction.world_rules),
        len(extraction.promises),
        len(extraction.secrets),
    )


async def _latest_episode_text(
    db: AsyncSession, episode: models.Episode
) -> str:
    """Return the latest assembled version text, falling back to the original."""
    version = await memory_graph.get_latest_episode_version(db, episode.id)
    return version.raw_text if version else episode.raw_text


async def _rebuild_story_memory_graph(db: AsyncSession) -> None:
    """Rebuild graph facts from original episodes plus latest accepted versions."""
    await memory_graph.clear_story_memory_graph(db)
    episodes = await memory_graph.get_all_episodes(db)
    for episode in episodes:
        episode_text = await _latest_episode_text(db, episode)
        await _extract_episode_facts_into_graph(db, episode, episode_text)


def _find_patchable_span(
    issue: models.ValidationIssue,
    episode: models.Episode,
    episode_text: str,
) -> str | None:
    """Find an exact current-episode quote that can be safely patched."""
    if issue.status not in {"critical", "needs_review"}:
        return None

    for evidence in issue.evidence or []:
        excerpt = (evidence.get("excerpt") or "").strip()
        if (
            evidence.get("episode_number") == episode.number
            and excerpt
            and excerpt in episode_text
        ):
            return excerpt
    return None


async def _ensure_rewrite_variants(
    db: AsyncSession,
    issue: models.ValidationIssue,
    episode: models.Episode,
    episode_text: str,
) -> list[models.RewriteVariant]:
    """Generate and persist variants for eligible issues when missing."""
    existing = await memory_graph.get_rewrite_variants_for_issue(db, issue.id)
    if existing:
        return existing
    if issue.resolved:
        return []

    original_span = _find_patchable_span(issue, episode, episode_text)
    if original_span is None:
        return []

    try:
        variants = await generate_rewrite_variants(
            episode_number=episode.number,
            episode_title=episode.title,
            episode_text=episode_text,
            issue_category=issue.category,
            issue_status=issue.status,
            issue_problem=issue.problem,
            issue_reasoning=issue.reasoning,
            original_span=original_span,
        )
    except Exception:
        logger.exception("Rewrite variant generation failed for issue %s", issue.id)
        return []
    if not variants:
        return []
    return await memory_graph.add_rewrite_variants(db, issue.id, original_span, variants)


async def _issue_to_schema(
    db: AsyncSession,
    issue: models.ValidationIssue,
    episode: models.Episode,
    episode_text: str,
    ensure_variants: bool = True,
) -> ValidationIssueSchema:
    """Build the API issue response including variants and patch decision."""
    variants = (
        await _ensure_rewrite_variants(db, issue, episode, episode_text)
        if ensure_variants
        else await memory_graph.get_rewrite_variants_for_issue(db, issue.id)
    )
    decision = await memory_graph.get_patch_decision_for_issue(db, issue.id)

    schema = ValidationIssueSchema(
        id=issue.id,
        episode_id=issue.episode_id,
        category=issue.category,
        status=issue.status,
        problem=issue.problem,
        evidence=issue.evidence or [],
        reasoning=issue.reasoning,
        impact=issue.impact,
        suggested_fixes=issue.suggested_fixes or [],
        resolved=issue.resolved,
        resolved_evidence=issue.resolved_evidence,
        persona_tag=issue.persona_tag,
    )
    schema.rewrite_variants = [
        RewriteVariantSchema.model_validate(v) for v in variants
    ]
    schema.patch_decision = (
        PatchDecisionSchema.model_validate(decision) if decision else None
    )
    return schema


async def _issues_to_schemas(
    db: AsyncSession,
    issues: list[models.ValidationIssue],
    episode: models.Episode,
    episode_text: str,
    ensure_variants: bool = True,
) -> list[ValidationIssueSchema]:
    return [
        await _issue_to_schema(db, issue, episode, episode_text, ensure_variants)
        for issue in issues
    ]


async def _persist_validation_findings(
    db: AsyncSession,
    episode: models.Episode,
    episode_text: str,
    findings: list,
) -> list[models.ValidationIssue]:
    """Explain findings, persist issues, and generate eligible rewrite variants."""
    explanations = await explain_findings(findings, episode.number)
    issues: list[models.ValidationIssue] = []
    for finding, explanation in zip(findings, explanations):
        issue = models.ValidationIssue(
            id=str(uuid.uuid4()),
            episode_id=episode.id,
            category=finding.category.value,
            status=finding.status.value,
            problem=explanation.problem,
            evidence=[e.model_dump() for e in finding.evidence],
            reasoning=explanation.reasoning,
            impact=explanation.impact,
            suggested_fixes=explanation.suggested_fixes,
            persona_tag=explanation.persona_tag,
            resolved=False,
        )
        db.add(issue)
        await db.flush()
        await _ensure_rewrite_variants(db, issue, episode, episode_text)
        issues.append(issue)
    return issues


def _mark_unresolved_issues_resolved(
    issues: list[models.ValidationIssue],
    resolved_evidence: str,
) -> int:
    """Mark existing unresolved issues as resolved and return the count."""
    count = 0
    for issue in issues:
        if not issue.resolved:
            issue.resolved = True
            issue.resolved_evidence = resolved_evidence
            count += 1
    return count


def _apply_accepted_patches(
    original_text: str,
    decisions: list[models.PatchDecision],
) -> str:
    """Apply accepted patches against their original spans only."""
    accepted = [
        d
        for d in decisions
        if d.action == PatchAction.ACCEPT_VARIANT.value
        and d.original_span
        and d.rewritten_text
    ]
    if not accepted:
        raise HTTPException(
            status_code=400,
            detail="No accepted rewrite variants found for this episode.",
        )

    replacements: list[tuple[int, int, str, str]] = []
    for decision in accepted:
        start = original_text.find(decision.original_span)
        if start < 0:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Accepted patch span was not found in the original episode text. "
                    "Generate variants from an exact original quote before assembling."
                ),
            )
        end = start + len(decision.original_span)
        replacements.append((start, end, decision.original_span, decision.rewritten_text))

    replacements.sort(key=lambda item: item[0])
    previous_end = -1
    for start, end, _, _ in replacements:
        if start < previous_end:
            raise HTTPException(
                status_code=409,
                detail="Accepted patches overlap and cannot be applied safely.",
            )
        previous_end = end

    final_text = original_text
    for start, end, _, rewritten_text in reversed(replacements):
        final_text = final_text[:start] + rewritten_text + final_text[end:]
    return final_text

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="StoryGuard API",
    description="AI operating system for long-form story creators",
    version="0.2.0",
)

app.add_middleware(RequestIdMiddleware)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)
# FastAPI 0.140 keeps include_router entries deferred; the v1 router owns its prefix.
app.router.routes.extend(api_v1_router.routes)


@app.on_event("startup")
async def startup():
    """Initialize the database on startup."""
    await init_db()
    logger.info("StoryGuard API started - database initialized")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.2.0"}


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
    """Ingest a new episode - triggers extraction and updates the Story Memory Graph.

    Pipeline: raw text -> LLM extraction -> structured graph update.
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

    # 2. Extract story elements via the shared memory-graph path
    await _extract_episode_facts_into_graph(db, episode, body.raw_text)

    await db.commit()

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
    episode_text = await _latest_episode_text(db, episode)
    response = await _issues_to_schemas(db, issues, episode, episode_text)
    await db.commit()
    return response


@app.post(
    "/api/v1/episodes/{episode_id}/validate",
    response_model=list[ValidationIssueSchema],
)
async def validate_episode_endpoint(
    episode_id: int, db: AsyncSession = Depends(get_db)
):
    """Run the Validation Engine on an episode.

    Pipeline: deterministic checks -> evidence retrieval -> LLM explanation.
    Returns structured issues with full evidence and explanations.
    """
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")

    # 1. Run deterministic validation
    findings = await validate_episode(db, episode_id)
    episode_text = await _latest_episode_text(db, episode)

    if not findings:
        await db.commit()
        logger.info("No issues found for episode %d", episode_id)
        return []

    issues = await _persist_validation_findings(db, episode, episode_text, findings)

    await db.commit()

    logger.info(
        "Validation of episode %d produced %d issues", episode_id, len(issues)
    )

    return await _issues_to_schemas(
        db, issues, episode, episode_text, ensure_variants=False
    )


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

    # Re-run validation
    findings = await validate_episode(db, episode_id)
    episode_text = await _latest_episode_text(db, episode)

    if not findings:
        _mark_unresolved_issues_resolved(
            old_issues,
            "Re-validation passed; issue no longer appears in the current episode text.",
        )
        await db.commit()
        logger.info("Re-validation: all issues resolved for episode %d", episode_id)
        return []

    _mark_unresolved_issues_resolved(
        old_issues,
        "Re-validation produced a new issue set; this prior issue was superseded.",
    )
    issues = await _persist_validation_findings(db, episode, episode_text, findings)

    await db.commit()

    logger.info(
        "Re-validation of episode %d: %d issues remain (was %d)",
        episode_id,
        len(issues),
        len(old_issues),
    )

    return await _issues_to_schemas(
        db, issues, episode, episode_text, ensure_variants=False
    )


# ---------------------------------------------------------------------------
# Rewrite patch decisions and final assembly
# ---------------------------------------------------------------------------


@app.post(
    "/api/v1/issues/{issue_id}/patch",
    response_model=PatchDecisionSchema,
)
async def record_patch_decision(
    issue_id: str,
    body: PatchDecisionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Record Accept Variant N or Keep Original for an issue."""
    issue = await memory_graph.get_issue_by_id(db, issue_id)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")

    variant = None
    if body.action == PatchAction.ACCEPT_VARIANT:
        if not body.variant_id:
            raise HTTPException(
                status_code=400,
                detail="variant_id is required when accepting a variant.",
            )
        variant = await memory_graph.get_rewrite_variant(
            db, issue_id, body.variant_id
        )
        if variant is None:
            raise HTTPException(status_code=404, detail="Rewrite variant not found")

    decision = await memory_graph.upsert_patch_decision(
        db,
        issue=issue,
        action=body.action.value,
        variant=variant,
    )
    await db.commit()
    return PatchDecisionSchema.model_validate(decision)


@app.post(
    "/api/v1/episodes/{episode_id}/final-version",
    response_model=FinalVersionResponse,
)
async def generate_final_version(
    episode_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Assemble a final version from accepted patches, then revalidate it."""
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")

    old_issues = await memory_graph.get_issues_for_episode(db, episode_id)
    decisions = await memory_graph.get_patch_decisions_for_episode(db, episode_id)
    final_text = _apply_accepted_patches(episode.raw_text, decisions)

    version = await memory_graph.add_episode_version(
        db,
        episode_id=episode_id,
        raw_text=final_text,
        source="accepted_patches",
        validation_status="pending",
    )

    # Close the memory loop with the assembled version before revalidation.
    await _rebuild_story_memory_graph(db)
    findings = await validate_episode(db, episode_id)

    resolved_count = _mark_unresolved_issues_resolved(
        old_issues,
        f"Final version v{version.version_number} assembled from accepted rewrite patches.",
    )

    remaining_issues: list[models.ValidationIssue] = []
    if findings:
        version.validation_status = "needs_review"
        remaining_issues = await _persist_validation_findings(
            db, episode, final_text, findings
        )
    else:
        version.validation_status = "passed"

    await db.commit()
    all_issues = await memory_graph.get_issues_for_episode(db, episode_id)

    return FinalVersionResponse(
        version=EpisodeVersionSchema.model_validate(version),
        original_text=episode.raw_text,
        final_text=final_text,
        issues=await _issues_to_schemas(
            db, all_issues, episode, final_text, ensure_variants=False
        ),
        resolved_count=resolved_count,
        remaining_count=len(remaining_issues),
    )


# ---------------------------------------------------------------------------
# Update episode (for re-validation flow)
# ---------------------------------------------------------------------------


@app.put("/api/v1/episodes/{episode_id}", response_model=EpisodeResponse)
async def update_episode(
    episode_id: int, body: EpisodeCreate, db: AsyncSession = Depends(get_db)
):
    """Update an episode's text (for the edit -> re-validate flow)."""
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")

    episode.raw_text = body.raw_text
    episode.title = body.title
    await db.commit()
    await db.refresh(episode)

    return EpisodeResponse.model_validate(episode)

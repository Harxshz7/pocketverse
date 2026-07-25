"""CRUD operations for the Story Memory Graph.

Provides functions to insert/update/query characters, relationships,
timeline events, world rules, promises, and secrets in the database.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, schemas


# ---------------------------------------------------------------------------
# Characters
# ---------------------------------------------------------------------------


async def get_or_create_character(
    db: AsyncSession,
    name: str,
    episode_id: int,
    traits: list[str] | None = None,
    motivations: list[str] | None = None,
    backstory: str | None = None,
) -> models.Character:
    """Find an existing character by name or create a new one."""
    result = await db.execute(
        select(models.Character).where(models.Character.name == name)
    )
    char = result.scalar_one_or_none()

    if char is None:
        char = models.Character(
            name=name,
            traits=traits or [],
            motivations=motivations or [],
            first_appearance_episode=episode_id,
            backstory=backstory,
        )
        db.add(char)
        await db.flush()
    else:
        # Merge new traits/motivations (append unique)
        if traits:
            existing = set(char.traits or [])
            char.traits = list(existing | set(traits))
        if motivations:
            existing = set(char.motivations or [])
            char.motivations = list(existing | set(motivations))
        if backstory and not char.backstory:
            char.backstory = backstory

    return char


async def get_all_characters(db: AsyncSession) -> list[models.Character]:
    """Return all characters."""
    result = await db.execute(select(models.Character))
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Relationships
# ---------------------------------------------------------------------------


async def add_relationship(
    db: AsyncSession,
    char_a_id: int,
    char_b_id: int,
    rel_type: str,
    description: str,
    episode_id: int,
) -> models.Relationship:
    """Create a new relationship entry."""
    rel = models.Relationship(
        character_a_id=char_a_id,
        character_b_id=char_b_id,
        type=rel_type,
        description=description,
        established_episode=episode_id,
    )
    db.add(rel)
    await db.flush()
    return rel


async def get_all_relationships(db: AsyncSession) -> list[models.Relationship]:
    """Return all relationships."""
    result = await db.execute(select(models.Relationship))
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Timeline Events
# ---------------------------------------------------------------------------


async def add_timeline_event(
    db: AsyncSession,
    episode_id: int,
    event_description: str,
    characters_involved: list[int],
    turning_point_type: str | None,
    sequence_order: int,
) -> models.TimelineEvent:
    """Create a new timeline event."""
    evt = models.TimelineEvent(
        episode_id=episode_id,
        event_description=event_description,
        characters_involved=characters_involved,
        turning_point_type=turning_point_type,
        sequence_order=sequence_order,
    )
    db.add(evt)
    await db.flush()
    return evt


async def get_all_timeline_events(db: AsyncSession) -> list[models.TimelineEvent]:
    """Return all timeline events ordered by sequence."""
    result = await db.execute(
        select(models.TimelineEvent).order_by(models.TimelineEvent.sequence_order)
    )
    return list(result.scalars().all())


async def get_events_between(
    db: AsyncSession, seq_start: int, seq_end: int
) -> list[models.TimelineEvent]:
    """Return timeline events between two sequence positions (exclusive)."""
    result = await db.execute(
        select(models.TimelineEvent)
        .where(
            models.TimelineEvent.sequence_order > seq_start,
            models.TimelineEvent.sequence_order < seq_end,
        )
        .order_by(models.TimelineEvent.sequence_order)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# World Rules
# ---------------------------------------------------------------------------


async def add_world_rule(
    db: AsyncSession,
    rule: str,
    episode_id: int,
    category: str,
) -> models.WorldRule:
    """Create a new world rule."""
    wr = models.WorldRule(
        rule=rule,
        established_episode=episode_id,
        category=category,
    )
    db.add(wr)
    await db.flush()
    return wr


async def get_all_world_rules(db: AsyncSession) -> list[models.WorldRule]:
    """Return all world rules."""
    result = await db.execute(select(models.WorldRule))
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Promises
# ---------------------------------------------------------------------------


async def add_promise(
    db: AsyncSession,
    description: str,
    episode_id: int,
    fulfilled: bool = False,
) -> models.Promise:
    """Create a new promise."""
    p = models.Promise(
        description=description,
        made_episode=episode_id,
        fulfilled=fulfilled,
    )
    db.add(p)
    await db.flush()
    return p


async def get_all_promises(db: AsyncSession) -> list[models.Promise]:
    """Return all promises."""
    result = await db.execute(select(models.Promise))
    return list(result.scalars().all())


async def get_unfulfilled_promises(db: AsyncSession) -> list[models.Promise]:
    """Return all unfulfilled promises."""
    result = await db.execute(
        select(models.Promise).where(models.Promise.fulfilled == False)  # noqa: E712
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Secrets
# ---------------------------------------------------------------------------


async def add_secret(
    db: AsyncSession,
    description: str,
    holder_id: int,
    episode_id: int,
    revealed: bool = False,
) -> models.Secret:
    """Create a new secret."""
    s = models.Secret(
        description=description,
        holder_character_id=holder_id,
        established_episode=episode_id,
        revealed=revealed,
    )
    db.add(s)
    await db.flush()
    return s


async def get_all_secrets(db: AsyncSession) -> list[models.Secret]:
    """Return all secrets."""
    result = await db.execute(select(models.Secret))
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Episodes
# ---------------------------------------------------------------------------


async def get_episode(db: AsyncSession, episode_id: int) -> models.Episode | None:
    """Get a single episode by ID."""
    result = await db.execute(
        select(models.Episode).where(models.Episode.id == episode_id)
    )
    return result.scalar_one_or_none()


async def get_all_episodes(db: AsyncSession) -> list[models.Episode]:
    """Return all episodes ordered by number."""
    result = await db.execute(
        select(models.Episode).order_by(models.Episode.number)
    )
    return list(result.scalars().all())


async def get_episode_by_number(
    db: AsyncSession, episode_number: int
) -> models.Episode | None:
    """Get a single episode by its number."""
    result = await db.execute(
        select(models.Episode).where(models.Episode.number == episode_number)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Validation Issues
# ---------------------------------------------------------------------------


async def add_validation_issue(
    db: AsyncSession,
    issue: models.ValidationIssue,
) -> models.ValidationIssue:
    """Persist a validation issue."""
    db.add(issue)
    await db.flush()
    return issue


async def get_issues_for_episode(
    db: AsyncSession, episode_id: int
) -> list[models.ValidationIssue]:
    """Return all issues for a given episode."""
    result = await db.execute(
        select(models.ValidationIssue).where(
            models.ValidationIssue.episode_id == episode_id
        )
    )
    return list(result.scalars().all())


async def clear_issues_for_episode(db: AsyncSession, episode_id: int) -> None:
    """Delete all issues for a given episode (used before re-validation)."""
    issues = await get_issues_for_episode(db, episode_id)
    for issue in issues:
        await db.delete(issue)
    await db.flush()


# ---------------------------------------------------------------------------
# Full Graph
# ---------------------------------------------------------------------------


async def get_full_story_memory(db: AsyncSession) -> schemas.StoryMemoryGraph:
    """Build the complete story memory graph response."""
    characters = await get_all_characters(db)
    relationships = await get_all_relationships(db)
    timeline = await get_all_timeline_events(db)
    rules = await get_all_world_rules(db)
    promises = await get_all_promises(db)
    secrets = await get_all_secrets(db)

    # Build character name lookup for relationship display
    char_map = {c.id: c.name for c in characters}

    rel_schemas = []
    for r in relationships:
        rel_schemas.append(
            schemas.RelationshipSchema(
                id=r.id,
                character_a_id=r.character_a_id,
                character_b_id=r.character_b_id,
                character_a_name=char_map.get(r.character_a_id, "Unknown"),
                character_b_name=char_map.get(r.character_b_id, "Unknown"),
                type=r.type,
                description=r.description,
                established_episode=r.established_episode,
            )
        )

    return schemas.StoryMemoryGraph(
        characters=[schemas.CharacterSchema.model_validate(c) for c in characters],
        relationships=rel_schemas,
        timeline_events=[
            schemas.TimelineEventSchema.model_validate(e) for e in timeline
        ],
        world_rules=[schemas.WorldRuleSchema.model_validate(r) for r in rules],
        promises=[schemas.PromiseSchema.model_validate(p) for p in promises],
        secrets=[schemas.SecretSchema.model_validate(s) for s in secrets],
    )

"""Pydantic v2 schemas for API request/response serialization.

These mirror the ORM models but are decoupled — API consumers see
these shapes, not raw DB rows.
"""

from __future__ import annotations

import enum
from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums (shared with models.py, but Pydantic-native)
# ---------------------------------------------------------------------------


class TurningPointType(str, enum.Enum):
    """Taxonomy of story turning-point events."""

    BETRAYAL = "BETRAYAL"
    DEATH = "DEATH"
    REDEMPTION = "REDEMPTION"
    TRAUMA = "TRAUMA"
    REVELATION = "REVELATION"
    POWER_GAIN = "POWER_GAIN"
    POWER_LOSS = "POWER_LOSS"
    MOTIVATION_SHIFT = "MOTIVATION_SHIFT"
    FEAR_OVERCOME = "FEAR_OVERCOME"
    ALLIANCE_FORMED = "ALLIANCE_FORMED"
    ALLIANCE_BROKEN = "ALLIANCE_BROKEN"
    SECRET_REVEALED = "SECRET_REVEALED"
    PROMISE_MADE = "PROMISE_MADE"
    PROMISE_BROKEN = "PROMISE_BROKEN"


class IssueCategory(str, enum.Enum):
    """Categories of validation issues."""

    CHARACTER_CONTRADICTION = "CHARACTER_CONTRADICTION"
    TIMELINE_BREAK = "TIMELINE_BREAK"
    BROKEN_PROMISE = "BROKEN_PROMISE"
    WORLD_RULE_VIOLATION = "WORLD_RULE_VIOLATION"
    RELATIONSHIP_INCONSISTENCY = "RELATIONSHIP_INCONSISTENCY"


class IssueStatus(str, enum.Enum):
    """Severity / confidence level of a validation issue."""

    STRONG = "strong"
    NEEDS_REVIEW = "needs_review"
    CRITICAL = "critical"


# ---------------------------------------------------------------------------
# Episode schemas
# ---------------------------------------------------------------------------


class EpisodeCreate(BaseModel):
    """Request body for creating an episode."""

    number: int = Field(..., ge=1, description="Episode number (1-indexed)")
    title: str = Field(..., min_length=1, max_length=500)
    raw_text: str = Field(..., min_length=1, description="Full episode text")


class EpisodeResponse(BaseModel):
    """Episode returned from the API."""

    id: int
    number: int
    title: str
    raw_text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EpisodeListItem(BaseModel):
    """Compact episode representation for list views."""

    id: int
    number: int
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Story Memory Graph schemas
# ---------------------------------------------------------------------------


class CharacterSchema(BaseModel):
    """A character in the story memory graph."""

    id: int
    name: str
    traits: list[str] = []
    motivations: list[str] = []
    first_appearance_episode: int
    backstory: str | None = None

    model_config = {"from_attributes": True}


class RelationshipSchema(BaseModel):
    """A relationship between two characters."""

    id: int
    character_a_id: int
    character_b_id: int
    character_a_name: str = ""
    character_b_name: str = ""
    type: str
    description: str
    established_episode: int

    model_config = {"from_attributes": True}


class TimelineEventSchema(BaseModel):
    """A story event anchored in the timeline."""

    id: int
    episode_id: int
    event_description: str
    characters_involved: list[int] = []
    turning_point_type: str | None = None
    sequence_order: int

    model_config = {"from_attributes": True}


class WorldRuleSchema(BaseModel):
    """A world-building rule."""

    id: int
    rule: str
    established_episode: int
    category: str

    model_config = {"from_attributes": True}


class PromiseSchema(BaseModel):
    """A narrative promise."""

    id: int
    description: str
    made_episode: int
    fulfilled: bool
    fulfilled_episode: int | None = None

    model_config = {"from_attributes": True}


class SecretSchema(BaseModel):
    """A secret held by a character."""

    id: int
    description: str
    holder_character_id: int
    established_episode: int
    revealed: bool
    revealed_episode: int | None = None

    model_config = {"from_attributes": True}


class StoryMemoryGraph(BaseModel):
    """Complete structured story memory returned by GET /story-memory."""

    characters: list[CharacterSchema] = []
    relationships: list[RelationshipSchema] = []
    timeline_events: list[TimelineEventSchema] = []
    world_rules: list[WorldRuleSchema] = []
    promises: list[PromiseSchema] = []
    secrets: list[SecretSchema] = []


# ---------------------------------------------------------------------------
# Evidence & Issue schemas (the core contract)
# ---------------------------------------------------------------------------


class EvidenceItem(BaseModel):
    """A piece of evidence supporting a validation finding."""

    episode_number: int
    episode_title: str
    excerpt: str = Field(..., description="Exact quoted passage")
    relevance: str = Field(..., description="Why this passage matters")


class ValidationIssueSchema(BaseModel):
    """A flagged continuity issue — the core API response shape."""

    id: str
    episode_id: int
    category: IssueCategory
    status: IssueStatus
    problem: str
    evidence: list[EvidenceItem] = []
    reasoning: str
    impact: str
    suggested_fixes: list[str] = []
    resolved: bool = False
    resolved_evidence: str | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Extraction schemas (structured output shapes for the LLM)
# ---------------------------------------------------------------------------


class ExtractedCharacter(BaseModel):
    """Character data extracted from a single episode."""

    name: str
    traits: list[str] = []
    motivations: list[str] = []
    backstory: str | None = None
    is_new: bool = Field(
        ..., description="True if this character hasn't appeared before"
    )


class ExtractedRelationship(BaseModel):
    """Relationship data extracted from a single episode."""

    character_a_name: str
    character_b_name: str
    type: str
    description: str


class ExtractedTimelineEvent(BaseModel):
    """A timeline event extracted from a single episode."""

    event_description: str
    characters_involved: list[str] = []
    turning_point_type: TurningPointType | None = None
    sequence_order: int


class ExtractedWorldRule(BaseModel):
    """A world rule extracted from a single episode."""

    rule: str
    category: str


class ExtractedPromise(BaseModel):
    """A promise extracted from a single episode."""

    description: str
    fulfilled: bool = False


class ExtractedSecret(BaseModel):
    """A secret extracted from a single episode."""

    description: str
    holder_name: str
    revealed: bool = False


class ExtractionResult(BaseModel):
    """Complete extraction output from a single episode."""

    characters: list[ExtractedCharacter] = []
    relationships: list[ExtractedRelationship] = []
    timeline_events: list[ExtractedTimelineEvent] = []
    world_rules: list[ExtractedWorldRule] = []
    promises: list[ExtractedPromise] = []
    secrets: list[ExtractedSecret] = []


# ---------------------------------------------------------------------------
# Validation finding (internal, before LLM explanation)
# ---------------------------------------------------------------------------


class ValidationFinding(BaseModel):
    """A raw finding from the deterministic validation engine.

    This is the input to the LLM explanation layer — it contains the
    structured evidence but not yet the human-readable explanation.
    """

    category: IssueCategory
    status: IssueStatus
    summary: str = Field(..., description="Brief machine-readable summary")
    evidence: list[EvidenceItem] = []
    details: dict = Field(
        default_factory=dict,
        description="Additional structured data for the explanation layer",
    )


# ---------------------------------------------------------------------------
# Explanation output (LLM-generated)
# ---------------------------------------------------------------------------


class ExplanationOutput(BaseModel):
    """Structured output from the LLM explanation layer."""

    problem: str = Field(..., description="Human-readable problem description")
    reasoning: str = Field(
        ..., description="Step-by-step reasoning why this is an issue"
    )
    impact: str = Field(
        ..., description="What breaks if this is not corrected"
    )
    suggested_fixes: list[str] = Field(
        default_factory=list,
        description="Actionable fix suggestions for the creator",
    )

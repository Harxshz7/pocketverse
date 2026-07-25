"""SQLAlchemy ORM models for the Story Memory Graph.

Each entity has real foreign keys and relationships so the validation engine
can query cleanly — no giant JSON blobs.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

import enum


# ---------------------------------------------------------------------------
# Enums
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
# ORM Models
# ---------------------------------------------------------------------------


class Episode(Base):
    """A single episode of the serialized story."""

    __tablename__ = "episodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    number: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        back_populates="episode", cascade="all, delete-orphan"
    )
    issues: Mapped[list["ValidationIssue"]] = relationship(
        back_populates="episode", cascade="all, delete-orphan"
    )


class Character(Base):
    """A character extracted from the story."""

    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(300), unique=True, nullable=False)
    traits: Mapped[list] = mapped_column(JSON, default=list)
    motivations: Mapped[list] = mapped_column(JSON, default=list)
    first_appearance_episode: Mapped[int] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=False
    )
    backstory: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    relationships_as_a: Mapped[list["Relationship"]] = relationship(
        foreign_keys="Relationship.character_a_id", back_populates="character_a"
    )
    relationships_as_b: Mapped[list["Relationship"]] = relationship(
        foreign_keys="Relationship.character_b_id", back_populates="character_b"
    )
    secrets_held: Mapped[list["Secret"]] = relationship(back_populates="holder")


class Relationship(Base):
    """A relationship between two characters."""

    __tablename__ = "relationships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    character_a_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("characters.id"), nullable=False
    )
    character_b_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("characters.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    established_episode: Mapped[int] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=False
    )

    # Relationships
    character_a: Mapped["Character"] = relationship(
        foreign_keys=[character_a_id], back_populates="relationships_as_a"
    )
    character_b: Mapped["Character"] = relationship(
        foreign_keys=[character_b_id], back_populates="relationships_as_b"
    )


class TimelineEvent(Base):
    """A story event anchored in the timeline."""

    __tablename__ = "timeline_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    episode_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=False
    )
    event_description: Mapped[str] = mapped_column(Text, nullable=False)
    characters_involved: Mapped[list] = mapped_column(JSON, default=list)
    turning_point_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    episode: Mapped["Episode"] = relationship(back_populates="timeline_events")


class WorldRule(Base):
    """A rule governing how the story world works."""

    __tablename__ = "world_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rule: Mapped[str] = mapped_column(Text, nullable=False)
    established_episode: Mapped[int] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)


class Promise(Base):
    """A narrative promise / setup that expects payoff."""

    __tablename__ = "promises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    made_episode: Mapped[int] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=False
    )
    fulfilled: Mapped[bool] = mapped_column(Boolean, default=False)
    fulfilled_episode: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=True
    )


class Secret(Base):
    """A secret held by a character."""

    __tablename__ = "secrets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    holder_character_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("characters.id"), nullable=False
    )
    established_episode: Mapped[int] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=False
    )
    revealed: Mapped[bool] = mapped_column(Boolean, default=False)
    revealed_episode: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=True
    )

    # Relationships
    holder: Mapped["Character"] = relationship(back_populates="secrets_held")


class ValidationIssue(Base):
    """A flagged continuity issue found by the validation engine."""

    __tablename__ = "validation_issues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    episode_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("episodes.id"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    problem: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    impact: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_fixes: Mapped[list] = mapped_column(JSON, default=list)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_evidence: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    episode: Mapped["Episode"] = relationship(back_populates="issues")

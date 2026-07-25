"""Production SQLAlchemy models for StoryGuard.

The schema is intentionally richer than the current prototype API. It is the
target persistence contract for the phased migration to PostgreSQL + pgvector.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import (
    AIJobStatus,
    AIJobType,
    AgentRole,
    ContentStatus,
    EmbeddingSourceType,
    EntityLifecycleStatus,
    GraphEdgeType,
    GraphNodeType,
    PlotHoleSeverity,
    PlotHoleType,
    RelationshipStatus,
    RelationshipType,
    ReviewStatus,
    RewriteGenre,
    RuleStatus,
    StoryRuleType,
    StoryStatus,
    SuggestionStatus,
    TimelineEventType,
    UserRole,
    UserStatus,
)
from app.infrastructure.persistence.base import (
    Base,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)
from app.infrastructure.persistence.vector import Vector


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Creator account."""

    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_role_status", "role", "status"),
        Index("ix_users_deleted_at", "deleted_at"),
    )

    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.CREATOR,
    )
    status: Mapped[UserStatus] = mapped_column(
        SAEnum(UserStatus, name="user_status"),
        nullable=False,
        default=UserStatus.PENDING_VERIFICATION,
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    stories: Mapped[list["Story"]] = relationship(back_populates="owner")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class RefreshToken(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Rotatable refresh token session."""

    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_refresh_tokens_user_revoked", "user_id", "revoked_at"),
        Index("ix_refresh_tokens_expires_at", "expires_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    family_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class Story(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Top-level story universe."""

    __tablename__ = "stories"
    __table_args__ = (
        UniqueConstraint("owner_id", "slug", name="uq_stories_owner_slug"),
        Index("ix_stories_owner_status", "owner_id", "status", "deleted_at"),
        Index("ix_stories_genre_language", "genre", "language_code"),
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(340), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    genre: Mapped[str | None] = mapped_column(String(80), nullable=True)
    language_code: Mapped[str] = mapped_column(String(16), nullable=False, default="en")
    status: Mapped[StoryStatus] = mapped_column(
        SAEnum(StoryStatus, name="story_status"),
        nullable=False,
        default=StoryStatus.DRAFT,
    )
    visibility: Mapped[str] = mapped_column(String(40), nullable=False, default="private")
    content_rating: Mapped[str | None] = mapped_column(String(40), nullable=True)
    story_metadata: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)

    owner: Mapped["User"] = relationship(back_populates="stories")
    episodes: Mapped[list["Episode"]] = relationship(
        back_populates="story",
        cascade="all, delete-orphan",
    )
    characters: Mapped[list["Character"]] = relationship(back_populates="story")
    locations: Mapped[list["Location"]] = relationship(back_populates="story")
    objects: Mapped[list["StoryObject"]] = relationship(back_populates="story")


class Episode(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Ordered episode within a story."""

    __tablename__ = "episodes"
    __table_args__ = (
        UniqueConstraint(
            "story_id",
            "season_number",
            "episode_number",
            name="uq_episodes_story_season_number",
        ),
        Index("ix_episodes_story_status", "story_id", "status", "deleted_at"),
        Index("ix_episodes_story_order", "story_id", "season_number", "episode_number"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    season_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ContentStatus] = mapped_column(
        SAEnum(ContentStatus, name="content_status"),
        nullable=False,
        default=ContentStatus.UPLOADED,
    )
    upload_source: Mapped[str | None] = mapped_column(String(80), nullable=True)
    raw_storage_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    word_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    processing_state: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    story: Mapped["Story"] = relationship(back_populates="episodes")
    scenes: Mapped[list["Scene"]] = relationship(
        back_populates="episode",
        cascade="all, delete-orphan",
    )
    paragraphs: Mapped[list["Paragraph"]] = relationship(
        back_populates="episode",
        cascade="all, delete-orphan",
    )


class Scene(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Scene slice inside an episode."""

    __tablename__ = "scenes"
    __table_args__ = (
        UniqueConstraint("episode_id", "scene_number", name="uq_scenes_episode_number"),
        Index("ix_scenes_story_episode", "story_id", "episode_id", "scene_number"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    scene_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_char: Mapped[int] = mapped_column(Integer, nullable=False)
    end_char: Mapped[int] = mapped_column(Integer, nullable=False)
    location_hint: Mapped[str | None] = mapped_column(String(300), nullable=True)
    emotional_arc: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    episode: Mapped["Episode"] = relationship(back_populates="scenes")
    paragraphs: Mapped[list["Paragraph"]] = relationship(
        back_populates="scene",
        cascade="all, delete-orphan",
    )


class Paragraph(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Stable paragraph unit used for evidence and embedding references."""

    __tablename__ = "paragraphs"
    __table_args__ = (
        UniqueConstraint("episode_id", "paragraph_number", name="uq_paragraphs_episode_number"),
        UniqueConstraint("story_id", "content_hash", name="uq_paragraphs_story_content_hash"),
        Index("ix_paragraphs_story_episode", "story_id", "episode_id", "paragraph_number"),
        Index("ix_paragraphs_scene_number", "scene_id", "paragraph_number"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    scene_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("scenes.id", ondelete="SET NULL"),
        nullable=True,
    )
    paragraph_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_content: Mapped[str] = mapped_column(Text, nullable=False)
    start_char: Mapped[int] = mapped_column(Integer, nullable=False)
    end_char: Mapped[int] = mapped_column(Integer, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(96), nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    episode: Mapped["Episode"] = relationship(back_populates="paragraphs")
    scene: Mapped["Scene | None"] = relationship(back_populates="paragraphs")


class Character(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Canonical character memory."""

    __tablename__ = "characters"
    __table_args__ = (
        UniqueConstraint("story_id", "normalized_name", name="uq_characters_story_name"),
        Index("ix_characters_story_status", "story_id", "lifecycle_status", "deleted_at"),
        Index("ix_characters_first_episode", "first_episode_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    canonical_name: Mapped[str] = mapped_column(String(300), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(320), nullable=False)
    aliases: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    biography: Mapped[str | None] = mapped_column(Text, nullable=True)
    age_text: Mapped[str | None] = mapped_column(String(120), nullable=True)
    lifecycle_status: Mapped[EntityLifecycleStatus] = mapped_column(
        SAEnum(EntityLifecycleStatus, name="entity_lifecycle_status"),
        nullable=False,
        default=EntityLifecycleStatus.UNKNOWN,
    )
    first_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    last_seen_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    traits: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    motivations: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    goals: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    powers: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    secrets: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    emotional_baseline: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))

    story: Mapped["Story"] = relationship(back_populates="characters")
    relationships_from: Mapped[list["Relationship"]] = relationship(
        back_populates="source_character",
        foreign_keys="Relationship.source_character_id",
    )
    relationships_to: Mapped[list["Relationship"]] = relationship(
        back_populates="target_character",
        foreign_keys="Relationship.target_character_id",
    )


class Location(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Canonical story location."""

    __tablename__ = "locations"
    __table_args__ = (
        UniqueConstraint("story_id", "normalized_name", name="uq_locations_story_name"),
        Index("ix_locations_story_type", "story_id", "location_type", "deleted_at"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    canonical_name: Mapped[str] = mapped_column(String(300), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(320), nullable=False)
    aliases: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    location_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_location_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    rules: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    first_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))

    story: Mapped["Story"] = relationship(back_populates="locations")
    parent_location: Mapped["Location | None"] = relationship(remote_side="Location.id")


class StoryObject(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Canonical object, artifact, weapon, document, or resource."""

    __tablename__ = "objects"
    __table_args__ = (
        UniqueConstraint("story_id", "normalized_name", name="uq_objects_story_name"),
        Index("ix_objects_story_type", "story_id", "object_type", "deleted_at"),
        Index("ix_objects_owner", "owner_character_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    canonical_name: Mapped[str] = mapped_column(String(300), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(320), nullable=False)
    aliases: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    object_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_character_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("characters.id", ondelete="SET NULL"),
        nullable=True,
    )
    current_location_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    properties: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    first_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))

    story: Mapped["Story"] = relationship(back_populates="objects")
    owner_character: Mapped["Character | None"] = relationship()
    current_location: Mapped["Location | None"] = relationship()


class Relationship(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Directed character relationship state."""

    __tablename__ = "relationships"
    __table_args__ = (
        Index("ix_relationships_story_source_type", "story_id", "source_character_id", "relationship_type"),
        Index("ix_relationships_story_target_type", "story_id", "target_character_id", "relationship_type"),
        Index("ix_relationships_status", "story_id", "status", "deleted_at"),
        CheckConstraint("source_character_id <> target_character_id", name="relationship_not_self"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_character_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("characters.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_character_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("characters.id", ondelete="CASCADE"),
        nullable=False,
    )
    relationship_type: Mapped[RelationshipType] = mapped_column(
        SAEnum(RelationshipType, name="relationship_type"),
        nullable=False,
    )
    status: Mapped[RelationshipStatus] = mapped_column(
        SAEnum(RelationshipStatus, name="relationship_status"),
        nullable=False,
        default=RelationshipStatus.ACTIVE,
    )
    polarity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    intensity: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    first_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    last_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )

    source_character: Mapped["Character"] = relationship(
        back_populates="relationships_from",
        foreign_keys=[source_character_id],
    )
    target_character: Mapped["Character"] = relationship(
        back_populates="relationships_to",
        foreign_keys=[target_character_id],
    )


class TimelineEvent(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Ordered causal story event."""

    __tablename__ = "timeline_events"
    __table_args__ = (
        UniqueConstraint("story_id", "canonical_order", name="uq_timeline_events_story_order"),
        UniqueConstraint("episode_id", "local_order", name="uq_timeline_events_episode_order"),
        Index("ix_timeline_events_story_type", "story_id", "event_type", "deleted_at"),
        Index("ix_timeline_events_episode_scene", "episode_id", "scene_id", "local_order"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    scene_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("scenes.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_type: Mapped[TimelineEventType] = mapped_column(
        SAEnum(TimelineEventType, name="timeline_event_type"),
        nullable=False,
        default=TimelineEventType.OTHER,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    canonical_order: Mapped[int] = mapped_column(Integer, nullable=False)
    local_order: Mapped[int] = mapped_column(Integer, nullable=False)
    occurred_at_text: Mapped[str | None] = mapped_column(String(160), nullable=True)
    causality_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    emotional_impact: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    involved_character_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    involved_location_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    involved_object_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))


class StoryRule(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """World, character, or narrative rule."""

    __tablename__ = "story_rules"
    __table_args__ = (
        Index("ix_story_rules_story_type_status", "story_id", "rule_type", "status", "deleted_at"),
        Index("ix_story_rules_established_episode", "established_episode_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    rule_type: Mapped[StoryRuleType] = mapped_column(
        SAEnum(StoryRuleType, name="story_rule_type"),
        nullable=False,
        default=StoryRuleType.OTHER,
    )
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    scope: Mapped[str | None] = mapped_column(String(160), nullable=True)
    status: Mapped[RuleStatus] = mapped_column(
        SAEnum(RuleStatus, name="rule_status"),
        nullable=False,
        default=RuleStatus.ACTIVE,
    )
    established_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    contradicted_by_event_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("timeline_events.id", ondelete="SET NULL"),
        nullable=True,
    )
    evidence: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))


class Embedding(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Vector row for semantic retrieval."""

    __tablename__ = "embeddings"
    __table_args__ = (
        UniqueConstraint(
            "story_id",
            "source_type",
            "source_id",
            "model",
            "content_hash",
            name="uq_embeddings_source_model_hash",
        ),
        Index("ix_embeddings_story_source", "story_id", "source_type", "source_id"),
        Index("ix_embeddings_content_hash", "content_hash"),
        Index(
            "ix_embeddings_vector_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_type: Mapped[EmbeddingSourceType] = mapped_column(
        SAEnum(EmbeddingSourceType, name="embedding_source_type"),
        nullable=False,
    )
    source_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(96), nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=False)
    model: Mapped[str] = mapped_column(String(120), nullable=False)
    dimensions: Mapped[int] = mapped_column(Integer, nullable=False, default=1536)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    source_text_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_metadata: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)


class GraphNode(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Canonical graph node."""

    __tablename__ = "graph_nodes"
    __table_args__ = (
        UniqueConstraint("story_id", "node_type", "canonical_id", name="uq_graph_nodes_canonical"),
        Index("ix_graph_nodes_story_type", "story_id", "node_type", "deleted_at"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    node_type: Mapped[GraphNodeType] = mapped_column(
        SAEnum(GraphNodeType, name="graph_node_type"),
        nullable=False,
    )
    canonical_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    label: Mapped[str] = mapped_column(String(300), nullable=False)
    properties: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))

    outgoing_edges: Mapped[list["GraphEdge"]] = relationship(
        back_populates="source_node",
        foreign_keys="GraphEdge.source_node_id",
        cascade="all, delete-orphan",
    )
    incoming_edges: Mapped[list["GraphEdge"]] = relationship(
        back_populates="target_node",
        foreign_keys="GraphEdge.target_node_id",
        cascade="all, delete-orphan",
    )


class GraphEdge(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Incremental graph edge."""

    __tablename__ = "graph_edges"
    __table_args__ = (
        Index("ix_graph_edges_story_source_type", "story_id", "source_node_id", "edge_type", "deleted_at"),
        Index("ix_graph_edges_story_target_type", "story_id", "target_node_id", "edge_type", "deleted_at"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_node_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("graph_nodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_node_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("graph_nodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    edge_type: Mapped[GraphEdgeType] = mapped_column(
        SAEnum(GraphEdgeType, name="graph_edge_type"),
        nullable=False,
    )
    weight: Mapped[Decimal] = mapped_column(Numeric(6, 5), nullable=False, default=Decimal("1.00000"))
    properties: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    evidence: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    first_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    last_episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )

    source_node: Mapped["GraphNode"] = relationship(
        back_populates="outgoing_edges",
        foreign_keys=[source_node_id],
    )
    target_node: Mapped["GraphNode"] = relationship(
        back_populates="incoming_edges",
        foreign_keys=[target_node_id],
    )


class AIJob(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Durable async AI or processing job."""

    __tablename__ = "ai_jobs"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_ai_jobs_idempotency_key"),
        Index("ix_ai_jobs_status_schedule", "status", "scheduled_at"),
        Index("ix_ai_jobs_story_type_status", "story_id", "job_type", "status"),
        Index("ix_ai_jobs_user_status", "requested_by_user_id", "status"),
    )

    requested_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    story_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=True,
    )
    job_type: Mapped[AIJobType] = mapped_column(
        SAEnum(AIJobType, name="ai_job_type"),
        nullable=False,
    )
    status: Mapped[AIJobStatus] = mapped_column(
        SAEnum(AIJobStatus, name="ai_job_status"),
        nullable=False,
        default=AIJobStatus.QUEUED,
    )
    idempotency_key: Mapped[str] = mapped_column(String(180), nullable=False)
    queue_name: Mapped[str] = mapped_column(String(80), nullable=False, default="default")
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    schema_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    input_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    output_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    token_usage: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Agent(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Writers-room agent definition."""

    __tablename__ = "agents"
    __table_args__ = (
        UniqueConstraint("story_id", "role", "name", name="uq_agents_story_role_name"),
        Index("ix_agents_story_enabled", "story_id", "enabled", "deleted_at"),
    )

    story_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    role: Mapped[AgentRole] = mapped_column(SAEnum(AgentRole, name="agent_role"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(120), nullable=False)
    temperature: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False, default=Decimal("0.20"))
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Review(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Review session for AI or human analysis."""

    __tablename__ = "reviews"
    __table_args__ = (
        Index("ix_reviews_story_status", "story_id", "status", "deleted_at"),
        Index("ix_reviews_requested_by", "requested_by_user_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    requested_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by_agent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_type: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[ReviewStatus] = mapped_column(
        SAEnum(ReviewStatus, name="review_status"),
        nullable=False,
        default=ReviewStatus.OPEN,
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    result: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class PlotHole(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Continuity issue with evidence and severity."""

    __tablename__ = "plot_holes"
    __table_args__ = (
        Index("ix_plot_holes_story_severity_status", "story_id", "severity", "status", "deleted_at"),
        Index("ix_plot_holes_episode_type", "episode_id", "issue_type"),
        Index("ix_plot_holes_review", "review_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("reviews.id", ondelete="SET NULL"),
        nullable=True,
    )
    detected_by_job_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("ai_jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    issue_type: Mapped[PlotHoleType] = mapped_column(
        SAEnum(PlotHoleType, name="plot_hole_type"),
        nullable=False,
    )
    severity: Mapped[PlotHoleSeverity] = mapped_column(
        SAEnum(PlotHoleSeverity, name="plot_hole_severity"),
        nullable=False,
    )
    status: Mapped[ReviewStatus] = mapped_column(
        SAEnum(ReviewStatus, name="plot_hole_status"),
        nullable=False,
        default=ReviewStatus.OPEN,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    affected_entities: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))


class Suggestion(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Fix, recommendation, or rewrite suggestion."""

    __tablename__ = "suggestions"
    __table_args__ = (
        Index("ix_suggestions_story_status", "story_id", "status", "deleted_at"),
        Index("ix_suggestions_plot_hole", "plot_hole_id"),
        Index("ix_suggestions_review", "review_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    plot_hole_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("plot_holes.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("reviews.id", ondelete="SET NULL"),
        nullable=True,
    )
    suggestion_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    patch_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[SuggestionStatus] = mapped_column(
        SAEnum(SuggestionStatus, name="suggestion_status"),
        nullable=False,
        default=SuggestionStatus.PROPOSED,
    )
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0.0000"))


class Version(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Immutable version of a story resource."""

    __tablename__ = "versions"
    __table_args__ = (
        UniqueConstraint(
            "versioned_type",
            "versioned_id",
            "version_number",
            name="uq_versions_resource_number",
        ),
        Index("ix_versions_story_episode", "story_id", "episode_id"),
        Index("ix_versions_resource", "versioned_type", "versioned_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    scene_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("scenes.id", ondelete="SET NULL"),
        nullable=True,
    )
    paragraph_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("paragraphs.id", ondelete="SET NULL"),
        nullable=True,
    )
    versioned_type: Mapped[str] = mapped_column(String(80), nullable=False)
    versioned_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(96), nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by_job_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("ai_jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class Rewrite(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Rewrite request and result."""

    __tablename__ = "rewrites"
    __table_args__ = (
        Index("ix_rewrites_story_status", "story_id", "status", "deleted_at"),
        Index("ix_rewrites_episode_genre", "episode_id", "target_genre"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    requested_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_version_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    accepted_version_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_genre: Mapped[RewriteGenre] = mapped_column(
        SAEnum(RewriteGenre, name="rewrite_genre"),
        nullable=False,
    )
    status: Mapped[AIJobStatus] = mapped_column(
        SAEnum(AIJobStatus, name="rewrite_status"),
        nullable=False,
        default=AIJobStatus.QUEUED,
    )
    constraints: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    input_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    validation_report: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class Feedback(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Creator feedback on AI output."""

    __tablename__ = "feedback"
    __table_args__ = (
        Index("ix_feedback_story_target", "story_id", "target_type", "target_id"),
        Index("ix_feedback_user", "user_id"),
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="feedback_rating_range"),
    )

    story_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_type: Mapped[str] = mapped_column(String(80), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    labels: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)


class AuditLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Immutable audit event."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_actor_created", "actor_user_id", "created_at"),
        Index("ix_audit_logs_story_created", "story_id", "created_at"),
        Index("ix_audit_logs_resource", "resource_type", "resource_id"),
        Index("ix_audit_logs_request_id", "request_id"),
    )

    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    story_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stories.id", ondelete="SET NULL"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(80), nullable=False)
    resource_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    before_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)


__all__ = [
    "AIJob",
    "Agent",
    "AuditLog",
    "Character",
    "Embedding",
    "Episode",
    "Feedback",
    "GraphEdge",
    "GraphNode",
    "Location",
    "Paragraph",
    "PlotHole",
    "RefreshToken",
    "Relationship",
    "Review",
    "Rewrite",
    "Scene",
    "Story",
    "StoryObject",
    "StoryRule",
    "Suggestion",
    "TimelineEvent",
    "User",
    "Version",
]


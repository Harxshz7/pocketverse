"""Shared domain enumerations for StoryGuard."""

from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    CREATOR = "creator"
    EDITOR = "editor"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    PENDING_VERIFICATION = "pending_verification"


class StoryStatus(str, enum.Enum):
    DRAFT = "draft"
    INGESTING = "ingesting"
    READY = "ready"
    ARCHIVED = "archived"


class ContentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    ARCHIVED = "archived"


class EntityLifecycleStatus(str, enum.Enum):
    ACTIVE = "active"
    DEAD = "dead"
    MISSING = "missing"
    UNKNOWN = "unknown"


class RelationshipType(str, enum.Enum):
    KNOWS = "KNOWS"
    LOVES = "LOVES"
    HATES = "HATES"
    PROMISED = "PROMISED"
    BETRAYED = "BETRAYED"
    KILLED = "KILLED"
    VISITED = "VISITED"
    OWNS = "OWNS"
    MENTORED = "MENTORED"
    HELPED = "HELPED"
    SAVED = "SAVED"
    FAMILY = "FAMILY"
    RIVAL = "RIVAL"
    ALLY = "ALLY"
    ENEMY = "ENEMY"


class RelationshipStatus(str, enum.Enum):
    ACTIVE = "active"
    BROKEN = "broken"
    HIDDEN = "hidden"
    RESOLVED = "resolved"
    UNKNOWN = "unknown"


class TimelineEventType(str, enum.Enum):
    APPEARANCE = "appearance"
    PROMISE_MADE = "promise_made"
    PROMISE_BROKEN = "promise_broken"
    PROMISE_FULFILLED = "promise_fulfilled"
    BETRAYAL = "betrayal"
    DEATH = "death"
    REVELATION = "revelation"
    POWER_GAIN = "power_gain"
    POWER_LOSS = "power_loss"
    LOCATION_CHANGE = "location_change"
    OBJECT_TRANSFER = "object_transfer"
    RULE_ESTABLISHED = "rule_established"
    RULE_VIOLATED = "rule_violated"
    EMOTIONAL_SHIFT = "emotional_shift"
    GOAL_CHANGE = "goal_change"
    CONFLICT = "conflict"
    OTHER = "other"


class StoryRuleType(str, enum.Enum):
    MAGIC = "magic"
    POWER = "power"
    SOCIAL = "social"
    POLITICAL = "political"
    PHYSICAL = "physical"
    TEMPORAL = "temporal"
    NARRATIVE = "narrative"
    CHARACTER = "character"
    OTHER = "other"


class RuleStatus(str, enum.Enum):
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    CONTRADICTED = "contradicted"


class EmbeddingSourceType(str, enum.Enum):
    STORY = "story"
    EPISODE = "episode"
    SCENE = "scene"
    PARAGRAPH = "paragraph"
    CHARACTER = "character"
    LOCATION = "location"
    OBJECT = "object"
    TIMELINE_EVENT = "timeline_event"
    STORY_RULE = "story_rule"
    SUMMARY = "summary"


class GraphNodeType(str, enum.Enum):
    CHARACTER = "character"
    LOCATION = "location"
    OBJECT = "object"
    EPISODE = "episode"
    EVENT = "event"
    RULE = "rule"
    EMOTION = "emotion"


class GraphEdgeType(str, enum.Enum):
    KNOWS = "KNOWS"
    LOVES = "LOVES"
    HATES = "HATES"
    PROMISED = "PROMISED"
    BETRAYED = "BETRAYED"
    KILLED = "KILLED"
    VISITED = "VISITED"
    OWNS = "OWNS"
    MENTORED = "MENTORED"
    HELPED = "HELPED"
    SAVED = "SAVED"
    APPEARS_IN = "APPEARS_IN"
    CAUSED = "CAUSED"
    VIOLATES = "VIOLATES"
    ESTABLISHES = "ESTABLISHES"


class AIJobType(str, enum.Enum):
    TEXT_EXTRACTION = "text_extraction"
    NORMALIZATION = "normalization"
    CHUNKING = "chunking"
    EPISODE_DETECTION = "episode_detection"
    SCENE_DETECTION = "scene_detection"
    PARAGRAPH_DETECTION = "paragraph_detection"
    EMBEDDING_GENERATION = "embedding_generation"
    STORY_EXTRACTION = "story_extraction"
    GRAPH_UPDATE = "graph_update"
    MEMORY_UPDATE = "memory_update"
    PLOT_HOLE_DETECTION = "plot_hole_detection"
    WRITERS_ROOM = "writers_room"
    REWRITE = "rewrite"


class AIJobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentRole(str, enum.Enum):
    DIRECTOR = "director"
    EDITOR = "editor"
    HISTORIAN = "historian"
    PSYCHOLOGIST = "psychologist"
    AUDIENCE = "audience"
    CRITIC = "critic"
    DIALOGUE_EXPERT = "dialogue_expert"
    WORLD_BUILDER = "world_builder"
    CLIFFHANGER_EXPERT = "cliffhanger_expert"
    NARRATIVE_DESIGNER = "narrative_designer"


class ReviewStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISMISSED = "dismissed"


class PlotHoleSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PlotHoleType(str, enum.Enum):
    CHARACTER_INCONSISTENCY = "character_inconsistency"
    TIMELINE_INCONSISTENCY = "timeline_inconsistency"
    AGE_MISMATCH = "age_mismatch"
    RELATIONSHIP_MISMATCH = "relationship_mismatch"
    LOCATION_MISMATCH = "location_mismatch"
    RULE_VIOLATION = "rule_violation"
    POWER_INCONSISTENCY = "power_inconsistency"
    OBJECT_INCONSISTENCY = "object_inconsistency"
    FORGOTTEN_PROMISE = "forgotten_promise"
    DUPLICATE_EVENT = "duplicate_event"
    IMPOSSIBLE_SEQUENCE = "impossible_sequence"
    MISSING_MOTIVATION = "missing_motivation"
    DEAD_CHARACTER_RETURNED = "dead_character_returned"


class SuggestionStatus(str, enum.Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    APPLIED = "applied"


class RewriteGenre(str, enum.Enum):
    THRILLER = "thriller"
    ROMANCE = "romance"
    COMEDY = "comedy"
    ANIME = "anime"
    DARK_FANTASY = "dark_fantasy"
    SCI_FI = "sci_fi"
    MYSTERY = "mystery"


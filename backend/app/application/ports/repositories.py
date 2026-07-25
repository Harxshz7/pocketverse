"""Repository protocols used by application services."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Protocol, TypeVar

StoryT = TypeVar("StoryT")
EpisodeT = TypeVar("EpisodeT")
AIJobT = TypeVar("AIJobT")


class StoryRepository(Protocol[StoryT]):
    """Persistence contract for stories."""

    async def add(self, story: StoryT) -> StoryT:
        """Persist a new story aggregate."""

    async def get(self, story_id: uuid.UUID) -> StoryT | None:
        """Return a story by ID."""

    async def get_by_owner_slug(
        self,
        owner_id: uuid.UUID,
        slug: str,
    ) -> StoryT | None:
        """Return a story by owner and slug."""

    async def list_for_owner(
        self,
        owner_id: uuid.UUID,
        limit: int,
        offset: int,
    ) -> Sequence[StoryT]:
        """Return paginated stories for an owner."""


class EpisodeRepository(Protocol[EpisodeT]):
    """Persistence contract for episodes."""

    async def add(self, episode: EpisodeT) -> EpisodeT:
        """Persist a new episode."""

    async def get(self, episode_id: uuid.UUID) -> EpisodeT | None:
        """Return an episode by ID."""

    async def list_for_story(
        self,
        story_id: uuid.UUID,
        limit: int,
        offset: int,
    ) -> Sequence[EpisodeT]:
        """Return paginated episodes for a story."""


class AIJobRepository(Protocol[AIJobT]):
    """Persistence contract for durable AI jobs."""

    async def add(self, job: AIJobT) -> AIJobT:
        """Persist a new job."""

    async def get(self, job_id: uuid.UUID) -> AIJobT | None:
        """Return a job by ID."""

    async def get_by_idempotency_key(self, key: str) -> AIJobT | None:
        """Return a job by idempotency key."""

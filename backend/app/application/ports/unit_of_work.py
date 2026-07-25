"""Unit-of-work contract for transactional application services."""

from __future__ import annotations

from typing import Protocol, Self

from app.application.ports.repositories import (
    AIJobRepository,
    EpisodeRepository,
    StoryRepository,
)


class UnitOfWork(Protocol):
    """Transaction boundary for use cases."""

    stories: StoryRepository[object]
    episodes: EpisodeRepository[object]
    ai_jobs: AIJobRepository[object]

    async def __aenter__(self) -> Self:
        """Open the transaction scope."""

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: object,
    ) -> None:
        """Commit or roll back the transaction scope."""

    async def commit(self) -> None:
        """Commit the active transaction."""

    async def rollback(self) -> None:
        """Roll back the active transaction."""

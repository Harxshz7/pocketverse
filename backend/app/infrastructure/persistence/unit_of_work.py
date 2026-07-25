"""SQLAlchemy unit-of-work implementation."""

from __future__ import annotations

from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.infrastructure.persistence.repositories import (
    SQLAlchemyAIJobRepository,
    SQLAlchemyEpisodeRepository,
    SQLAlchemyStoryRepository,
)
from app.infrastructure.persistence.session import async_session_factory


class SQLAlchemyUnitOfWork:
    """Transaction boundary with repository accessors."""

    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession] = async_session_factory,
    ) -> None:
        self._session_factory = session_factory
        self.session: AsyncSession | None = None
        self.stories: SQLAlchemyStoryRepository
        self.episodes: SQLAlchemyEpisodeRepository
        self.ai_jobs: SQLAlchemyAIJobRepository

    async def __aenter__(self) -> Self:
        """Open a session and repositories for a use case."""
        self.session = self._session_factory()
        self.stories = SQLAlchemyStoryRepository(self.session)
        self.episodes = SQLAlchemyEpisodeRepository(self.session)
        self.ai_jobs = SQLAlchemyAIJobRepository(self.session)
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        """Commit on success, roll back on failure, and close the session."""
        if self.session is None:
            return

        if exc_type is None:
            await self.commit()
        else:
            await self.rollback()

        await self.session.close()

    async def commit(self) -> None:
        """Commit the active transaction."""
        if self.session is None:
            raise RuntimeError("Unit of work has not been entered")
        await self.session.commit()

    async def rollback(self) -> None:
        """Roll back the active transaction."""
        if self.session is None:
            raise RuntimeError("Unit of work has not been entered")
        await self.session.rollback()


"""SQLAlchemy repository implementations."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Generic, TypeVar

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence import models

ModelT = TypeVar("ModelT")


class SQLAlchemyRepository(Generic[ModelT]):
    """Small typed repository base for aggregate CRUD operations."""

    model_type: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, entity: ModelT) -> ModelT:
        """Persist an entity in the current transaction."""
        self.session.add(entity)
        await self.session.flush()
        return entity

    async def get(self, entity_id: uuid.UUID) -> ModelT | None:
        """Return an entity by UUID primary key."""
        return await self.session.get(self.model_type, entity_id)

    async def list_by_statement(self, statement: Select[tuple[ModelT]]) -> Sequence[ModelT]:
        """Return entities from a typed select statement."""
        result = await self.session.execute(statement)
        return result.scalars().all()


class SQLAlchemyStoryRepository(SQLAlchemyRepository[models.Story]):
    """SQLAlchemy persistence for stories."""

    model_type = models.Story

    async def get_by_owner_slug(
        self,
        owner_id: uuid.UUID,
        slug: str,
    ) -> models.Story | None:
        """Return a story by owner and slug."""
        result = await self.session.execute(
            select(models.Story).where(
                models.Story.owner_id == owner_id,
                models.Story.slug == slug,
                models.Story.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_for_owner(
        self,
        owner_id: uuid.UUID,
        limit: int,
        offset: int,
    ) -> Sequence[models.Story]:
        """Return paginated stories for an owner."""
        return await self.list_by_statement(
            select(models.Story)
            .where(
                models.Story.owner_id == owner_id,
                models.Story.deleted_at.is_(None),
            )
            .order_by(models.Story.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )


class SQLAlchemyEpisodeRepository(SQLAlchemyRepository[models.Episode]):
    """SQLAlchemy persistence for episodes."""

    model_type = models.Episode

    async def list_for_story(
        self,
        story_id: uuid.UUID,
        limit: int,
        offset: int,
    ) -> Sequence[models.Episode]:
        """Return paginated episodes for a story."""
        return await self.list_by_statement(
            select(models.Episode)
            .where(
                models.Episode.story_id == story_id,
                models.Episode.deleted_at.is_(None),
            )
            .order_by(models.Episode.season_number, models.Episode.episode_number)
            .limit(limit)
            .offset(offset)
        )


class SQLAlchemyAIJobRepository(SQLAlchemyRepository[models.AIJob]):
    """SQLAlchemy persistence for durable AI jobs."""

    model_type = models.AIJob

    async def get_by_idempotency_key(self, key: str) -> models.AIJob | None:
        """Return a job by idempotency key."""
        result = await self.session.execute(
            select(models.AIJob).where(models.AIJob.idempotency_key == key)
        )
        return result.scalar_one_or_none()


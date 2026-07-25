"""Async SQLAlchemy session wiring for the production schema."""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


def create_engine(database_url: str | None = None) -> AsyncEngine:
    """Create the async engine for production persistence."""
    return create_async_engine(
        database_url or settings.DATABASE_URL,
        pool_pre_ping=True,
        future=True,
    )


engine = create_engine()
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Yield an async SQLAlchemy session for dependency injection."""
    async with async_session_factory() as session:
        yield session


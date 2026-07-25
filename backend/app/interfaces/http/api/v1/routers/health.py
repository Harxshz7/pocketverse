"""Health endpoints for API v1."""

from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.interfaces.http.api.v1.schemas import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Return API health metadata."""
    return HealthResponse(
        status="ok",
        service=settings.APP_NAME,
        version=settings.API_VERSION,
    )


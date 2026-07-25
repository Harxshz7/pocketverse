"""API v1 router composition."""

from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.interfaces.http.api.v1.schemas import HealthResponse

api_v1_router = APIRouter()


@api_v1_router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    """Return API health metadata."""
    return HealthResponse(
        status="ok",
        service=settings.APP_NAME,
        version=settings.API_VERSION,
    )

"""Shared API v1 transport schemas."""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """API health response."""

    status: str
    service: str
    version: str


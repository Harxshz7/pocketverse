"""FastAPI dependencies for API v1."""

from __future__ import annotations

from typing import Annotated

from fastapi import Query

from app.interfaces.http.api.v1.pagination import PageParams


def get_page_params(
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PageParams:
    """Return normalized pagination parameters."""
    return PageParams(limit=limit, offset=offset)


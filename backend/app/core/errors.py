"""Application error types shared across interface adapters."""

from __future__ import annotations

from dataclasses import dataclass, field
from http import HTTPStatus
from typing import Any


@dataclass(slots=True)
class AppError(Exception):
    """Base application error with a stable machine-readable code."""

    message: str
    code: str
    status_code: int = HTTPStatus.BAD_REQUEST
    details: dict[str, Any] = field(default_factory=dict)


class AuthenticationError(AppError):
    """Raised when a request lacks valid authentication."""

    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(
            message=message,
            code="authentication_required",
            status_code=HTTPStatus.UNAUTHORIZED,
        )


class AuthorizationError(AppError):
    """Raised when an authenticated user is not allowed to perform an action."""

    def __init__(self, message: str = "Permission denied") -> None:
        super().__init__(
            message=message,
            code="permission_denied",
            status_code=HTTPStatus.FORBIDDEN,
        )


class ResourceNotFoundError(AppError):
    """Raised when a requested resource does not exist or is not visible."""

    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(
            message=f"{resource} not found",
            code="resource_not_found",
            status_code=HTTPStatus.NOT_FOUND,
            details={"resource": resource, "identifier": identifier},
        )


class ConflictError(AppError):
    """Raised when a request conflicts with current persisted state."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(
            message=message,
            code="conflict",
            status_code=HTTPStatus.CONFLICT,
            details=details or {},
        )


class RateLimitExceededError(AppError):
    """Raised when a caller exceeds an enforced rate limit."""

    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(
            message="Rate limit exceeded",
            code="rate_limit_exceeded",
            status_code=HTTPStatus.TOO_MANY_REQUESTS,
            details={"retry_after_seconds": retry_after_seconds},
        )


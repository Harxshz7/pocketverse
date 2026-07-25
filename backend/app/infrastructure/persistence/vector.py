"""pgvector SQLAlchemy type with a local fallback for import-time validation."""

from __future__ import annotations

try:
    from pgvector.sqlalchemy import Vector as PgVector
except ImportError:
    from sqlalchemy.types import UserDefinedType

    class PgVector(UserDefinedType):
        """Fallback that compiles to PostgreSQL pgvector column syntax."""

        cache_ok = True

        def __init__(self, dimensions: int) -> None:
            self.dimensions = dimensions

        def get_col_spec(self, **_: object) -> str:
            return f"vector({self.dimensions})"


Vector = PgVector


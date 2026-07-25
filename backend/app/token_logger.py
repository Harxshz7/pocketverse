"""Lightweight token and cost logger for OpenAI API calls.

Tracks prompt/completion tokens and estimated cost per call and
cumulatively so the team can monitor spend during the hackathon.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

logger = logging.getLogger("pocketverse.tokens")

# Pricing per million tokens for gpt-4.1-mini (as of 2025)
_PRICING: dict[str, dict[str, float]] = {
    "gpt-4.1-mini": {"prompt": 0.40, "completion": 1.60},
    "gpt-4.1": {"prompt": 2.00, "completion": 8.00},
    "gpt-4o-mini": {"prompt": 0.15, "completion": 0.60},
    "gpt-4o": {"prompt": 2.50, "completion": 10.00},
}


@dataclass
class _CostAccumulator:
    """Running total of token usage and estimated cost."""

    total_prompt_tokens: int = 0
    total_completion_tokens: int = 0
    total_cost_usd: float = 0.0
    call_count: int = 0
    calls: list[dict] = field(default_factory=list)


_accumulator = _CostAccumulator()


def log_usage(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    label: str = "",
) -> dict:
    """Log token usage for a single API call and return a summary dict."""
    pricing = _PRICING.get(model, _PRICING["gpt-4.1-mini"])
    cost = (
        prompt_tokens * pricing["prompt"] / 1_000_000
        + completion_tokens * pricing["completion"] / 1_000_000
    )

    _accumulator.total_prompt_tokens += prompt_tokens
    _accumulator.total_completion_tokens += completion_tokens
    _accumulator.total_cost_usd += cost
    _accumulator.call_count += 1

    entry = {
        "call": _accumulator.call_count,
        "label": label,
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cost_usd": round(cost, 6),
        "cumulative_cost_usd": round(_accumulator.total_cost_usd, 6),
    }
    _accumulator.calls.append(entry)

    logger.info(
        "[Token Logger] #%d %s | model=%s | prompt=%d comp=%d | "
        "cost=$%.6f | cumulative=$%.6f",
        entry["call"],
        label,
        model,
        prompt_tokens,
        completion_tokens,
        cost,
        _accumulator.total_cost_usd,
    )

    return entry


def get_usage_summary() -> dict:
    """Return cumulative usage statistics."""
    return {
        "total_calls": _accumulator.call_count,
        "total_prompt_tokens": _accumulator.total_prompt_tokens,
        "total_completion_tokens": _accumulator.total_completion_tokens,
        "total_cost_usd": round(_accumulator.total_cost_usd, 6),
        "recent_calls": _accumulator.calls[-10:],
    }

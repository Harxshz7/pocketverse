"""Rewrite variant generation for concrete issue evidence spans.

This module only rewrites the exact quoted span attached to an issue. It does
not perform broad editing, grammar correction, or audience simulation.
"""

from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from .config import settings
from .schemas import RewriteVariantBatchOutput, RewriteVariantOutput
from .token_logger import log_usage

logger = logging.getLogger("pocketverse.rewrites")

REWRITE_MODEL = "gpt-4.1-mini"

_REWRITE_VARIANT_SCHEMA = {
    "type": "object",
    "properties": {
        "variants": {
            "type": "array",
            "minItems": 3,
            "maxItems": 4,
            "items": {
                "type": "object",
                "properties": {
                    "variant_id": {
                        "type": "string",
                        "description": "Stable short id, e.g. v1, v2, v3.",
                    },
                    "tone_label": {
                        "type": "string",
                        "description": "Short label derived from the episode's established tone.",
                    },
                    "rewritten_text": {
                        "type": "string",
                        "description": "Replacement for the exact original span only.",
                    },
                    "rationale": {
                        "type": "string",
                        "description": "One-line reason this variant addresses the issue.",
                    },
                },
                "required": [
                    "variant_id",
                    "tone_label",
                    "rewritten_text",
                    "rationale",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["variants"],
    "additionalProperties": False,
}

_SYSTEM_PROMPT = """You are a serialized audio story rewrite assistant.

You receive one continuity issue and one exact quoted span from the episode.
Rewrite only that exact span. Do not rewrite surrounding text. Do not correct
grammar broadly. Do not invent engagement predictions. The goal is to provide
3-4 concrete replacement options that preserve the episode's established tone
while resolving or softening the continuity contradiction described by the issue.

Tone labels must be derived from the episode's own writing style and the issue
context. Labels may be simple, such as "Subtle", "Dramatic", "Concise", or
"Match Original", but do not use a fixed unrelated genre list.

Return exactly one JSON object matching the schema."""


async def generate_rewrite_variants(
    *,
    episode_number: int,
    episode_title: str,
    episode_text: str,
    issue_category: str,
    issue_status: str,
    issue_problem: str,
    issue_reasoning: str,
    original_span: str,
) -> list[RewriteVariantOutput]:
    """Generate 3-4 rewrite variants for one exact issue span."""
    if not settings.OPENAI_API_KEY:
        logger.warning("No OPENAI_API_KEY set — no rewrite variants generated")
        return []

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # Keep prompt bounded; the exact span and issue details carry the contract.
    episode_context = episode_text[:8_000]
    user_content = json.dumps(
        {
            "episode": {
                "number": episode_number,
                "title": episode_title,
                "text_excerpt_for_tone": episode_context,
            },
            "issue": {
                "category": issue_category,
                "status": issue_status,
                "problem": issue_problem,
                "reasoning": issue_reasoning,
            },
            "exact_original_span_to_replace": original_span,
            "constraints": [
                "Return 3-4 variants in one response.",
                "Each rewritten_text must replace only the exact original span.",
                "Do not include surrounding episode text unless it is part of the exact original span.",
                "Preserve story facts except where the continuity issue requires a correction.",
            ],
        },
        indent=2,
    )

    response = await client.chat.completions.create(
        model=REWRITE_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "rewrite_variant_batch",
                "strict": True,
                "schema": _REWRITE_VARIANT_SCHEMA,
            },
        },
        temperature=0.4,
    )

    usage = response.usage
    if usage:
        log_usage(
            model=REWRITE_MODEL,
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            label=f"rewrite_variants_ep{episode_number}_{issue_status}",
        )

    raw = json.loads(response.choices[0].message.content)
    batch = RewriteVariantBatchOutput(**raw)
    return batch.variants[:4]

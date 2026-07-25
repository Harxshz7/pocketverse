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
OPENAI_TIMEOUT_SECONDS = 30.0

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

_SYSTEM_PROMPT = """You are a senior AI story rewrite engine for serialized fiction.

You receive one continuity issue and one exact quoted span from the episode text.
Your task is to provide 3-4 rewritten variants of that exact quoted span in a single batched JSON response.

Requirements for each variant:
1. Replace ONLY the exact quoted span. Do not include surrounding text.
2. Resolve or eliminate the continuity contradiction.
3. Perform a thorough grammar, flow, and clarity pass on the rewritten span as part of this instruction.
4. Tone labels: Variant 1 must match the episode's own established tone by default (e.g. "Canon Match"). The remaining variants should explore stylistic variations (such as Horror, Comedy, Romance, or Thriller) while remaining faithful to the story context.
5. Provide a clear rationale explaining how the variant fixes the continuity issue and improves grammar/clarity.

Return exactly one JSON object conforming to the schema."""

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
        logger.warning("No OPENAI_API_KEY set; no rewrite variants generated")
        return []

    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=OPENAI_TIMEOUT_SECONDS,
    )

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
                "Return 3-4 variants in one batched response.",
                "Variant 1 must match the established episode tone.",
                "Include optional Horror/Comedy/Romance/Thriller variants as appropriate for the story context.",
                "Apply a grammar, rhythm, and clarity enhancement to each variant.",
                "Each rewritten_text replaces only the exact original span.",
            ],
        },
        indent=2,
    )

    try:
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
    except Exception:
        logger.exception("OpenAI rewrite variant request failed")
        return []

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

"""LLM Explanation Layer.

Takes structured ValidationFindings from the deterministic engine and
generates human-readable explanations using a single LLM call for all findings.

KEY PRINCIPLE: The LLM here EXPLAINS findings — it does NOT generate them.
The validation engine already determined what's wrong and gathered evidence.
This layer just makes it readable for creators and adds a persona tag.
"""

from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from .config import settings
from .schemas import ExplanationOutput, ValidationFinding, ExplanationBatchOutput
from .token_logger import log_usage

logger = logging.getLogger("pocketverse.explanation")

_EXPLANATION_BATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "explanations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "problem": {
                        "type": "string",
                        "description": "Clear, creator-friendly description of the continuity issue.",
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Step-by-step reasoning explaining why this is an issue, referencing the evidence.",
                    },
                    "impact": {
                        "type": "string",
                        "description": "What breaks in the story if this is not corrected.",
                    },
                    "suggested_fixes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "2-4 actionable fix suggestions for the creator.",
                    },
                    "persona_tag": {
                        "type": "string",
                        "description": "A persona tag for report readability (e.g., Director, Editor, Character Expert, Producer)",
                    },
                },
                "required": ["problem", "reasoning", "impact", "suggested_fixes", "persona_tag"],
                "additionalProperties": False,
            }
        }
    },
    "required": ["explanations"],
    "additionalProperties": False,
}

_SYSTEM_PROMPT = """You are a story continuity editor helping audio drama creators. You receive a batch of structured validation findings about continuity issues in their serialized story.

Your job is to EXPLAIN the findings clearly, not to generate new findings. The validation system has already identified the issues and gathered the evidence — you just need to make it understandable and actionable.

For each finding, provide:
1. PROBLEM: A clear, one-paragraph description a creator would understand. Reference specific character names and events.
2. REASONING: Walk through the logic — "In episode X, we see Y. But in episode Z, we see W. There's no event between them that explains this change."
3. IMPACT: What breaks for the audience if this isn't fixed. Be specific about immersion, logic, or character believability.
4. SUGGESTED FIXES: 2-4 concrete, actionable fixes. E.g., "Add a scene in episode 3 where [character] experiences [event] that explains their shift from [trait A] to [trait B]."
5. PERSONA TAG: Assign a persona tag (e.g., Director, Editor, Character Expert, Producer) based on the category of the issue purely for report readability.

Be direct and professional. These are working creators under deadline — don't be flowery or condescending.
Ensure your output array length exactly matches the input findings array length, in the exact same order."""


async def explain_findings(
    findings: list[ValidationFinding],
    episode_number: int,
) -> list[ExplanationOutput]:
    """Explain a batch of findings using a single LLM call.

    Args:
        findings: The structured findings from the validation engine.
        episode_number: The episode number being validated.

    Returns:
        List of ExplanationOutput matching the input order.
    """
    if not findings:
        return []

    if not settings.OPENAI_API_KEY:
        logger.warning("No OPENAI_API_KEY set — returning placeholder explanations")
        return [
            ExplanationOutput(
                problem=f.summary,
                reasoning="Unable to generate detailed reasoning (no API key configured).",
                impact="This issue could affect story continuity and audience immersion.",
                suggested_fixes=["Review and address the flagged inconsistency."],
                persona_tag="Editor"
            )
            for f in findings
        ]

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # Build the user message with the list of structured findings
    user_content = json.dumps(
        {
            "episode_being_validated": episode_number,
            "findings": [
                {
                    "finding_index": i,
                    "category": finding.category.value,
                    "status": finding.status.value,
                    "summary": finding.summary,
                    "evidence": [e.model_dump() for e in finding.evidence],
                    "details": finding.details,
                }
                for i, finding in enumerate(findings)
            ]
        },
        indent=2,
    )

    response = await client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "explanation_batch_output",
                "strict": True,
                "schema": _EXPLANATION_BATCH_SCHEMA,
            },
        },
        temperature=0.3,
    )

    # Log token usage
    usage = response.usage
    if usage:
        log_usage(
            model=settings.MODEL_NAME,
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            label=f"explanation_batch_ep{episode_number}_{len(findings)}findings",
        )

    raw = json.loads(response.choices[0].message.content)
    batch_result = ExplanationBatchOutput(**raw)

    logger.info(
        "Generated explanations for %d issues in ep%d",
        len(batch_result.explanations),
        episode_number,
    )

    return batch_result.explanations

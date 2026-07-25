"""Story element extraction using OpenAI structured outputs.

This module is the FIRST step in the pipeline. It takes raw episode text
and extracts structured story elements (characters, relationships, events,
rules, promises, secrets) using a single LLM call with JSON schema mode.

The extraction call is the ONLY place the LLM reads raw episode text.
Downstream modules work with the structured graph, not raw text.
"""

from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from .config import settings
from .schemas import (
    ExtractionResult,
    ExtractedCharacter,
    ExtractedRelationship,
    ExtractedTimelineEvent,
    ExtractedWorldRule,
    ExtractedPromise,
    ExtractedSecret,
    TurningPointType,
)
from .token_logger import log_usage

logger = logging.getLogger("pocketverse.extraction")

# The JSON schema the LLM must conform to — matches ExtractionResult
_EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "characters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "traits": {"type": "array", "items": {"type": "string"}},
                    "motivations": {"type": "array", "items": {"type": "string"}},
                    "backstory": {"type": ["string", "null"]},
                    "is_new": {"type": "boolean"},
                },
                "required": ["name", "traits", "motivations", "backstory", "is_new"],
                "additionalProperties": False,
            },
        },
        "relationships": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "character_a_name": {"type": "string"},
                    "character_b_name": {"type": "string"},
                    "type": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": [
                    "character_a_name",
                    "character_b_name",
                    "type",
                    "description",
                ],
                "additionalProperties": False,
            },
        },
        "timeline_events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "event_description": {"type": "string"},
                    "characters_involved": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "turning_point_type": {
                        "type": ["string", "null"],
                        "enum": [e.value for e in TurningPointType] + [None],
                    },
                    "sequence_order": {"type": "integer"},
                },
                "required": [
                    "event_description",
                    "characters_involved",
                    "turning_point_type",
                    "sequence_order",
                ],
                "additionalProperties": False,
            },
        },
        "world_rules": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "rule": {"type": "string"},
                    "category": {"type": "string"},
                },
                "required": ["rule", "category"],
                "additionalProperties": False,
            },
        },
        "promises": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "fulfilled": {"type": "boolean"},
                },
                "required": ["description", "fulfilled"],
                "additionalProperties": False,
            },
        },
        "secrets": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "holder_name": {"type": "string"},
                    "revealed": {"type": "boolean"},
                },
                "required": ["description", "holder_name", "revealed"],
                "additionalProperties": False,
            },
        },
    },
    "required": [
        "characters",
        "relationships",
        "timeline_events",
        "world_rules",
        "promises",
        "secrets",
    ],
    "additionalProperties": False,
}

_SYSTEM_PROMPT = """You are a story analysis engine. Your job is to extract structured narrative elements from an episode of a serialized audio story.

Extract ALL of the following from the episode text:

1. CHARACTERS: Every character mentioned or appearing. For each:
   - name: their name as used in the story
   - traits: personality traits demonstrated in this episode (brave, cunning, loyal, etc.)
   - motivations: what drives them in this episode
   - backstory: any backstory revealed in this episode (null if none)
   - is_new: true if this is their first appearance in the series

2. RELATIONSHIPS: Every relationship between characters shown in this episode:
   - character_a_name, character_b_name: the two characters
   - type: the relationship type (romantic, rivalry, mentor-student, allies, enemies, family, etc.)
   - description: specific description of how the relationship manifests

3. TIMELINE EVENTS: Every significant event, in order of occurrence:
   - event_description: what happened
   - characters_involved: names of characters involved
   - turning_point_type: if this event is a major turning point, classify it as one of:
     BETRAYAL, DEATH, REDEMPTION, TRAUMA, REVELATION, POWER_GAIN, POWER_LOSS,
     MOTIVATION_SHIFT, FEAR_OVERCOME, ALLIANCE_FORMED, ALLIANCE_BROKEN,
     SECRET_REVEALED, PROMISE_MADE, PROMISE_BROKEN
     Set to null if the event is not a turning point.
   - sequence_order: integer order within this episode (1, 2, 3...)

4. WORLD RULES: Any rules about how the story world works (magic systems, social hierarchies, physical laws, etc.):
   - rule: the rule as stated or implied
   - category: type of rule (magic, social, physical, political, etc.)

5. PROMISES: Narrative promises/setups that imply future payoff:
   - description: what was promised or set up
   - fulfilled: whether it was fulfilled in this episode

6. SECRETS: Information known to some characters but hidden from others:
   - description: the secret
   - holder_name: the character who holds the secret
   - revealed: whether it was revealed in this episode

Be thorough but precise. Only extract what is actually in the text — do not infer or fabricate."""


async def extract_story_elements(
    episode_text: str,
    episode_number: int,
    existing_characters: list[str] | None = None,
) -> ExtractionResult:
    """Extract structured story elements from raw episode text.

    Args:
        episode_text: The raw text of the episode.
        episode_number: The episode number (for context in the prompt).
        existing_characters: Names of characters already in the graph
            (helps the LLM identify returning vs new characters).

    Returns:
        ExtractionResult with all extracted elements.
    """
    if not settings.OPENAI_API_KEY:
        logger.warning("No OPENAI_API_KEY set — returning empty extraction")
        return ExtractionResult()

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    user_content = f"Episode {episode_number}:\n\n{episode_text}"
    if existing_characters:
        user_content += (
            f"\n\n---\nPreviously known characters: {', '.join(existing_characters)}. "
            "Mark these as is_new=false if they appear in this episode."
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
                "name": "extraction_result",
                "strict": True,
                "schema": _EXTRACTION_SCHEMA,
            },
        },
        temperature=0.1,
    )

    # Log token usage
    usage = response.usage
    if usage:
        log_usage(
            model=settings.MODEL_NAME,
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            label=f"extraction_ep{episode_number}",
        )

    # Parse the structured response
    raw = json.loads(response.choices[0].message.content)
    result = ExtractionResult(**raw)

    logger.info(
        "Extracted from ep%d: %d characters, %d relationships, %d events, "
        "%d rules, %d promises, %d secrets",
        episode_number,
        len(result.characters),
        len(result.relationships),
        len(result.timeline_events),
        len(result.world_rules),
        len(result.promises),
        len(result.secrets),
    )

    return result

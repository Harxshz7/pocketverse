"""Deterministic Story Validation Engine.

This is the CORE differentiator of PocketVerse. Every check here is pure
logic — no LLM calls. The engine queries the Story Memory Graph and applies
deterministic rules to find continuity errors.

Each checker function returns a list of ValidationFindings. The master
function `validate_episode` aggregates them all.
"""

from __future__ import annotations

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, memory_graph
from .schemas import (
    EvidenceItem,
    IssueCategory,
    IssueStatus,
    ValidationFinding,
)

logger = logging.getLogger("pocketverse.validation")


# ---------------------------------------------------------------------------
# Helper: build evidence from episode text
# ---------------------------------------------------------------------------


def _make_evidence(
    episode: models.Episode, excerpt: str, relevance: str
) -> EvidenceItem:
    """Create an EvidenceItem from an episode and excerpt."""
    return EvidenceItem(
        episode_number=episode.number,
        episode_title=episode.title,
        excerpt=excerpt,
        relevance=relevance,
    )


# ---------------------------------------------------------------------------
# Checker 1: Character Contradictions
# ---------------------------------------------------------------------------


async def check_character_contradictions(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if characters exhibit contradictory traits without a qualifying
    turning-point event between the old trait and the new one.

    Logic:
    - For each character in the new episode, compare their current traits
      against previously stored traits.
    - If a new trait contradicts an existing trait (e.g., "cowardly" vs "brave"),
      check whether a qualifying turning-point event exists between the
      episodes where each trait was established.
    - If no turning point exists → flag as contradiction.
    """
    findings: list[ValidationFinding] = []

    # Contradiction pairs — traits that conflict unless a turning point justifies it
    _CONTRADICTION_PAIRS = {
        frozenset({"brave", "cowardly"}),
        frozenset({"loyal", "treacherous"}),
        frozenset({"honest", "deceptive"}),
        frozenset({"kind", "cruel"}),
        frozenset({"trusting", "suspicious"}),
        frozenset({"generous", "greedy"}),
        frozenset({"calm", "volatile"}),
        frozenset({"confident", "insecure"}),
        frozenset({"merciful", "ruthless"}),
        frozenset({"peaceful", "aggressive"}),
        frozenset({"selfless", "selfish"}),
        frozenset({"optimistic", "pessimistic"}),
        frozenset({"forgiving", "vengeful"}),
        frozenset({"compassionate", "callous"}),
        frozenset({"humble", "arrogant"}),
    }

    # Get all characters
    characters = await memory_graph.get_all_characters(db)

    for char in characters:
        if not char.traits or len(char.traits) < 2:
            continue

        traits_lower = [t.lower().strip() for t in char.traits]

        # Check for contradictions within the character's trait list
        for pair in _CONTRADICTION_PAIRS:
            pair_list = list(pair)
            if pair_list[0] in traits_lower and pair_list[1] in traits_lower:
                # Check for a turning point that could justify the change
                events = await memory_graph.get_all_timeline_events(db)
                char_events = [
                    e
                    for e in events
                    if char.id in (e.characters_involved or [])
                    and e.turning_point_type is not None
                ]

                # Qualifying turning points for trait changes
                qualifying_types = {
                    "MOTIVATION_SHIFT",
                    "TRAUMA",
                    "REDEMPTION",
                    "REVELATION",
                    "FEAR_OVERCOME",
                    "BETRAYAL",
                }
                has_qualifying = any(
                    e.turning_point_type in qualifying_types for e in char_events
                )

                if not has_qualifying:
                    findings.append(
                        ValidationFinding(
                            category=IssueCategory.CHARACTER_CONTRADICTION,
                            status=IssueStatus.CRITICAL,
                            summary=(
                                f"Character '{char.name}' has contradictory traits "
                                f"'{pair_list[0]}' and '{pair_list[1]}' with no "
                                f"qualifying turning-point event to justify the change."
                            ),
                            evidence=[
                                _make_evidence(
                                    episode,
                                    f"Character traits: {', '.join(char.traits)}",
                                    f"'{char.name}' exhibits conflicting traits without "
                                    f"an in-story event justifying the personality shift.",
                                )
                            ],
                            details={
                                "character_name": char.name,
                                "trait_a": pair_list[0],
                                "trait_b": pair_list[1],
                                "missing": "qualifying turning-point event",
                            },
                        )
                    )

    return findings


# ---------------------------------------------------------------------------
# Checker 2: Timeline Breaks
# ---------------------------------------------------------------------------


async def check_timeline_breaks(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check for temporal inconsistencies in the timeline.

    Logic:
    - Events should have monotonically increasing sequence orders within
      an episode.
    - Cross-episode: a later episode's events should have higher sequence
      orders than earlier episodes' events.
    """
    findings: list[ValidationFinding] = []

    all_events = await memory_graph.get_all_timeline_events(db)

    if len(all_events) < 2:
        return findings

    # Check for duplicate sequence orders
    seq_orders = {}
    for evt in all_events:
        if evt.sequence_order in seq_orders:
            other = seq_orders[evt.sequence_order]
            if other.episode_id != evt.episode_id:
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.TIMELINE_BREAK,
                        status=IssueStatus.NEEDS_REVIEW,
                        summary=(
                            f"Timeline events have conflicting sequence positions: "
                            f"'{evt.event_description[:60]}...' and "
                            f"'{other.event_description[:60]}...' share sequence "
                            f"order {evt.sequence_order} across different episodes."
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                evt.event_description,
                                "This event has the same sequence position as an event in another episode.",
                            )
                        ],
                        details={
                            "event_a": evt.event_description,
                            "event_b": other.event_description,
                            "shared_sequence": evt.sequence_order,
                        },
                    )
                )
            seq_orders[evt.sequence_order] = evt
        else:
            seq_orders[evt.sequence_order] = evt

    # Check that later episodes don't have events with lower sequence orders
    # than earlier episodes (cross-episode temporal consistency)
    episode_max_seq: dict[int, int] = {}
    for evt in all_events:
        ep_id = evt.episode_id
        if ep_id not in episode_max_seq:
            episode_max_seq[ep_id] = evt.sequence_order
        else:
            episode_max_seq[ep_id] = max(episode_max_seq[ep_id], evt.sequence_order)

    # Get episodes to compare numbers
    episodes = await memory_graph.get_all_episodes(db)
    ep_num_map = {e.id: e.number for e in episodes}

    ep_ids_sorted = sorted(episode_max_seq.keys(), key=lambda x: ep_num_map.get(x, 0))

    for i in range(1, len(ep_ids_sorted)):
        prev_ep = ep_ids_sorted[i - 1]
        curr_ep = ep_ids_sorted[i]
        prev_max = episode_max_seq[prev_ep]
        # Check if current episode has events with sequence order <= previous max
        curr_events = [e for e in all_events if e.episode_id == curr_ep]
        for evt in curr_events:
            if evt.sequence_order <= prev_max and prev_ep != curr_ep:
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.TIMELINE_BREAK,
                        status=IssueStatus.STRONG,
                        summary=(
                            f"Event '{evt.event_description[:60]}...' in episode "
                            f"{ep_num_map.get(curr_ep, '?')} has sequence order "
                            f"{evt.sequence_order}, which is not after the latest "
                            f"event in episode {ep_num_map.get(prev_ep, '?')} "
                            f"(sequence {prev_max})."
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                evt.event_description,
                                "This event appears to occur before events in a previous episode.",
                            )
                        ],
                        details={
                            "event": evt.event_description,
                            "event_sequence": evt.sequence_order,
                            "previous_episode_max_sequence": prev_max,
                        },
                    )
                )
                break  # One finding per episode pair is enough

    return findings


# ---------------------------------------------------------------------------
# Checker 3: Broken Promises
# ---------------------------------------------------------------------------


async def check_broken_promises(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check for unfulfilled narrative promises.

    Logic:
    - If a promise has been pending for more than 3 episodes, flag it.
    - If a new event directly contradicts a promise, flag it as critical.
    """
    findings: list[ValidationFinding] = []

    unfulfilled = await memory_graph.get_unfulfilled_promises(db)
    episodes = await memory_graph.get_all_episodes(db)
    ep_id_to_num = {e.id: e.number for e in episodes}

    for promise in unfulfilled:
        made_num = ep_id_to_num.get(promise.made_episode, 0)
        gap = episode.number - made_num

        if gap >= 5:
            status = IssueStatus.CRITICAL
        elif gap >= 3:
            status = IssueStatus.NEEDS_REVIEW
        else:
            continue  # Too early to flag

        findings.append(
            ValidationFinding(
                category=IssueCategory.BROKEN_PROMISE,
                status=status,
                summary=(
                    f"Narrative promise '{promise.description[:80]}...' made in "
                    f"episode {made_num} remains unfulfilled after {gap} episodes."
                ),
                evidence=[
                    _make_evidence(
                        episode,
                        promise.description,
                        f"This promise was set up {gap} episodes ago and has not been addressed.",
                    )
                ],
                details={
                    "promise_description": promise.description,
                    "made_episode": made_num,
                    "episodes_pending": gap,
                },
            )
        )

    return findings


# ---------------------------------------------------------------------------
# Checker 4: World Rule Violations
# ---------------------------------------------------------------------------


async def check_world_rule_violations(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if new events violate established world rules.

    Logic:
    - For each new event, check if it conflicts with any established rule.
    - This uses simple keyword matching as a heuristic — a more sophisticated
      approach would use semantic similarity, but for MVP this catches
      obvious violations.
    """
    findings: list[ValidationFinding] = []

    rules = await memory_graph.get_all_world_rules(db)

    if not rules or not new_events:
        return findings

    # Build a simple keyword index from rules
    for rule in rules:
        rule_words = set(rule.rule.lower().split())
        # Remove very common words
        rule_words -= {
            "the",
            "a",
            "an",
            "is",
            "are",
            "was",
            "were",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "and",
            "or",
            "but",
            "not",
            "can",
            "cannot",
            "no",
            "only",
        }

        for evt in new_events:
            evt_words = set(evt.event_description.lower().split())
            overlap = rule_words & evt_words

            # Check for negation patterns — if the rule says "cannot" and the
            # event describes that action happening
            rule_lower = rule.rule.lower()
            evt_lower = evt.event_description.lower()

            violation = False
            if "cannot" in rule_lower or "never" in rule_lower or "impossible" in rule_lower:
                # Extract the action that's forbidden
                for neg_word in ["cannot", "never", "impossible to"]:
                    if neg_word in rule_lower:
                        # Get words after the negation
                        after_neg = rule_lower.split(neg_word, 1)[1].strip()
                        action_words = set(after_neg.split()[:5])
                        action_words -= {
                            "the", "a", "an", "be", "is", "are", "to",
                        }
                        if action_words & evt_words and len(action_words & evt_words) >= 2:
                            violation = True
                            break

            if violation:
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.WORLD_RULE_VIOLATION,
                        status=IssueStatus.CRITICAL,
                        summary=(
                            f"Event '{evt.event_description[:60]}...' may violate "
                            f"world rule: '{rule.rule[:80]}...'"
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                evt.event_description,
                                f"This event appears to contradict the established "
                                f"world rule: {rule.rule}",
                            )
                        ],
                        details={
                            "rule": rule.rule,
                            "rule_category": rule.category,
                            "event": evt.event_description,
                            "overlap_words": list(overlap),
                        },
                    )
                )

    return findings


# ---------------------------------------------------------------------------
# Checker 5: Relationship Inconsistencies
# ---------------------------------------------------------------------------


async def check_relationship_inconsistencies(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if relationship states changed without a qualifying event.

    Logic:
    - If two characters' relationship type changed (e.g., allies → enemies),
      check whether a qualifying turning-point event exists between them
      (BETRAYAL, ALLIANCE_BROKEN, ALLIANCE_FORMED, etc.).
    """
    findings: list[ValidationFinding] = []

    relationships = await memory_graph.get_all_relationships(db)

    # Group relationships by character pair
    pair_rels: dict[frozenset, list[models.Relationship]] = {}
    for rel in relationships:
        pair = frozenset({rel.character_a_id, rel.character_b_id})
        pair_rels.setdefault(pair, []).append(rel)

    # Contradictory relationship types
    _CONTRADICTIONS = {
        frozenset({"allies", "enemies"}),
        frozenset({"friends", "enemies"}),
        frozenset({"lovers", "enemies"}),
        frozenset({"mentor", "rival"}),
        frozenset({"trusted", "betrayed"}),
    }

    for pair, rels in pair_rels.items():
        if len(rels) < 2:
            continue

        rel_types = {r.type.lower().strip() for r in rels}

        for contradiction in _CONTRADICTIONS:
            if contradiction.issubset(rel_types):
                # Check for qualifying events
                pair_list = list(pair)
                events = await memory_graph.get_all_timeline_events(db)
                qualifying_types = {
                    "BETRAYAL",
                    "ALLIANCE_FORMED",
                    "ALLIANCE_BROKEN",
                    "REVELATION",
                    "SECRET_REVEALED",
                }
                qualifying = [
                    e
                    for e in events
                    if e.turning_point_type in qualifying_types
                    and set(pair_list).issubset(set(e.characters_involved or []))
                ]

                if not qualifying:
                    # Get character names
                    chars = await memory_graph.get_all_characters(db)
                    char_map = {c.id: c.name for c in chars}
                    names = [char_map.get(cid, "Unknown") for cid in pair_list]

                    findings.append(
                        ValidationFinding(
                            category=IssueCategory.RELATIONSHIP_INCONSISTENCY,
                            status=IssueStatus.STRONG,
                            summary=(
                                f"Relationship between {names[0]} and {names[1]} "
                                f"shows contradictory states ({', '.join(contradiction)}) "
                                f"without a qualifying turning-point event."
                            ),
                            evidence=[
                                _make_evidence(
                                    episode,
                                    f"Relationship types: {', '.join(rel_types)}",
                                    f"The relationship changed without an in-story "
                                    f"event justifying the shift.",
                                )
                            ],
                            details={
                                "characters": names,
                                "contradictory_types": list(contradiction),
                                "all_types": list(rel_types),
                            },
                        )
                    )

    return findings


# ---------------------------------------------------------------------------
# Master validation function
# ---------------------------------------------------------------------------


async def validate_episode(
    db: AsyncSession,
    episode_id: int,
) -> list[ValidationFinding]:
    """Run all validation checks for a given episode.

    This is the main entry point for the validation engine. It runs all
    deterministic checkers and aggregates their findings.

    Args:
        db: Database session.
        episode_id: ID of the episode to validate.

    Returns:
        List of ValidationFindings (raw, before LLM explanation).
    """
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        logger.warning("Episode %d not found for validation", episode_id)
        return []

    # Get new events for this episode
    result = await db.execute(
        select(models.TimelineEvent).where(
            models.TimelineEvent.episode_id == episode_id
        )
    )
    new_events = list(result.scalars().all())

    # Run all checkers
    all_findings: list[ValidationFinding] = []

    checkers = [
        check_character_contradictions,
        check_timeline_breaks,
        check_broken_promises,
        check_world_rule_violations,
        check_relationship_inconsistencies,
    ]

    for checker in checkers:
        try:
            findings = await checker(db, episode, new_events)
            all_findings.extend(findings)
        except Exception as e:
            logger.error("Checker %s failed: %s", checker.__name__, e)

    logger.info(
        "Validation of episode %d found %d issues",
        episode_id,
        len(all_findings),
    )

    return all_findings

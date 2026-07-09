"""Buying signal trigger detection via keyword matching against enriched signal text."""

import json
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent / "config.json"


def _load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)


def _save_config(config):
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


def get_triggers():
    """Read trigger config list from config.json."""
    return _load_config().get("triggers", [])


def update_trigger(trigger_id, updates):
    """Apply updates to the trigger matching trigger_id and persist to config.json."""
    config = _load_config()
    triggers = config.get("triggers", [])
    for trigger in triggers:
        if trigger.get("id") == trigger_id:
            trigger.update(updates)
            break
    config["triggers"] = triggers
    _save_config(config)
    return triggers


def add_trigger(trigger):
    """Append a new trigger to config.json."""
    config = _load_config()
    triggers = config.get("triggers", [])
    triggers.append(trigger)
    config["triggers"] = triggers
    _save_config(config)
    return triggers


def detect_triggers(raw_signals, trigger_config):
    """Check each active trigger's keywords against raw_signals text (case insensitive).

    Returns (fired_triggers, total_boost) where fired_triggers is a list of
    the trigger objects that matched and total_boost is the sum of their
    score_boost values.
    """
    text = (raw_signals or "").lower()
    fired_triggers = []
    total_boost = 0

    for trigger in trigger_config:
        if not trigger.get("active", False):
            continue
        keywords = trigger.get("keywords", [])
        if any(keyword.lower() in text for keyword in keywords):
            fired_triggers.append(trigger)
            total_boost += trigger.get("score_boost", 0)

    return fired_triggers, total_boost

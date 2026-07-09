"""Weighted ICP scoring engine. Pure Python, no API calls.

Expected enriched_data shape (produced by enrichment.py):
{
  "industry": str,
  "headcount": int,
  "funding_stage": str,
  "funding_date": str (ISO date, e.g. "2026-02-01"),
  "tech_stack": list[str],
  "gtm_hires": list | int,
  "sales_job_postings": list | int,
}

Expected icp_config shape (ICP definition + weights):
{
  "icp_weights": {criterion: weight, ...},   # optional, falls back to DEFAULT_WEIGHTS
  "industry": str | list[str],
  "headcount_min": int,
  "headcount_max": int,
  "target_funding_stages": str | list[str],
  "target_tech_stack": list[str],
  "gtm_hiring_signal_threshold": int,         # optional, default 3
  "funding_recency_months": int,              # optional, default 12
}
"""

from datetime import datetime

DEFAULT_WEIGHTS = {
    "industry_match": 20,
    "headcount_range": 15,
    "funding_stage": 20,
    "tech_stack_signals": 15,
    "gtm_hiring_activity": 15,
    "funding_recency": 15,
}


def _as_list(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def _count_signal(value):
    if isinstance(value, (list, tuple, set)):
        return len(value)
    if isinstance(value, int):
        return value
    return 0


def _score_industry_match(enriched_data, icp_config):
    actual = enriched_data.get("industry")
    targets = [t.strip().lower() for t in _as_list(icp_config.get("industry"))]
    if not actual or not targets:
        return 0
    return 10 if actual.strip().lower() in targets else 0


def _score_headcount_range(enriched_data, icp_config):
    headcount = enriched_data.get("headcount")
    min_h = icp_config.get("headcount_min")
    max_h = icp_config.get("headcount_max")
    if headcount is None or min_h is None or max_h is None:
        return 0
    if min_h <= headcount <= max_h:
        return 10
    span = max(max_h - min_h, 1)
    distance = (min_h - headcount) if headcount < min_h else (headcount - max_h)
    return round(max(10 * (1 - distance / span), 0), 1)


def _score_funding_stage(enriched_data, icp_config):
    actual = enriched_data.get("funding_stage")
    targets = [t.strip().lower() for t in _as_list(icp_config.get("target_funding_stages"))]
    if not actual or not targets:
        return 0
    return 10 if actual.strip().lower() in targets else 0


def _score_tech_stack_signals(enriched_data, icp_config):
    target_tech = {t.strip().lower() for t in _as_list(icp_config.get("target_tech_stack"))}
    actual_tech = {t.strip().lower() for t in _as_list(enriched_data.get("tech_stack"))}
    if not target_tech or not actual_tech:
        return 0
    matches = target_tech & actual_tech
    return round(min(10, (len(matches) / len(target_tech)) * 10), 1)


def _score_gtm_hiring_activity(enriched_data, icp_config):
    total = _count_signal(enriched_data.get("gtm_hires")) + _count_signal(
        enriched_data.get("sales_job_postings")
    )
    threshold = icp_config.get("gtm_hiring_signal_threshold", 3)
    if threshold <= 0:
        return 0
    return round(min(10, (total / threshold) * 10), 1)


def _score_funding_recency(enriched_data, icp_config):
    funding_date = enriched_data.get("funding_date")
    if not funding_date:
        return 0
    try:
        parsed = datetime.fromisoformat(funding_date)
    except (ValueError, TypeError):
        return 0
    months_ago = (datetime.now() - parsed).days / 30
    window = icp_config.get("funding_recency_months", 12)
    if window <= 0:
        return 0
    if months_ago <= 0:
        return 10
    return round(max(10 * (1 - months_ago / window), 0), 1)


CRITERIA_SCORERS = {
    "industry_match": _score_industry_match,
    "headcount_range": _score_headcount_range,
    "funding_stage": _score_funding_stage,
    "tech_stack_signals": _score_tech_stack_signals,
    "gtm_hiring_activity": _score_gtm_hiring_activity,
    "funding_recency": _score_funding_recency,
}


def score_company(enriched_data, icp_config, fired_triggers, total_boost):
    """Score a company 0-100 against ICP criteria and apply trigger boosts.

    Each of the 6 criteria is scored 0-10 against icp_config, multiplied by
    its weight, and summed to a 0-100 base_score. total_boost is then added
    and the result capped at 100 for final_score.
    """
    weights = icp_config.get("icp_weights", DEFAULT_WEIGHTS)
    score_breakdown = {}
    base_score = 0.0

    for criterion, scorer in CRITERIA_SCORERS.items():
        raw_score = scorer(enriched_data, icp_config)
        weight = weights.get(criterion, DEFAULT_WEIGHTS[criterion])
        weighted_score = (raw_score / 10) * weight
        score_breakdown[criterion] = {
            "raw_score": raw_score,
            "weight": weight,
            "weighted_score": round(weighted_score, 1),
        }
        base_score += weighted_score

    base_score = round(base_score, 1)
    final_score = min(100, round(base_score + total_boost, 1))

    return {
        "base_score": base_score,
        "final_score": final_score,
        "score_breakdown": score_breakdown,
        "fired_triggers": fired_triggers,
        "total_boost": total_boost,
    }

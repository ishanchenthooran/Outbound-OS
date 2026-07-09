import json
import logging
import os

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

CLAUDE_MODEL = "claude-sonnet-4-6"

_client = None

SIGNALS_PROMPT = """Research the company "{company_name}" (domain: {domain}) \
using web search and return ONLY a single JSON object (no prose, no markdown \
fences) with exactly these keys:

{{
  "industry": string or null,
  "headcount_range": string or null,
  "hq_location": string or null,
  "funding_stage": string or null,
  "last_funding_round": {{"amount": string or null, "date": string or null}},
  "recent_gtm_sales_hires": [string, ...],
  "open_sales_job_postings": [string, ...],
  "recent_news": [string, ...]
}}

Guidance:
- "recent_gtm_sales_hires" should list GTM or sales leadership hires \
(e.g. VP Sales, Head of Growth, CRO) announced in the last 90 days.
- "open_sales_job_postings" should list open SDR/BDR/AE roles currently posted.
- "recent_news" should list product launches or notable news from the last 90 days.
- Use null or an empty list for anything you cannot find. Do not fabricate data.
"""


def _get_client():
    global _client
    if _client is None:
        _client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _client


def _extract_response_text(response):
    parts = []
    for block in response.content:
        if getattr(block, "type", None) == "text":
            parts.append(block.text)
    return "\n".join(parts).strip()


def _extract_json(text):
    if not text:
        return {}
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        return {}
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        logger.warning("Failed to parse JSON from Claude signals response")
        return {}


def enrich_techstack(domain):
    """Detect a domain's tech stack via python-Wappalyzer. Returns a list of
    detected technology names, or [] if detection fails."""
    try:
        from Wappalyzer import Wappalyzer, WebPage

        url = domain if domain.startswith("http") else f"https://{domain}"
        webpage = WebPage.new_from_url(url, timeout=10)
        wappalyzer = Wappalyzer.latest()
        detected = wappalyzer.analyze(webpage)
        return sorted(detected)
    except Exception:
        logger.exception("Tech stack enrichment failed for domain=%s", domain)
        return []


def enrich_signals(domain, company_name):
    """Use Claude (with web search) to research GTM/funding/hiring signals
    for a company. Returns a dict parsed from Claude's JSON response, or {}
    if the request or parsing fails."""
    try:
        client = _get_client()
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            tools=[{"type": "web_search_20250305", "name": "web_search"}],
            messages=[
                {
                    "role": "user",
                    "content": SIGNALS_PROMPT.format(
                        company_name=company_name, domain=domain
                    ),
                }
            ],
        )
    except Exception:
        logger.exception("Claude signal enrichment failed for domain=%s", domain)
        return {}

    text = _extract_response_text(response)
    return _extract_json(text)


def enrich_company(domain, company_name):
    """Combine tech stack and signal enrichment into a single dict shaped to
    match the Company model's fields. Always returns a dict, falling back to
    partial/empty data per-field rather than raising."""
    tech_stack = enrich_techstack(domain)
    signals = enrich_signals(domain, company_name)

    last_funding_round = signals.get("last_funding_round")
    if not isinstance(last_funding_round, dict):
        last_funding_round = {}

    raw_signals = {
        "hq_location": signals.get("hq_location"),
        "last_funding_round": last_funding_round,
        "recent_gtm_sales_hires": signals.get("recent_gtm_sales_hires") or [],
        "open_sales_job_postings": signals.get("open_sales_job_postings") or [],
        "recent_news": signals.get("recent_news") or [],
    }

    return {
        "domain": domain,
        "name": company_name,
        "tech_stack": tech_stack,
        "industry": signals.get("industry"),
        "headcount": signals.get("headcount_range"),
        "funding_stage": signals.get("funding_stage"),
        "funding_date": last_funding_round.get("date"),
        "raw_signals": raw_signals,
    }

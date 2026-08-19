import json
import logging
import os
import re

from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
TARGET_COMPANY_COUNT = 8

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _normalize_domain(domain: str) -> str:
    domain = domain.strip().lower()
    domain = re.sub(r"^www\.", "", domain)
    domain = domain.rstrip("/")
    return domain


def _extract_companies(text: str) -> list[dict]:
    best: list[dict] = []
    for match in re.finditer(r"\[.*?\]", text, re.DOTALL):
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            continue
        if not isinstance(parsed, list):
            continue
        companies = [
            {"name": item["name"], "domain": _normalize_domain(item["domain"])}
            for item in parsed
            if isinstance(item, dict) and "name" in item and "domain" in item
        ]
        if len(companies) > len(best):
            best = companies
    return best


async def discover_companies(icp_config: dict) -> list[dict]:
    tech_stack_signals = icp_config.get("tech_stack_signals")
    if isinstance(tech_stack_signals, (list, tuple)):
        tech_stack_signals = ", ".join(str(s) for s in tech_stack_signals)

    prompt = (
        "Given this ideal customer profile (ICP), find "
        f"{TARGET_COMPANY_COUNT} real companies that match it as closely "
        "as possible.\n\n"
        f"Industry: {icp_config.get('industry')}\n"
        f"Headcount range: {icp_config.get('headcount_min')} to "
        f"{icp_config.get('headcount_max')}\n"
        f"Funding stage: {icp_config.get('funding_stage')}\n"
        f"Geography: {icp_config.get('geography')}\n"
        f"Tech stack signals: {tech_stack_signals}\n\n"
        "Return only a JSON array of objects, each with a \"name\" field "
        "and a \"domain\" field. No explanation, no markdown code fences, "
        "just the JSON array."
    )

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=2048,
            tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}],
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception:
        logger.exception("Claude company discovery failed")
        return []

    text = "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    )

    return _extract_companies(text)[:TARGET_COMPANY_COUNT]

import os

from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

MODEL = "claude-sonnet-4-6"

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

ELECTRIC_MIND_PARAGRAPH = (
    "At Electric Mind (SWE) I built a webhook driven data integration "
    "service syncing enterprise fleet management platforms via APIs, "
    "achieving reliable sync across both platforms. I also built an "
    "agentic system that used semantic search to surface insights from "
    "past client engagements, cutting early stage consulting research "
    "from a week to 1 to 2 days."
)

TD_BANK_PARAGRAPH = (
    "At TD Bank (Data Eng) I built the ETL pipelines to ingest and "
    "transform telemetry data, implemented K Means clustering to surface "
    "usage patterns that informed leadership's strategy for a dept wide "
    "platform migration, and cut dataset load time by 60%."
)

SYSTEM_PROMPT = (
    "You are drafting a cold outreach email on behalf of Ishan "
    "Chenthooran, a third year Systems Design Engineering student at "
    "the University of Waterloo, who is looking for a Fall 2026 GTM "
    "engineering internship. You will be given data about a company "
    "and must fill in the bracketed sections of a fixed email template. "
    "You must reproduce the template exactly as given, including the "
    "two paragraphs describing Ishan's Electric Mind and TD Bank "
    "experience, verbatim, word for word, with no changes. Only the "
    "bracketed sections may be written by you.\n\n"
    "Rules for the sections you write:\n"
    "- Hook (1-2 sentences): what this company is building and why it "
    "is a sharp bet. Human and genuine, no AI buzzwords or jargon.\n"
    "- Contribution paragraph (2-3 sentences): a stage aware assumption "
    "about where the company is right now based on its signals, and a "
    "specific claim about what Ishan would build for them. Frame it as "
    "'here is what I would contribute', never as 'here is what you "
    "need'.\n"
    "- Closing line (1 sentence): specific to this company.\n"
    "- Never use a hyphen character anywhere in the sections you write. "
    "Use commas, periods, or 'and' instead.\n\n"
    "Return only the complete email as plain text, nothing else, no "
    "commentary, no markdown formatting."
)


def _build_prompt(company_data: dict) -> str:
    name = company_data.get("name", "the company")
    domain = company_data.get("domain", "")
    industry = company_data.get("industry", "unknown")
    funding_stage = company_data.get("funding_stage", "unknown")
    signals = company_data.get("signals", company_data.get("recent_signals", []))
    fired_triggers = company_data.get("fired_triggers", [])
    score = company_data.get("score", company_data.get("final_score", "unknown"))

    return (
        f"Company name: {name}\n"
        f"Domain: {domain}\n"
        f"Industry: {industry}\n"
        f"Funding stage: {funding_stage}\n"
        f"Recent signals: {signals}\n"
        f"Fired triggers: {fired_triggers}\n"
        f"ICP score: {score}\n\n"
        "Template to fill in (replace only the bracketed sections, keep "
        "everything else exactly as written):\n\n"
        f"Hey {name} team!\n\n"
        "I'm Ishan, a Systems Design Engineering student @ UWaterloo.\n\n"
        "[Hook]\n\n"
        "[Contribution paragraph]\n\n"
        f"{ELECTRIC_MIND_PARAGRAPH}\n\n"
        f"{TD_BANK_PARAGRAPH}\n\n"
        "[Closing line specific to this company.] I am currently looking "
        "for a Fall 2026 internship and the GTM engineering work here is "
        "exactly what I want to be doing, would love to chat about "
        "contributing in that direction!\n\n"
        "Thanks!\n"
        "Ishan"
    )


async def draft_email(company_data: dict) -> str:
    prompt = _build_prompt(company_data)

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception:
        return ""

    return "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    ).strip()

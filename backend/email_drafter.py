import os

from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

MODEL = "claude-sonnet-4-6"

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

ELECTRIC_MIND_PARAGRAPH = (
    "At Electric Mind (SWE) I built an agentic system that used semantic "
    "search to surface insights from past client engagements, cutting "
    "early stage consulting research from a week to 1 to 2 days."
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
    "- Hook (1-2 sentences): open like 'I just read about {company} and "
    "...', naming a specific real signal from the data given (funding, "
    "acquisition, launch, hire) and why it matters. Human and genuine, "
    "no AI buzzwords or jargon, should sound like someone who actually "
    "looked into the company.\n"
    "- Contribution paragraph (2-3 sentences): a stage aware guess at "
    "what's actually hard for this company right now, ideally framed as "
    "a contrast, for example 'the hard part isn't X anymore, it's Y'. "
    "Then say something like 'That's exactly where I'd want to "
    "contribute' followed by one or two concrete, specific things Ishan "
    "would build. Never frame it as 'here is what you need', always "
    "'here is what I would build'.\n"
    "- Closing paragraph (2-3 sentences): one flowing paragraph that "
    "ties back to something specific about this company, says this "
    "feels like the moment the work matters, and ends by saying, in "
    "first person as Ishan speaking directly ('I'd love to...', never "
    "'Ishan would love to...' or any third person reference to "
    "himself), that he would love to chat about what their most "
    "pressing challenges are right now and how he could contribute. Do "
    "not mention looking for a Fall 2026 internship or any job search "
    "language here, that is handled elsewhere. This should read as one "
    "genuine paragraph, not "
    "two sentences stitched together.\n"
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
        "[Closing paragraph, ending with wanting to chat about their "
        "most pressing challenges and how Ishan could contribute.]\n\n"
        "Thanks!\n"
        "Ishan\n"
        "LinkedIn | GitHub"
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

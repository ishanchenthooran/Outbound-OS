# Outbound OS — Design Decisions

## Orchestration: Raw Python + asyncio
Options: LangChain, LangGraph, raw Python
Decision: Raw Python + asyncio
Rationale: Every orchestration decision 
is visible and defensible. No framework 
abstractions hiding the mechanics. 
Parallelism in enrichment stage is explicit 
asyncio.gather(), not a black box.
Tradeoff: Manual state management vs 
framework abstractions. Acceptable at 
this scale.

## Enrichment: Claude web search only
Options: Clearbit API, Apollo, Clay, 
Claude web search
Decision: Claude web search exclusively
Rationale: Clearbit deprecated free tier 
post-HubSpot acquisition. Apollo account 
IP banned. Clay is too expensive for a 
demo build. Claude web search covers 
company fundamentals, funding signals, 
hiring activity, and news in one call 
with no additional API keys.
Tradeoff: Less structured output than 
a purpose-built enrichment API. 
Mitigated by careful prompt engineering 
and JSON output instructions.

## Database: SQLite
Options: PostgreSQL, MongoDB, SQLite
Decision: SQLite
Rationale: Zero setup, single file, 
enough for demo scale. FastAPI + 
SQLAlchemy makes it trivially swappable 
to Postgres later.
Tradeoff: Not production-grade for 
concurrent writes. Acceptable for 
a single-user demo tool.

## Discovery: Claude web search
Options: Apollo API, LinkedIn scraping, 
Crunchbase API, Claude web search
Decision: Claude web search
Rationale: Apollo is IP banned. 
LinkedIn scraping is brittle. 
Crunchbase free tier is too limited. 
Claude with web search can find 
ICP-matching companies from a natural 
language description and return clean 
structured output.
Tradeoff: Less deterministic than 
a database lookup. Mitigated by 
explicit output format instructions.

## Frontend: React + Tailwind via Vite
Options: Streamlit, vanilla HTML, React
Decision: React + Tailwind
Rationale: Demo video is the whole point. 
React produces a UI that looks like a 
real product, not a data science 
prototype. Tailwind handles styling fast. 
Vite makes setup trivial.
Tradeoff: More setup than Streamlit. 
Worth it for demo quality.
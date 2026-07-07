# Decisions

Record of notable architectural and product decisions, newest first.

## Format
Each entry: date, decision, why, alternatives considered (if any).

---

## 2026-07-07 — Project scaffolding
- Backend: FastAPI + SQLAlchemy/SQLite. Frontend: React + Tailwind/Vite.
- AI provider: Anthropic Claude API (`claude-sonnet-4-6`), fixed model,
  web search tool enabled on all discovery/enrichment calls.
- Enrichment sources: Clearbit free tier + Wappalyzer (no paid enrichment
  vendors at this stage).
- ICP score threshold defaults to 70; trigger boosts are additive.
- Email template is fixed; Claude only generates the hook and
  contribution paragraphs.

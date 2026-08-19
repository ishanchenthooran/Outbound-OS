# Changelog

## [Unreleased]

### Added
- python-dateutil added to requirements.txt (fallback date parsing for
  funding recency scoring)

### Changed
- main.py: companies scoring below `score_threshold` no longer proceed to
  email_drafter.py; they stay at `STATUS_SCORED` instead of `email_ready`
- enrichment.py: `SIGNALS_PROMPT` now requires ISO (`YYYY-MM-DD`) dates and a
  fixed lowercase `funding_stage` enum, and adds a new `social_signals`
  field (recent founder/company tweets, LinkedIn posts, or public
  statements)
- email_drafter.py: system prompt instructs Claude to use `social_signals`,
  when present, to make the hook hyper-specific; email template now ends
  with a PS line linking to the project's GitHub repo
- discovery.py / enrichment.py: web_search tool calls capped at
  `max_uses: 3`
- discovery.py: `max_tokens` reduced from 8192 to 2048 (discovery only
  needs a short JSON array, not a long response)
- frontend/PipelineTab: "Series C+" renamed to "Series C" in the funding
  stage selector; Reset now requires confirmation before deleting leads

### Fixed
- discovery.py: log exceptions from the Claude discovery call instead of
  failing silently
- discovery.py: normalize discovered domains (lowercase, strip `www.` and
  trailing slashes) so dedup and lookups aren't broken by inconsistent
  formatting
- scoring.py: `_score_industry_match` now does substring/synonym matching
  instead of exact token intersection, so e.g. a "SaaS" ICP matches
  "software" or "cloud" enriched industries
- scoring.py: `_score_funding_stage` normalizes punctuation/case on both
  sides and expands "series c+" to match series c, series d, or growth
- scoring.py: `_score_funding_recency` falls back to
  `dateutil.parser.parse` for natural-language dates (e.g. "March 2026")
  that aren't valid ISO strings
- main.py: `_parse_headcount` caps the upper bound of a parsed range at
  10000 to avoid skewed averages from ranges like "50-10,000+ employees"
- main.py: `_save_email` only marks a company `email_ready` when a
  non-empty draft was actually generated
- main.py: `get_triggers()` is now read once per pipeline run instead of
  once per company being scored
- frontend/PipelineTab: pipeline-complete detection now scopes to
  companies added in the current run instead of comparing against
  all-time totals, so it correctly waits on new companies even when older
  ones remain at `scored` (skipped by threshold) rather than `email_ready`

## [Phase 4 - Integration - Complete]
Changed
- enrichment.py: switched signal research from claude-sonnet-4-6 to
  claude-haiku-4-5 for cost/speed since it runs concurrently across
  every discovered company
- discovery.py: capped discovery at 8 companies per run

## [Phase 3 - Frontend - Complete]
Added
- App.jsx shell with Pipeline / Leads / Triggers tab navigation
- PipelineTab: ICP config form, run pipeline, live status polling,
  reset
- LeadsTab: filterable/searchable lead cards, score breakdown +
  fired triggers + drafted email side panel, copy to clipboard
- TriggersTab: list, add, edit, toggle active buying-signal triggers
- api.js: fetch wrapper for all backend routes

## [Phase 2 - API layer - Complete]
Added
- main.py: FastAPI app with lifespan DB init, CORS for
  localhost:5173
- POST /api/pipeline/run, GET /api/pipeline/status
- GET /api/leads, GET /api/leads/{id}, PATCH /api/leads/{id}/status,
  DELETE /api/leads
- GET/POST /api/triggers, PATCH /api/triggers/{id}
- run_pipeline background task: discovery → enrichment → scoring →
  email draft, persisted to SQLite after each stage

## [Phase 1 - Backend core - Complete]
Added
- models.py: SQLAlchemy Company model + SQLite setup
- discovery.py: Claude web search company discovery
- enrichment.py: Wappalyzer + Claude web search signal enrichment
- scoring.py: weighted 0-100 ICP scoring engine
- triggers.py: keyword-based buying signal detection, config-driven
- email_drafter.py: Claude email generation using a fixed template

## [Phase 0 - Complete]
Added
- GitHub repo: ishanchenthooran/outbound-os
- Project structure: backend/ and frontend/
- CLAUDE.md project bible
- ARCHITECTURE.md system design
- AGENTS.md agent contracts and state 
  ownership map
- DECISIONS.md design decision log
- CHANGELOG.md
- requirements.txt
- .env with ANTHROPIC_API_KEY
- config.json (ICP weights + trigger 
  definitions)
- Empty backend module files
- React + Tailwind frontend scaffolded 
  via Vite

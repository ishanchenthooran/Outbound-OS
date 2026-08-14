# Changelog

## [Unreleased]

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

## Up Next: Phase 1
- models.py: SQLAlchemy Company model
- enrichment.py: Wappalyzer + Claude 
  web search enrichment
- scoring.py: weighted ICP scoring engine
- triggers.py: buying signal keyword 
  detection
- discovery.py: Claude web search 
  company discovery
- email_drafter.py: Claude email generation
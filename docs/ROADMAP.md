Phase 0 — Foundation (done)
Repo, project structure, CLAUDE.md, ARCHITECTURE.md, AGENTS.md, DECISIONS.md, CHANGELOG.md, requirements.txt, .env, config.json, React frontend scaffolded.

Phase 1 — Backend core (3 parallel agents)

models.py: SQLAlchemy Company model + SQLite setup
enrichment.py: Wappalyzer + Claude web search enrichment
scoring.py: weighted ICP scoring + triggers.py: buying signal detection
discovery.py: Claude web search company discovery
email_drafter.py: Claude email generation using fixed template


Phase 2 — API layer (1 agent)

main.py: all FastAPI routes wiring Phase 1 modules together
Background task pipeline: discovery → enrichment → scoring → email draft
CORS, startup DB creation, pipeline status endpoint


Phase 3 — Frontend (2 parallel agents)

App shell + Triggers tab + api.js
Pipeline tab + Leads tab


Phase 4 — Integration

Boot backend and frontend together
Run full pipeline end to end against real target companies
Fix anything broken


Phase 5 — Polish + demo

UI polish pass
90 second Loom recording
README with what it does and why you built it
Start referencing in emails
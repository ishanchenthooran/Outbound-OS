Phase 0 — Foundation (done)
Repo, project structure, CLAUDE.md, ARCHITECTURE.md, AGENTS.md, DECISIONS.md, CHANGELOG.md, requirements.txt, .env, config.json, React frontend scaffolded.

Phase 1 — Backend core (done)

models.py: SQLAlchemy Company model + SQLite setup
enrichment.py: Wappalyzer + Claude web search enrichment
scoring.py: weighted ICP scoring + triggers.py: buying signal detection
discovery.py: Claude web search company discovery
email_drafter.py: Claude email generation using fixed template


Phase 2 — API layer (done)

main.py: all FastAPI routes wiring Phase 1 modules together
Background task pipeline: discovery → enrichment → scoring → email draft
CORS, startup DB creation, pipeline status endpoint


Phase 3 — Frontend (done)

App shell + Triggers tab + api.js
Pipeline tab + Leads tab


Phase 4 — Integration (done)

Boot backend and frontend together
Run full pipeline end to end against real target companies — verified with
a saved run of 20 companies through email_ready in db.sqlite3
Fix anything broken — enrichment switched to claude-haiku-4-5 and discovery
capped at 8 companies per run (see DECISIONS.md)


Phase 5 — Polish + demo (in progress)

UI polish pass
90 second Loom recording
README with what it does and why you built it
Start referencing in emails
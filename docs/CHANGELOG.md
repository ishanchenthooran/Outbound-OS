# Changelog

## [Unreleased]

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
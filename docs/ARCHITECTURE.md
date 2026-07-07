# Architecture

## Overview
GTM Signal Intelligence Engine takes an ICP as input, discovers matching
companies, enriches them with funding/tech stack/hiring signals, detects
buying triggers, scores each company 0-100, and drafts a personalized cold
email per company.

## Stack
- Backend: Python FastAPI, SQLite via SQLAlchemy
- Frontend: React + Tailwind via Vite
- AI: Anthropic Claude API (claude-sonnet-4-6) with web search tool for
  discovery, enrichment signals, and email drafting
- Enrichment: Clearbit API free tier for company fundamentals, Wappalyzer
  Python library for tech stack detection

## Pipeline flow
1. `discovery.py` — Claude web search finds companies matching the ICP.
2. `enrichment.py` — Clearbit + Wappalyzer + Claude web search enrich each
   company with fundamentals, tech stack, and hiring signals.
3. `triggers.py` — detects buying signals per company.
4. `scoring.py` — weighted ICP scoring engine (0-100) with additive
   trigger score boosts.
5. `email_drafter.py` — Claude drafts a personalized cold email per
   company using the fixed template.

## Project structure
```
backend/
  main.py        FastAPI app, all routes
  models.py      SQLAlchemy models + SQLite setup
  enrichment.py  Clearbit + Wappalyzer + Claude web search enrichment
  scoring.py     ICP scoring engine, 0-100, weighted criteria + trigger boosts
  discovery.py   Claude web search company discovery
  triggers.py    Buying signal detection per company
  email_drafter.py  Claude email generation
  config.json    Default ICP weights and trigger config

frontend/src/
  App.jsx           Root, tab routing
  components/
    PipelineTab.jsx  ICP form + run button + status
    LeadsTab.jsx     Leads table + expand to email
    TriggersTab.jsx  Trigger config table
```

## Ports & networking
- Backend runs on port 8000
- Frontend proxies `/api` to `localhost:8000`

## Data
- All DB operations go through `models.py` (SQLAlchemy + SQLite).

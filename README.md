# Outbound OS

An AI-native GTM prospect intelligence engine. Define your ICP, and Outbound OS discovers matching companies, enriches them with funding and hiring signals, scores them against your criteria, detects buying triggers, and drafts a personalized cold email per company — ready to review and send.

## What it does

**Discovery** — Claude web searches for companies matching your ICP across industry, headcount, funding stage, geography, and tech stack signals.

**Enrichment** — For each company, pulls tech stack via Wappalyzer and researches funding rounds, GTM leadership hires, open sales job postings, and recent news via Claude web search.

**Scoring** — Each company gets a 0–100 ICP fit score based on six weighted criteria: industry match, headcount range, funding stage, tech stack signals, GTM hiring activity, and funding recency.

**Trigger detection** — Configurable buying signal triggers (recent funding round, new VP of Sales, SDR hiring, competitor acquired) stack score boosts on top of the base score.

**Email drafting** — Claude generates a fully personalized cold email per company using a fixed template, filling in a stage-aware hook and contribution paragraph based on enriched signals.

## Stack

- **Backend:** Python, FastAPI, SQLite, SQLAlchemy
- **AI:** Anthropic Claude (claude-sonnet-4-6) with web search for discovery, enrichment, and email drafting
- **Tech stack detection:** Wappalyzer
- **Frontend:** React, Tailwind CSS, Vite

## Project structure

outbound-os/
├── backend/
│ ├── main.py # FastAPI app, all routes
│ ├── models.py # SQLAlchemy Company model
│ ├── discovery.py # Claude web search discovery
│ ├── enrichment.py # Wappalyzer + Claude enrichment
│ ├── scoring.py # Weighted ICP scoring engine
│ ├── triggers.py # Buying signal detection
│ ├── email_drafter.py # Claude email generation
│ └── config.json # ICP weights + trigger config
└── frontend/ # React + Tailwind dashboard

## Getting started

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # add your ANTHROPIC_API_KEY
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Backend runs on `localhost:8000`, frontend on `localhost:5173`.

## API routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/pipeline/run` | Run full pipeline with ICP config |
| GET | `/api/pipeline/status` | Status counts per pipeline stage |
| GET | `/api/leads` | All leads ordered by score |
| GET | `/api/leads/{id}` | Single lead with email draft |
| PATCH | `/api/leads/{id}/status` | Update lead status |
| DELETE | `/api/leads` | Clear all leads |
| GET | `/api/triggers` | List trigger definitions |
| POST | `/api/triggers` | Add trigger |
| PATCH | `/api/triggers/{id}` | Update trigger |

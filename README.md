# Outbound OS

An AI-native GTM prospect intelligence engine. Define your ICP, and Outbound OS discovers matching companies, enriches them with funding and hiring signals, scores them against your criteria, detects buying triggers, and drafts a personalized cold email per company that's ready to review and send.

<img width="1274" height="689" alt="image" src="https://github.com/user-attachments/assets/e091f139-2789-432a-9462-418603a1aa98" />
<img width="1264" height="692" alt="image" src="https://github.com/user-attachments/assets/094588b7-79b4-4d22-b6bb-9679b02c0952" />

## What it does

**Discovery**: Claude web searches for companies matching your ICP across industry, headcount, funding stage, geography, and tech stack signals.

**Enrichment**: For each company, pulls tech stack via Wappalyzer and researches funding rounds, GTM leadership hires, open sales job postings, and recent news via Claude web search.

**Scoring**: Each company gets a 0–100 ICP fit score based on six weighted criteria: industry match, headcount range, funding stage, tech stack signals, GTM hiring activity, and funding recency.

**Trigger detection**: Configurable buying signal triggers (recent funding round, new VP of Sales, SDR hiring, competitor acquired) stack score boosts on top of the base score.

**Email drafting**: Claude generates a fully personalized cold email per company using a fixed template, filling in a stage-aware hook and contribution paragraph based on enriched signals.

## Stack

- **Backend:** Python, FastAPI, SQLite, SQLAlchemy
- **AI:** Anthropic Claude with web search — `claude-sonnet-4-6` for discovery and email drafting, `claude-haiku-4-5` for enrichment (cost/speed tradeoff, ran across many companies concurrently)
- **Tech stack detection:** Wappalyzer
- **Frontend:** React, Tailwind CSS, Vite

## Project structure

```text
outbound-os/
├── docs/
│   ├── ARCHITECTURE.md      # Pipeline design and module boundaries
│   ├── AGENTS.md            # Module contracts and state ownership map
│   └── DECISIONS.md         # Key design decisions and tradeoffs
│
├── backend/
│   ├── main.py              # FastAPI app, all routes, pipeline orchestration
│   ├── models.py            # SQLAlchemy Company model, DB setup
│   ├── discovery.py         # Claude web search company discovery
│   ├── enrichment.py        # Wappalyzer + Claude signal enrichment
│   ├── scoring.py           # Weighted ICP scoring engine
│   ├── triggers.py          # Buying signal keyword detection
│   ├── email_drafter.py     # Claude email generation
│   ├── config.json          # ICP weights and trigger definitions
│   └── requirements.txt
│
└── frontend/                # React + Tailwind dashboard
```

## Getting started

**Backend**
```bash
pip install -r requirements.txt   # from repo root
```
Create a `.env` in the repo root with `ANTHROPIC_API_KEY=<your key>` (loaded
automatically via `python-dotenv`, which walks up from `backend/`).
```bash
cd backend
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

# GTM Signal Intelligence Engine

## What this is
A GTM prospect intelligence tool. Input an ICP, 
the tool discovers matching companies, enriches them 
with funding/tech stack/hiring signals, detects buying 
triggers, scores each company 0-100, and drafts a 
personalized cold email per company.

## Stack
- Backend: Python FastAPI, SQLite via SQLAlchemy
- Frontend: React + Tailwind via Vite
- AI: Anthropic Claude API (claude-sonnet-4-6) 
  with web search tool for discovery, 
  enrichment signals, and email drafting
- Enrichment: Clearbit API free tier for 
  company fundamentals, Wappalyzer Python 
  library for tech stack detection

## Project structure
backend/
  main.py        FastAPI app, all routes
  models.py      SQLAlchemy models + SQLite setup
  enrichment.py  Clearbit + Wappalyzer + Claude 
                 web search enrichment
  scoring.py     ICP scoring engine, 0-100, 
                 weighted criteria + trigger boosts
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

## Environment variables (in .env)
ANTHROPIC_API_KEY=
CLEARBIT_API_KEY=

## Key rules
- Backend runs on port 8000
- Frontend proxies /api to localhost:8000
- All DB operations go through models.py
- Never hardcode API keys
- Claude model is always claude-sonnet-4-6
- Web search tool enabled on all Claude 
  discovery and enrichment calls
- ICP score threshold default is 70
- Trigger score boosts are additive to base score
- Email template is defined in email_drafter.py 
  as a constant, Claude fills in hook and 
  contribution paragraph only

## Email template (fixed, never modify)
Hey [Company] team!
I'm Ishan, a Systems Design Engineering 
student @ UWaterloo.

[Hook paragraph]

[Contribution paragraph]

At Electric Mind (SWE) I built a webhook driven 
data integration service syncing enterprise fleet 
management platforms via APIs, achieving reliable 
sync across both platforms. I also built an agentic 
system that used semantic search to surface insights 
from past client engagements, cutting early-stage 
consulting research from a week to 1 to 2 days.

At TD Bank (Data Eng) I built the ETL pipelines 
to ingest and transform telemetry data, implemented 
K-Means clustering to surface usage patterns that 
informed leadership's strategy for a dept-wide 
platform migration, and cut dataset load time by 60%.

[Closing line]. I'm currently looking for a Fall 
2026 internship and the GTM engineering work here 
is exactly what I want to be doing, would love to 
chat about contributing in that direction!

Thanks!
Ishan
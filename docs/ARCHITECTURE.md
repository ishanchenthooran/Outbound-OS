# Outbound OS — Architecture

## System Overview
Outbound OS is a linear four-stage pipeline 
orchestrated in raw Python with asyncio. A single 
PipelineState object flows through each stage 
sequentially. No frameworks — every orchestration 
decision is explicit and inspectable.

## Pipeline Stages

ICP Config (input)
       ↓
Discovery Agent
  - Reads: icp_config
  - Writes: raw_companies (list of name + domain)
  - How: Claude API with web search
       ↓
Enrichment Agent  ← runs concurrently across companies
  - Reads: raw_companies
  - Writes: enriched_companies
    (fundamentals, tech_stack, signals, news)
  - How: Wappalyzer for tech stack, 
         Claude web search for everything else
       ↓
Scoring + Trigger Agent
  - Reads: enriched_companies, trigger_config
  - Writes: scored_companies
    (base_score, trigger_boosts, final_score, 
     score_breakdown, fired_triggers)
  - How: Pure Python weighted scoring, 
         keyword matching for triggers
       ↓
Email Drafter Agent
  - Reads: scored_companies, email_template
  - Writes: email_draft per company
  - How: Claude API, fixed template, 
         Claude fills hook + contribution paragraph
       ↓
SQLite DB (persisted after each stage)
       ↓
FastAPI (reads from DB, serves frontend)
       ↓
React Frontend (Pipeline / Leads / Triggers tabs)

## State Flow
PipelineState is a single dataclass passed 
explicitly between stages. Each stage reads 
from specific fields and writes only to its 
designated output fields. No shared memory, 
no side effects.

Discovery      → writes: raw_companies
Enrichment     → writes: enriched_companies
Scoring        → writes: scored_companies
Email Drafter  → writes: email_drafts

## Parallelism
Enrichment stage only. asyncio.gather() runs 
enrichment concurrently across all discovered 
companies. All other stages are sequential.

## Data Persistence
SQLite via SQLAlchemy. Company records saved 
after enrichment, updated after scoring, 
updated after email drafting. Pipeline can 
resume from last saved state if interrupted.

## API Layer
FastAPI on port 8000. CORS enabled for 
localhost:5173. Frontend never reads from 
DB directly, always via API routes.

## Key Boundaries
- discovery.py only writes raw_companies
- enrichment.py only writes enriched_companies  
- scoring.py only writes scores and trigger results
- email_drafter.py only writes email_draft
- models.py owns all DB operations
- main.py owns all API routes
- config.json owns ICP weights and trigger definitions
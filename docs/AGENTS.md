# Outbound OS — Agent Contracts

## Rules Every Module Must Follow
- Every module loads env vars via python-dotenv
- Never hardcode API keys
- Every module only writes to its designated 
  state fields
- Claude model is always claude-sonnet-4-6
- Web search tool enabled on all Claude calls
- Handle API failures gracefully, return partial 
  data rather than crashing

## Module Contracts

### discovery.py
Reads: icp_config (dict)
Writes: raw_companies (list of {name, domain})
Dependency: Anthropic API with web search
Responsibility: Given an ICP definition, find 
20 real matching companies and return their 
names and domains.

### enrichment.py
Reads: domain, company_name (per company)
Writes: enriched_company (dict with 
fundamentals, tech_stack, signals, news)
Dependencies: Wappalyzer, Anthropic API 
with web search
Responsibility: For each company, gather 
industry, headcount, funding stage, funding 
date, tech stack, recent GTM hires, open 
sales job postings, and recent news.

### scoring.py
Reads: enriched_company, icp_config, 
trigger_config
Writes: base_score, score_breakdown, 
fired_triggers, trigger_boost, final_score
Dependencies: None (pure Python)
Responsibility: Score each company 0-100 
against ICP criteria, detect fired triggers, 
apply boosts, return full breakdown.

### triggers.py
Reads: raw_signals text, trigger_config
Writes: fired_triggers list, total_boost
Dependencies: None (keyword matching)
Responsibility: Scan enriched signal text 
for trigger keywords, return which triggers 
fired and total score boost.

### email_drafter.py
Reads: enriched + scored company data
Writes: email_draft (complete email string)
Dependency: Anthropic API
Responsibility: Use fixed email template, 
prompt Claude to fill hook and contribution 
paragraph based on company signals. Preserve 
Electric Mind and TD Bank paragraphs verbatim.

### models.py
Reads: nothing from pipeline state
Writes: all DB operations
Dependency: SQLAlchemy, SQLite
Responsibility: Define Company model, 
expose CRUD functions used by main.py.

## State Ownership Map
Field               Owner
raw_companies       discovery.py
enriched_companies  enrichment.py
base_score          scoring.py
fired_triggers      triggers.py
email_draft         email_drafter.py
DB persistence      models.py
API routes          main.py
ICP + trigger cfg   config.json
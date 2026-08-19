# Outbound OS: Agent Contracts

## Rules Every Module Must Follow
- Every module loads env vars via python-dotenv
- Never hardcode API keys
- Every module only writes to its designated 
  state fields
- Claude model: claude-sonnet-4-6 for discovery.py and email_drafter.py,
  claude-haiku-4-5 for enrichment.py's signal research (swapped from
  sonnet for cost/speed since it runs concurrently per company)
- Web search tool enabled on all Claude calls, 
  capped at max_uses: 3
- Handle API failures gracefully, log the 
  exception, and return partial data rather 
  than crashing

## Module Contracts

### discovery.py
Reads: icp_config (dict)
Writes: raw_companies (list of {name, domain})
Dependency: Anthropic API with web search
Responsibility: Given an ICP definition, find 
8 real matching companies and return their 
names and normalized domains (lowercase, no 
www. prefix or trailing slash).

### enrichment.py
Reads: domain, company_name (per company)
Writes: enriched_company (dict with 
fundamentals, tech_stack, signals, news, 
social_signals)
Dependencies: Wappalyzer, Anthropic API 
with web search (claude-haiku-4-5)
Responsibility: For each company, gather 
industry, headcount, funding stage, funding 
date, tech stack, recent GTM hires, open 
sales job postings, recent news, and public 
social signals (founder/company tweets, 
LinkedIn posts, or statements). Funding 
stage and dates are constrained to a fixed 
lowercase enum and ISO format respectively.

### scoring.py
Reads: enriched_company, icp_config, 
trigger_config
Writes: base_score, score_breakdown, 
fired_triggers, trigger_boost, final_score
Dependencies: python-dateutil (fallback 
parsing for non-ISO funding dates); 
otherwise pure Python
Responsibility: Score each company 0-100 
against ICP criteria, detect fired triggers, 
apply boosts, return full breakdown. Industry, 
funding stage, and tech stack matching is 
substring/synonym aware rather than exact.

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
paragraph based on company signals, using 
social_signals for a hyper-specific hook when 
available. Preserve Electric Mind and TD Bank 
paragraphs verbatim. Only invoked by main.py 
for companies at or above score_threshold.

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
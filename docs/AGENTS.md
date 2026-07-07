# Agents

Claude model used throughout: `claude-sonnet-4-6`. Web search tool is
enabled on all Claude discovery and enrichment calls.

## Discovery agent
- File: `backend/discovery.py`
- Input: ICP definition
- Uses Claude with web search to find companies matching the ICP.
- Output: candidate company list passed to enrichment.

## Enrichment agent
- File: `backend/enrichment.py`
- Combines Clearbit (company fundamentals), Wappalyzer (tech stack), and
  Claude web search (hiring/funding/other signals) into a single company
  profile.

## Trigger detection agent
- File: `backend/triggers.py`
- Detects buying signals per company from enrichment data.
- Trigger score boosts are additive to the base ICP score.

## Scoring agent
- File: `backend/scoring.py`
- Weighted ICP scoring engine, 0-100 scale.
- Default qualification threshold: 70.

## Email drafting agent
- File: `backend/email_drafter.py`
- Template is a fixed constant (see CLAUDE.md) — Claude only fills in the
  hook paragraph, contribution paragraph, and closing line.
- Never modify the base template structure.

## Config
- `backend/config.json` holds default ICP weights and trigger config.

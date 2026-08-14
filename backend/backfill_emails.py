"""Draft emails for leads that already have a score but no email_draft,
without re-running discovery or enrichment. Only calls email_drafter.py
(plain Sonnet call, no web search) so it's the cheapest way to fill in
missing emails against data already in the DB.

Usage:
    python3 backfill_emails.py            # backfill all leads missing an email
    python3 backfill_emails.py --limit 5  # backfill only the top 5 by score
"""

import argparse
import asyncio

from email_drafter import draft_email
from models import STATUS_EMAIL_READY, STATUS_SCORED, Company, SessionLocal, create_tables


def _build_payload(record: Company) -> dict:
    return {
        "name": record.name,
        "domain": record.domain,
        "industry": record.industry,
        "funding_stage": record.funding_stage,
        "signals": record.raw_signals,
        "fired_triggers": record.fired_triggers,
        "score": record.final_score,
    }


async def backfill(limit: int | None) -> None:
    create_tables()
    db = SessionLocal()
    try:
        query = (
            db.query(Company)
            .filter(Company.status.in_([STATUS_SCORED, STATUS_EMAIL_READY]))
            .filter((Company.email_draft.is_(None)) | (Company.email_draft == ""))
            .order_by(Company.final_score.desc())
        )
        if limit:
            query = query.limit(limit)
        records = query.all()

        if not records:
            print("No leads missing an email draft.")
            return

        print(f"Drafting emails for {len(records)} lead(s)...")
        for record in records:
            email = await draft_email(_build_payload(record))
            if not email:
                print(f"  FAILED: {record.name} ({record.domain})")
                continue
            record.email_draft = email
            record.status = STATUS_EMAIL_READY
            db.commit()
            print(f"  OK: {record.name} ({record.domain})")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--limit", type=int, default=None, help="Max number of leads to draft (default: all missing)"
    )
    args = parser.parse_args()
    asyncio.run(backfill(args.limit))

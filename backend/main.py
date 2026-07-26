import asyncio
import json
import re
from contextlib import asynccontextmanager, contextmanager

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from discovery import discover_companies
from email_drafter import draft_email
from enrichment import enrich_company
from models import (
    STATUS_DISCOVERED,
    STATUS_EMAIL_READY,
    STATUS_ENRICHED,
    STATUS_SCORED,
    Company,
    SessionLocal,
    create_tables,
)
from scoring import score_company
from triggers import add_trigger, detect_triggers, get_triggers, update_trigger

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ICPConfig(BaseModel):
    industry: str
    headcount_min: int
    headcount_max: int
    funding_stage: str
    geography: str
    tech_stack_signals: str
    score_threshold: int = 70


class StatusUpdate(BaseModel):
    status: str


@contextmanager
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _company_to_dict(company: Company) -> dict:
    return {
        "id": company.id,
        "domain": company.domain,
        "name": company.name,
        "industry": company.industry,
        "headcount": company.headcount,
        "funding_stage": company.funding_stage,
        "funding_date": company.funding_date,
        "tech_stack": company.tech_stack,
        "raw_signals": company.raw_signals,
        "base_score": company.base_score,
        "trigger_boosts": company.trigger_boosts,
        "fired_triggers": company.fired_triggers,
        "final_score": company.final_score,
        "score_breakdown": company.score_breakdown,
        "email_draft": company.email_draft,
        "status": company.status,
        "created_at": company.created_at.isoformat() if company.created_at else None,
    }


def _parse_headcount(headcount_range):
    """scoring.py expects a numeric headcount; enrichment.py returns a range
    string like "51-200 employees". Estimate a single number from it."""
    if not headcount_range:
        return None
    numbers = [int(n) for n in re.findall(r"\d+", str(headcount_range))]
    if not numbers:
        return None
    sample = numbers[:2]
    return round(sum(sample) / len(sample))


async def _save_discovered(domain: str, name: str) -> None:
    with db_session() as db:
        existing = db.query(Company).filter(Company.domain == domain).first()
        if existing:
            existing.name = name
            existing.status = STATUS_DISCOVERED
        else:
            db.add(Company(domain=domain, name=name, status=STATUS_DISCOVERED))
        db.commit()


def _save_enriched(domain: str, enriched: dict) -> None:
    with db_session() as db:
        record = db.query(Company).filter(Company.domain == domain).first()
        if not record:
            return
        record.industry = enriched.get("industry")
        record.headcount = enriched.get("headcount")
        record.funding_stage = enriched.get("funding_stage")
        record.funding_date = enriched.get("funding_date")
        record.tech_stack = enriched.get("tech_stack")
        record.raw_signals = enriched.get("raw_signals")
        record.status = STATUS_ENRICHED
        db.commit()


def _score_one(domain: str, scoring_icp_config: dict) -> None:
    with db_session() as db:
        record = db.query(Company).filter(Company.domain == domain).first()
        if not record or record.status != STATUS_ENRICHED:
            return

        raw_signals = record.raw_signals or {}
        signal_text = json.dumps(raw_signals)
        fired_triggers, total_boost = detect_triggers(signal_text, get_triggers())

        enriched_data = {
            "industry": record.industry,
            "headcount": _parse_headcount(record.headcount),
            "funding_stage": record.funding_stage,
            "funding_date": record.funding_date,
            "tech_stack": record.tech_stack,
            "gtm_hires": raw_signals.get("recent_gtm_sales_hires") or [],
            "sales_job_postings": raw_signals.get("open_sales_job_postings") or [],
        }

        result = score_company(enriched_data, scoring_icp_config, fired_triggers, total_boost)

        record.base_score = result["base_score"]
        record.trigger_boosts = result["total_boost"]
        record.fired_triggers = result["fired_triggers"]
        record.final_score = result["final_score"]
        record.score_breakdown = result["score_breakdown"]
        record.status = STATUS_SCORED
        db.commit()


def _build_email_payload(domain: str):
    with db_session() as db:
        record = db.query(Company).filter(Company.domain == domain).first()
        if not record or record.status != STATUS_SCORED:
            return None
        return {
            "name": record.name,
            "domain": record.domain,
            "industry": record.industry,
            "funding_stage": record.funding_stage,
            "signals": record.raw_signals,
            "fired_triggers": record.fired_triggers,
            "score": record.final_score,
        }


def _save_email(domain: str, email_draft: str) -> None:
    with db_session() as db:
        record = db.query(Company).filter(Company.domain == domain).first()
        if not record:
            return
        record.email_draft = email_draft
        record.status = STATUS_EMAIL_READY
        db.commit()


async def run_pipeline(icp_config: dict) -> None:
    companies = await discover_companies(icp_config)

    domains: list[tuple[str, str]] = []
    for company in companies:
        domain = company.get("domain")
        name = company.get("name")
        if not domain or not name:
            continue
        await _save_discovered(domain, name)
        domains.append((domain, name))

    enriched_results = await asyncio.gather(
        *[asyncio.to_thread(enrich_company, domain, name) for domain, name in domains],
        return_exceptions=True,
    )

    for (domain, _name), enriched in zip(domains, enriched_results):
        if isinstance(enriched, Exception) or not enriched:
            continue
        _save_enriched(domain, enriched)

    tech_stack_signals = icp_config.get("tech_stack_signals") or ""
    target_tech_stack = [s.strip() for s in tech_stack_signals.split(",") if s.strip()]
    scoring_icp_config = {
        "industry": icp_config.get("industry"),
        "headcount_min": icp_config.get("headcount_min"),
        "headcount_max": icp_config.get("headcount_max"),
        "target_funding_stages": [icp_config.get("funding_stage")],
        "target_tech_stack": target_tech_stack,
    }

    for domain, _name in domains:
        _score_one(domain, scoring_icp_config)

    for domain, _name in domains:
        company_data = _build_email_payload(domain)
        if company_data is None:
            continue
        email_draft = await draft_email(company_data)
        _save_email(domain, email_draft)


@app.post("/api/pipeline/run")
async def run_pipeline_route(icp_config: ICPConfig, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_pipeline, icp_config.model_dump())
    return {"status": "started"}


@app.get("/api/pipeline/status")
def pipeline_status():
    with db_session() as db:
        counts = {
            status: db.query(Company).filter(Company.status == status).count()
            for status in (STATUS_DISCOVERED, STATUS_ENRICHED, STATUS_SCORED, STATUS_EMAIL_READY)
        }
        counts["total"] = db.query(Company).count()
        return counts


@app.get("/api/leads")
def list_leads():
    with db_session() as db:
        companies = (
            db.query(Company).order_by(Company.final_score.desc()).all()
        )
        return [_company_to_dict(c) for c in companies]


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: int):
    with db_session() as db:
        company = db.query(Company).filter(Company.id == lead_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Lead not found")
        return _company_to_dict(company)


@app.patch("/api/leads/{lead_id}/status")
def update_lead_status(lead_id: int, body: StatusUpdate):
    with db_session() as db:
        company = db.query(Company).filter(Company.id == lead_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Lead not found")
        company.status = body.status
        db.commit()
        db.refresh(company)
        return _company_to_dict(company)


@app.delete("/api/leads")
def delete_leads():
    with db_session() as db:
        deleted = db.query(Company).delete()
        db.commit()
        return {"deleted": deleted}


@app.get("/api/triggers")
def list_triggers():
    return get_triggers()


@app.post("/api/triggers")
def create_trigger(trigger: dict):
    return add_trigger(trigger)


@app.patch("/api/triggers/{trigger_id}")
def patch_trigger(trigger_id: str, updates: dict):
    return update_trigger(trigger_id, updates)

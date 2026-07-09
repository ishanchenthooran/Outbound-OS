import os

from dotenv import load_dotenv
from sqlalchemy import JSON, Column, DateTime, Float, Integer, String, Text, create_engine, func
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite3")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

STATUS_DISCOVERED = "discovered"
STATUS_ENRICHED = "enriched"
STATUS_SCORED = "scored"
STATUS_EMAIL_READY = "email_ready"


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    headcount = Column(String, nullable=True)
    funding_stage = Column(String, nullable=True)
    funding_date = Column(String, nullable=True)
    tech_stack = Column(JSON, nullable=True)
    raw_signals = Column(JSON, nullable=True)
    base_score = Column(Float, nullable=True)
    trigger_boosts = Column(JSON, nullable=True)
    fired_triggers = Column(JSON, nullable=True)
    final_score = Column(Float, nullable=True)
    score_breakdown = Column(JSON, nullable=True)
    email_draft = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=STATUS_DISCOVERED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

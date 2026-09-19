import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

# Normalize legacy postgres:// scheme to postgresql:// for SQLAlchemy 1.4/2.0+ compatibility
# (Frequently provided by cloud platforms such as Render, Heroku, Supabase, Neon, Railway)
database_url = settings.database_url
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Configure engine arguments based on database dialect
engine_kwargs = {}

if database_url.startswith("sqlite"):
    # SQLite requires check_same_thread=False for FastAPI concurrency
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production RDBMS (PostgreSQL): pool_pre_ping recycles stale connections safely
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(database_url, **engine_kwargs)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

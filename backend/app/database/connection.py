from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Create database engine
# connect_args={"check_same_thread": False} is required for SQLite in FastAPI
engine = create_engine(
    settings.database_url, connect_args={"check_same_thread": False}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

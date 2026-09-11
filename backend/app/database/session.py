from typing import Generator
from app.database.connection import SessionLocal

def get_db() -> Generator:
    """
    Dependency to get a database session.
    Yields a SQLAlchemy session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

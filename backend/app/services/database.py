"""
Database services and cache management utility module.
Provides helper functions for querying cached telemetry, cache maintenance,
and database session management.
"""
import logging
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy.orm import Session
from app.database.session import get_db, SessionLocal
from app.models.weather import WeatherCache
from app.models.train import TrainCache
from app.models.prediction import PredictionHistory

logger = logging.getLogger(__name__)


def get_db_session() -> Generator[Session, None, None]:
    """
    Yields an active database session and ensures cleanup upon completion.
    """
    yield from get_db()


def clean_expired_caches(db: Session) -> int:
    """
    Purges expired weather and train cache records from the database.
    
    Args:
        db (Session): Active database session.
        
    Returns:
        int: Total number of purged records.
    """
    now = datetime.now(timezone.utc)
    try:
        w_deleted = db.query(WeatherCache).filter(WeatherCache.expires_at <= now).delete()
        t_deleted = db.query(TrainCache).filter(TrainCache.expires_at <= now).delete()
        db.commit()
        total = w_deleted + t_deleted
        logger.info(f"Purged {total} expired cache records ({w_deleted} weather, {t_deleted} train).")
        return total
    except Exception as e:
        logger.error(f"Error purging expired caches: {e}")
        db.rollback()
        return 0

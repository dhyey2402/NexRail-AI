"""
Database models.
Defines SQLAlchemy ORM classes that map to database tables.
"""

from app.database.base import Base
from app.models.prediction import PredictionHistory
from app.models.weather import WeatherCache
from app.models.train import TrainCache
from app.models.user import User

__all__ = ["Base", "PredictionHistory", "WeatherCache", "TrainCache", "User"]

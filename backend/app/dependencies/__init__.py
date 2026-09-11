"""
FastAPI dependency injection module.
Provides singleton instances of services to the API routers.
"""
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.session import get_db

from app.services.external.weather_service import WeatherService
from app.services.external.train_service import TrainService
from app.services.ai.prediction_service import PredictionService
from app.services.ai.simulation_service import SimulationService


def get_weather_service(db: Session = Depends(get_db)) -> WeatherService:
    """
    Dependency to get an instance of the WeatherService.
    Instantiated per-request with a database session.
    """
    return WeatherService(db=db)


def get_train_service(db: Session = Depends(get_db)) -> TrainService:
    """
    Dependency to get an instance of the TrainService.
    Instantiated per-request with a database session.
    """
    return TrainService(db=db)


def get_prediction_service(db: Session = Depends(get_db)) -> PredictionService:
    """
    Dependency to get an instance of the PredictionService.
    Instantiated per-request with a database session.
    """
    return PredictionService(db=db)


def get_simulation_service(db: Session = Depends(get_db)) -> SimulationService:
    """
    Dependency to get an instance of the SimulationService.
    Instantiated per-request with a database session.
    """
    return SimulationService(db=db)

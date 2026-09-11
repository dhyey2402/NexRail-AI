"""
External services module.
Exports the necessary client services for the rest of the application.
"""
from .base_client import BaseAPIClient
from .weather_service import WeatherService
from .train_service import TrainService

__all__ = [
    "BaseAPIClient",
    "WeatherService",
    "TrainService",
]

from datetime import datetime
from pydantic import BaseModel, Field

class WeatherResponse(BaseModel):
    temperature: float = Field(
        ..., 
        description="Current temperature in Celsius", 
        examples=[28.5]
    )
    humidity: float = Field(
        ..., 
        description="Current relative humidity percentage", 
        examples=[65.0]
    )
    visibility: float = Field(
        ..., 
        description="Current visibility distance in kilometers", 
        examples=[5.0]
    )
    weather_condition: str = Field(
        ..., 
        description="Text description of the weather condition", 
        examples=["Cloudy"]
    )
    wind_speed: float = Field(
        ..., 
        description="Current wind speed in km/h", 
        examples=[12.0]
    )
    rainfall: float = Field(
        ..., 
        description="Recent rainfall in mm", 
        examples=[2.5]
    )
    timestamp: datetime = Field(
        ..., 
        description="Timestamp of the weather reading", 
        examples=["2026-09-09T16:45:00Z"]
    )

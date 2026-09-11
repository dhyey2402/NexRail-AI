from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TrainResponse(BaseModel):
    train_number: str = Field(
        ..., 
        description="Unique alphanumeric identifier for the train", 
        examples=["12050"]
    )
    train_name: str = Field(
        ..., 
        description="Official name of the train", 
        examples=["Gatimaan Express"]
    )
    current_station: str = Field(
        ..., 
        description="The last station the train arrived at or departed from", 
        examples=["NDLS"]
    )
    next_station: str = Field(
        ..., 
        description="The next scheduled station stop", 
        examples=["AGC"]
    )
    latitude: float = Field(
        ..., 
        description="Current GPS latitude of the train", 
        examples=[28.6139]
    )
    longitude: float = Field(
        ..., 
        description="Current GPS longitude of the train", 
        examples=[77.2090]
    )
    current_delay: int = Field(
        ..., 
        description="Current delay in minutes. Positive indicates delay, zero or negative indicates on time or early", 
        examples=[10]
    )
    speed: float = Field(
        ..., 
        description="Current speed of the train in km/h", 
        examples=[120.5]
    )
    last_updated: datetime = Field(
        ..., 
        description="Timestamp when the train location was last updated", 
        examples=["2026-09-09T16:55:00Z"]
    )
    source: Optional[str] = Field(
        None,
        description="Origin station name of the train service",
        examples=["New Delhi"]
    )
    destination: Optional[str] = Field(
        None,
        description="Destination station name of the train service",
        examples=["Agra Cantt"]
    )
    train_type: Optional[str] = Field(
        None,
        description="Type/category of the train",
        examples=["Rajdhani Express"]
    )
    platform: Optional[str] = Field(
        None,
        description="Current or last known platform number",
        examples=["3"]
    )
    stations: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="List of station stops along the route"
    )

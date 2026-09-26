"""
Prediction Pydantic schemas for the SIH 2026 Train Delay & ETA Prediction System.
"""
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class PredictionRequest(BaseModel):
    """
    Input schema for train delay and ETA prediction.
    Accepts required and optional features at top level or nested under 'features'.
    """
    model_config = ConfigDict(extra="allow")

    train_number: str = Field(
        ...,
        description="Unique alphanumeric identifier for the train",
        examples=["12050"]
    )
    departure_date: Optional[str] = Field(
        None,
        description="Date of journey departure in YYYY-MM-DD format",
        examples=["2026-09-10"]
    )

    def to_feature_dict(self) -> Dict[str, Any]:
        """
        Flattens and extracts the journey features into a single Python dictionary
        ready for ML validation.
        """
        return {k: v for k, v in self.model_dump().items() if v is not None}


class DelayPropagation(BaseModel):
    station_code: str
    station_name: str
    scheduled_arrival: Optional[str]
    predicted_arrival: Optional[str]
    predicted_delay_minutes: int
    status: str

class RecoveryAdvice(BaseModel):
    action: str
    reason: str
    estimated_recovery_minutes: Optional[int]
    confidence: Optional[int]
    affected_station: Optional[str]

class AlternativePlan(BaseModel):
    train_number: str
    train_name: str
    departure_station: str
    destination: str
    departure_time: str
    arrival_time: str
    estimated_journey_hours: float
    estimated_time_saved_minutes: Optional[int]
    reason: str


class PredictionResponse(BaseModel):
    """
    Response schema returning official ML model predictions, confidence,
    and explainability reasoning.
    """
    model_config = ConfigDict(extra="allow", protected_namespaces=())

    predicted_eta: str = Field(
        ...,
        description="Predicted Estimated Time of Arrival in HH:MM format",
        examples=["09:40"]
    )
    predicted_delay: int = Field(
        ...,
        description="Predicted delay at destination in minutes",
        examples=[0]
    )
    confidence: Union[int, float] = Field(
        ...,
        description="Calibrated confidence score (0-100)",
        examples=[90]
    )
    reasoning: List[str] = Field(
        ...,
        description="Operational explainability reasoning highlighting key contributing factors",
        examples=[[
            "Section traffic congestion index (0.65) reduced delay by -23.2 min",
            "Punctual incoming rake turnaround reduced delay by -16.4 min"
        ]]
    )
    weather_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Atmospheric and environmental context impacting train traction and track visibility",
        examples=[{
            "condition": "Clear / Favorable",
            "visibility_km": 8.5,
            "fog_alert": False,
            "rainfall_intensity": "None",
            "temperature_c": 28.0,
            "impact_level": "None",
            "summary": "Clear visibility with normal line operating conditions."
        }]
    )
    recovery_advice: List[RecoveryAdvice] = Field(
        default_factory=list,
        description="Actionable operational railway dispatch recommendations to recover sectional delays"
    )
    delay_propagation: List[DelayPropagation] = Field(
        default_factory=list,
        description="Downstream station-by-station delay propagation projections"
    )
    alternative_plan: Optional[AlternativePlan] = Field(
        None,
        description="Dynamic operational alternative travel plan if a faster train exists"
    )
    model: Optional[str] = Field(
        default="LightGBM",
        description="Model architecture name",
        examples=["LightGBM"]
    )
    model_version: Optional[str] = Field(
        default="1.1.0-sih2026-production",
        description="Model pipeline version",
        examples=["1.1.0-sih2026-production"]
    )
    prediction_timestamp: Optional[str] = Field(
        default=None,
        description="ISO 8601 formatted timestamp of prediction generation"
    )
    inference_time_ms: Optional[float] = Field(
        default=None,
        description="Model inference execution latency in milliseconds"
    )
    is_valid_for_live_journey: bool = Field(
        default=True,
        description="Indicates if this prediction is valid for a live midway journey"
    )
    invalid_reason: Optional[str] = Field(
        default=None,
        description="Explanation if the prediction is invalid for the live journey"
    )


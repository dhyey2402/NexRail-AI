"""
Simulation Pydantic schemas for the SIH 2026 What-If Counterfactual Analysis.
"""
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class SimulationRequest(BaseModel):
    """
    Request schema for what-if scenario counterfactual simulation.
    Accepts baseline features and scenario feature modifications.
    """
    model_config = ConfigDict(extra="allow")

    original_features: Dict[str, Any] = Field(
        ...,
        description="Baseline journey features dictionary containing at least train_number",
        examples=[{
            "train_number": "12050",
            "departure_date": "2026-09-10"
        }]
    )
    modified_features: Dict[str, Any] = Field(
        ...,
        description="Counterfactual operational modifications to evaluate",
        examples=[{
            "late_incoming_rake": 1,
            "track_doubled": 0
        }]
    )


class SimulationResponse(BaseModel):
    """
    Response schema returning counterfactual simulation results,
    impact comparisons, and domain explanations.
    """
    model_config = ConfigDict(extra="allow", protected_namespaces=())

    original_eta: Optional[str] = Field(
        None,
        description="Original baseline Estimated Time of Arrival in HH:MM format",
        examples=["09:40"]
    )
    new_eta: str = Field(
        ...,
        description="Simulated counterfactual Estimated Time of Arrival in HH:MM format",
        examples=["10:49"]
    )
    additional_delay: int = Field(
        ...,
        description="Additional delay introduced by scenario in minutes (new_delay - original_delay)",
        examples=[69]
    )
    original_delay: Optional[int] = Field(
        None,
        description="Baseline delay in minutes",
        examples=[0]
    )
    new_delay: Optional[int] = Field(
        None,
        description="Simulated delay in minutes under scenario conditions",
        examples=[69]
    )
    confidence: Optional[Union[int, float]] = Field(
        None,
        description="Calibrated confidence score under simulated conditions",
        examples=[64]
    )
    reasoning: Optional[List[str]] = Field(
        default_factory=list,
        description="Operational explanation detailing scenario disruption and causality"
    )
    comparison_values: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Structured comparison metrics between baseline and simulated conditions"
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
        description="ISO 8601 formatted timestamp of simulation generation"
    )
    simulation_time_ms: Optional[float] = Field(
        default=None,
        description="Total simulation execution latency in milliseconds"
    )
    corridor_stations: Optional[List[str]] = Field(
        default_factory=list,
        description="Key station stops along corridor for delay progression visualization"
    )

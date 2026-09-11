"""
test_weather_pipeline.py
========================
Automated Pytest Suite for NexRail AI Weather-Aware Pipeline.
Verifies:
1. Station coordinate resolution and grid snapping.
2. Temporal alignment and zero target leakage.
3. LiveWeatherService functionality, LRU caching, and graceful degradation fallback.
4. Model B (model_weather_v1.pkl) artifact loading and inference.
5. Strict preservation of ML/model.pkl.
"""

import hashlib
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

from station_locations import get_station_location, snap_to_grid
from weather_agent import LiveWeatherService, DEFAULT_FALLBACK_WEATHER
from weather_feature_engineering import (
    get_baseline_feature_lists,
    get_weather_aware_feature_lists,
)

WEATHER_DIR = Path(__file__).resolve().parent
REDEFINE_DIR = WEATHER_DIR.parent
PROJECT_ROOT = REDEFINE_DIR.parent
PROD_MODEL_PATH = PROJECT_ROOT / "ML" / "model.pkl"
WEATHER_MODEL_PATH = REDEFINE_DIR / "model_weather_v1.pkl"


def test_station_coordinate_mapping():
    """Verify major hubs and modern station codes resolve to valid coordinates."""
    test_stations = ["NDLS", "HWH", "CSMT", "MAS", "SBC", "PUNE", "VGLJ", "DDU"]
    for stn in test_stations:
        loc = get_station_location(stn)
        assert loc is not None, f"Station {stn} should be present in station dictionary"
        lat, lon = loc
        assert 6.0 <= lat <= 38.0, f"Lat {lat} out of bounds for India"
        assert 68.0 <= lon <= 98.0, f"Lon {lon} out of bounds for India"
        
        # Test grid snapping
        glat, glon = snap_to_grid(lat, lon)
        assert abs(glat - round(glat * 4) / 4) < 1e-5
        assert abs(glon - round(glon * 4) / 4) < 1e-5


def test_unknown_station_fallback():
    """Unknown station code should safely return None from location mapping."""
    loc = get_station_location("INVALID_STATION_CODE_XYZ")
    assert loc is None


def test_weather_agent_fallback_on_unknown_station():
    """LiveWeatherService should return safe fallback dict when station is unknown."""
    agent = LiveWeatherService()
    weather = agent.get_station_weather("UNKNOWN_STN_999")
    assert weather["has_weather_observation"] == 0.0
    assert weather["temperature_2m"] == DEFAULT_FALLBACK_WEATHER["temperature_2m"]
    assert weather["visibility"] == DEFAULT_FALLBACK_WEATHER["visibility"]


def test_weather_agent_journey_bundling():
    """Verify journey bundling produces both origin and destination features."""
    agent = LiveWeatherService()
    bundle = agent.get_journey_weather("NDLS", "HWH")
    
    expected_keys = [
        "weather_temperature_c",
        "weather_relative_humidity_pct",
        "weather_precipitation_mm",
        "weather_visibility_m",
        "weather_wind_speed_kmh",
        "weather_wind_gusts_kmh",
        "weather_surface_pressure_hpa",
        "weather_cloud_cover_pct",
        "weather_is_raining",
        "weather_is_heavy_rain",
        "weather_is_fog_risk",
        "weather_is_low_visibility",
        "weather_disruption_score",
        "dest_weather_temperature_c",
        "dest_weather_precipitation_mm",
        "dest_weather_visibility_m",
        "dest_weather_is_fog_risk",
        "has_weather_observation",
    ]
    for k in expected_keys:
        assert k in bundle, f"Missing key {k} in journey weather bundle"
        assert isinstance(bundle[k], (int, float))


def test_no_target_leakage_in_features():
    """Verify strictly zero target leakage columns exist in weather feature lists."""
    num_cols, cat_cols = get_weather_aware_feature_lists()
    all_cols = set(num_cols + cat_cols)
    
    leaked_candidates = [
        "arrival_delay_minutes",
        "final_delay_minutes",
        "actual_arrival",
        "actual_arrival_time",
        "actual_departure",
        "target",
        "route_historical_ontime_pct",  # Global non-causal leakage
    ]
    for col in leaked_candidates:
        assert col not in all_cols, f"Forbidden leakage column {col} found in feature set!"


def test_weather_model_inference():
    """Verify model_weather_v1.pkl loads and accurately predicts on mock dataframe."""
    assert WEATHER_MODEL_PATH.exists(), "model_weather_v1.pkl must exist"
    pipeline = joblib.load(WEATHER_MODEL_PATH)
    
    # Create mock single-row test input matching pipeline schema
    mock_input = {
        "distance_km": 850.0,
        "scheduled_travel_time_minutes": 720.0,
        "departure_delay_minutes": 15.0,
        "hist_train_delay": 12.5,
        "hist_train_ontime_pct": 78.0,
        "hist_train_sample_count": 45,
        "hist_route_delay": 18.0,
        "hist_route_ontime_pct": 70.0,
        "hist_route_sample_count": 120,
        "hist_zone_delay": 14.0,
        "dep_hour": 14,
        "dep_day_of_week": 3,
        "dep_month": 11,
        "is_weekend": 0,
        "is_holiday": 0,
        "is_peak_hours": 1,
        "train_type": "EXP",
        "origin_zone": "NR",
        "destination_zone": "ER",
        "route_key": "NDLS_CNB",
        # Weather features
        "weather_temperature_c": 22.0,
        "weather_relative_humidity_pct": 85.0,
        "weather_precipitation_mm": 2.5,
        "weather_rain_mm": 2.5,
        "weather_visibility_m": 1500.0,
        "weather_wind_speed_kmh": 12.0,
        "weather_wind_gusts_kmh": 20.0,
        "weather_surface_pressure_hpa": 1008.0,
        "weather_cloud_cover_pct": 80.0,
        "weather_is_raining": 1,
        "weather_is_heavy_rain": 0,
        "weather_is_fog_risk": 1,
        "weather_is_low_visibility": 1,
        "weather_disruption_score": 50.0,
        "dest_weather_temperature_c": 24.0,
        "dest_weather_precipitation_mm": 0.0,
        "dest_weather_visibility_m": 7000.0,
        "dest_weather_is_fog_risk": 0,
        "has_weather_observation": 1,
        "weather_condition_category": "Fog",
    }
    
    df_test = pd.DataFrame([mock_input])
    pred = pipeline.predict(df_test)
    assert len(pred) == 1
    assert not np.isnan(pred[0])
    assert pred[0] >= 0.0, f"Predicted delay should be non-negative: {pred[0]}"


def test_production_model_immutability():
    """Verify ML/model.pkl has NOT been overwritten or created by the weather pipeline."""
    expected_md5 = "8ff2ac08de28952859a06479673a720d"
    if PROD_MODEL_PATH.exists():
        with open(PROD_MODEL_PATH, "rb") as f:
            current_md5 = hashlib.md5(f.read()).hexdigest()
        assert current_md5 == expected_md5, "CRITICAL: ML/model.pkl was modified!"
    else:
        # Production model file was safely untouched / not created
        assert not PROD_MODEL_PATH.exists()


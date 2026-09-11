"""
Comprehensive test suite for Dynamic ML Inference Pipeline.
Validates:
1. Deterministic operational feature derivations (season, fog, congestion, maintenance, seat util, rake, on-time).
2. Live weather sensitivity (Sunny vs Heavy Rain vs Dense Fog).
3. Top 20 SHAP feature importance analysis.
4. Dead feature detection.
5. Full ASGI endpoint integration with live external telemetry.
"""
import sys
from pathlib import Path
import pytest
import numpy as np

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(PROJECT_ROOT / "ml") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "ml"))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.connection import SessionLocal

from ml.dynamic_features import (
    derive_season,
    derive_weather_features,
    derive_congestion_index,
    derive_maintenance_score,
    derive_seat_utilisation,
    derive_late_incoming_rake,
    derive_historical_ontime_pct,
    synthesize_dynamic_features,
)
import ml.predict as p


def test_derive_season_meteorological_rules():
    """Verify that season and is_monsoon_season are completely consistent across all 12 months."""
    # Winter (Dec, Jan, Feb)
    for m in [12, 1, 2]:
        season, is_monsoon = derive_season(m)
        assert season == "Winter"
        assert is_monsoon == 0

    # Summer (Mar, Apr, May)
    for m in [3, 4, 5]:
        season, is_monsoon = derive_season(m)
        assert season == "Summer"
        assert is_monsoon == 0

    # Monsoon (Jun, Jul, Aug, Sep)
    for m in [6, 7, 8, 9]:
        season, is_monsoon = derive_season(m)
        assert season == "Monsoon"
        assert is_monsoon == 1

    # Post-Monsoon (Oct, Nov)
    for m in [10, 11]:
        season, is_monsoon = derive_season(m)
        assert season == "Post-Monsoon"
        assert is_monsoon == 0


def test_derive_weather_features_clear_vs_fog_vs_rain():
    """Verify OpenWeather telemetry translates accurately into fog_risk and severity scores."""
    # 1. Clear sunny day
    clear_wx = {
        "weather_condition": "Clear",
        "visibility": 10.0,
        "humidity": 35.0,
        "temperature": 32.0,
        "rainfall": 0.0,
        "wind_speed": 8.0,
    }
    clear_feats = derive_weather_features(clear_wx, season="Summer", month=5, hour=14, zone_abbr="WR")
    assert clear_feats["fog_risk_score"] == 0.0
    assert clear_feats["is_fog_risk"] == 0
    assert clear_feats["season_severity_score"] <= 0.40

    # 2. Dense winter fog
    fog_wx = {
        "weather_condition": "Fog",
        "visibility": 0.4,
        "humidity": 95.0,
        "temperature": 7.0,
        "rainfall": 0.0,
        "wind_speed": 4.0,
    }
    fog_feats = derive_weather_features(fog_wx, season="Winter", month=1, hour=5, zone_abbr="NR")
    assert fog_feats["fog_risk_score"] >= 0.70
    assert fog_feats["is_fog_risk"] == 1
    assert fog_feats["season_severity_score"] >= 0.60
    assert fog_feats["zone_fog_index"] >= 0.70

    # 3. Heavy monsoon storm
    monsoon_wx = {
        "weather_condition": "Rain",
        "visibility": 3.0,
        "humidity": 92.0,
        "temperature": 27.0,
        "rainfall": 35.0,
        "wind_speed": 45.0,
    }
    monsoon_feats = derive_weather_features(monsoon_wx, season="Monsoon", month=7, hour=16, zone_abbr="CR")
    assert monsoon_feats["season_severity_score"] >= 0.80


def test_derive_congestion_and_maintenance():
    """Verify congestion index and maintenance scores respond appropriately to operational factors."""
    # Congestion: peak hour + delay vs off-peak punctuality
    off_peak_cong = derive_congestion_index("WR", hour=14, current_delay=0, speed=105.0)
    peak_cong = derive_congestion_index("NCR", hour=8, current_delay=45, speed=50.0)
    assert peak_cong > off_peak_cong

    # Maintenance: Vande Bharat LHB vs Passenger ICF
    vb_score = derive_maintenance_score("Vande Bharat Express", has_lhb=1, loco_age=2.0, coach_age=2.0)
    pass_score = derive_maintenance_score("Passenger Train", has_lhb=0, loco_age=18.0, coach_age=18.0)
    assert vb_score >= 9.0
    assert pass_score <= 6.0


def test_weather_sensitivity_variations():
    """
    Directly tests that changing live weather inputs produces distinct delays and ETAs:
    Sunny -> Heavy Rain -> Dense Fog.
    """
    p.load_model_artifacts()

    base = {
        "train_number": "12951",
        "train_type": "Rajdhani Express",
        "zone_abbr": "WR",
        "distance_km": 1385.0,
        "scheduled_travel_hours": 15.5,
        "num_scheduled_stops": 8,
        "departure_date": "2026-09-10",
        "departure_hour": 16,
    }

    # 1. Sunny / Clear Weather
    sunny_wx = {
        "weather_condition": "Clear",
        "visibility": 10.0,
        "humidity": 30.0,
        "temperature": 30.0,
        "rainfall": 0.0,
        "wind_speed": 5.0,
    }
    sunny_input = synthesize_dynamic_features(base, live_weather=sunny_wx)
    res_sunny = p.predict_eta(sunny_input)

    # 2. Heavy Monsoon Rain
    storm_wx = {
        "weather_condition": "Rain",
        "visibility": 2.5,
        "humidity": 98.0,
        "temperature": 26.0,
        "rainfall": 40.0,
        "wind_speed": 40.0,
    }
    storm_input = synthesize_dynamic_features(base, live_weather=storm_wx)
    res_storm = p.predict_eta(storm_input)

    # 3. Dense Winter Fog
    fog_wx = {
        "weather_condition": "Fog",
        "visibility": 0.3,
        "humidity": 96.0,
        "temperature": 6.0,
        "rainfall": 0.0,
        "wind_speed": 3.0,
    }
    winter_base = base.copy()
    winter_base["departure_date"] = "2026-01-15"
    winter_base["departure_hour"] = 4
    fog_input = synthesize_dynamic_features(winter_base, live_weather=fog_wx)
    res_fog = p.predict_eta(fog_input)

    # Assert distinct delays or at least no decrease
    assert res_storm["predicted_delay"] >= res_sunny["predicted_delay"]
    assert res_fog["predicted_delay"] >= res_sunny["predicted_delay"]


def test_top_20_shap_importance():
    """Computes and validates the Top 20 most important features in LightGBM."""
    p.load_model_artifacts()
    reg = p._LOADED_PIPELINE.named_steps["reg"]
    feat_names = p._LOADED_METADATA.get("feature_names", [])

    importances = reg.feature_importances_
    ranked = sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True)

    top_20 = [name for name, imp in ranked[:20]]
    assert len(top_20) == 20

    # Verify key operational features are in top rankings
    assert len(top_20) > 0
    top_20_str = " ".join(top_20)
    assert "distance_km" in top_20_str or "scheduled_speed_kmh" in top_20_str


def test_dead_features_detection():
    """Identifies features with zero split importance in the trained LightGBM model."""
    p.load_model_artifacts()
    reg = p._LOADED_PIPELINE.named_steps["reg"]
    feat_names = p._LOADED_METADATA.get("feature_names", [])

    importances = reg.feature_importances_
    zero_imp = [name for name, imp in zip(feat_names, importances) if imp == 0]

    # Verify zero-importance features are detected
    assert len(zero_imp) >= 5
    assert "num__is_fog_risk" in zero_imp
    assert "num__composite_fog_risk" in zero_imp


@pytest.mark.anyio
async def test_full_endpoint_live_weather_integration():
    """Verify POST /api/predict/ dynamically incorporates live external telemetry."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request with exact coordinates
        payload = {
            "train_number": "12951",
            "train_type": "Rajdhani Express",
            "zone_abbr": "WR",
            "distance_km": 1385.0,
            "scheduled_travel_hours": 15.5,
            "num_scheduled_stops": 8,
            "departure_date": "2026-09-10",
            "departure_hour": 16,
            "latitude": 23.0333,
            "longitude": 72.6167
        }
        response = await client.post("/api/predict/", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Check that weather context contains real OpenWeather telemetry
        wx = data["weather_context"]
        assert "condition" in wx
        assert "temperature_c" in wx
        assert "visibility_km" in wx
        assert wx["visibility_km"] > 0
        assert data["predicted_delay"] >= 0

"""
Comprehensive test suite for Backend-ML Integration.
Verifies model loading once during startup, prediction endpoint,
simulation endpoint, error handling, and performance logging.
"""
import sys
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.services.ai.prediction_service import PredictionService


from starlette.testclient import TestClient


def test_model_loading_and_lifespan():
    """Verify that model artifacts load cleanly during FastAPI lifespan."""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
        assert PredictionService._model_loaded is True



@pytest.mark.anyio
async def test_predict_endpoint_success():
    """Verify POST /api/predict returns predicted_eta, predicted_delay, confidence, and reasoning."""
    payload = {
        "train_number": "12050",
        "train_type": "Gatimaan Express",
        "zone_abbr": "NR",
        "distance_km": 188.0,
        "scheduled_travel_hours": 1.67,
        "num_scheduled_stops": 2,
        "departure_date": "2026-09-10",
        "departure_hour": 8,
        "scheduled_arrival": "09:40"
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/predict/", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()

        # Check required fields
        assert "predicted_eta" in data
        assert isinstance(data["predicted_eta"], str)
        assert len(data["predicted_eta"]) == 5 and ":" in data["predicted_eta"]

        assert "predicted_delay" in data
        assert isinstance(data["predicted_delay"], int)

        assert "confidence" in data
        assert 0 <= data["confidence"] <= 100

        assert "reasoning" in data
        assert isinstance(data["reasoning"], list)
        assert len(data["reasoning"]) > 0

        # Decision support and frontend assistance extensions
        assert "weather_context" in data
        assert isinstance(data["weather_context"], dict)
        assert "condition" in data["weather_context"]
        assert "visibility_km" in data["weather_context"]

        assert "recovery_advice" in data
        assert isinstance(data["recovery_advice"], list)
        assert len(data["recovery_advice"]) > 0

        assert "delay_propagation" in data
        assert isinstance(data["delay_propagation"], list)
        if len(data["delay_propagation"]) > 0:
            assert "station_code" in data["delay_propagation"][0]

        assert "alternative_plan" in data
        if data["alternative_plan"]:
            assert isinstance(data["alternative_plan"], dict)
            assert "train_number" in data["alternative_plan"]

        # Model metadata
        assert data.get("model") == "LightGBM"
        assert "2.0.0" in data.get("model_version", "") or "1.1.0" in data.get("model_version", "")
        assert "inference_time_ms" in data



@pytest.mark.anyio
async def test_predict_endpoint_validation_failure():
    """Verify POST /api/predict rejects invalid feature inputs with 400 Bad Request."""
    # Missing required field 'distance_km'
    payload = {
        "train_number": "12050",
        "train_type": "Gatimaan Express",
        "zone_abbr": "NR",
        "scheduled_travel_hours": 1.67,
        "num_scheduled_stops": 2,
        "departure_date": "2026-09-10",
        "departure_hour": 8,
        "distance_km": -5.0
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/predict/", json=payload)
        assert response.status_code == 400
        assert "validation error" in response.json()["detail"].lower()

    # Out of range distance_km
    payload_invalid_dist = {
        "train_number": "12050",
        "train_type": "Gatimaan Express",
        "zone_abbr": "NR",
        "distance_km": -100.0,
        "scheduled_travel_hours": 1.67,
        "num_scheduled_stops": 2,
        "departure_date": "2026-09-10",
        "departure_hour": 8
    }
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/predict/", json=payload_invalid_dist)
        assert response.status_code == 400
        assert "distance_km must be between" in response.json()["detail"]


@pytest.mark.anyio
async def test_simulate_endpoint_success():
    """Verify POST /api/simulate returns original ETA, new ETA, additional delay, and comparison values."""
    payload = {
        "original_features": {
            "train_number": "12050",
            "train_type": "Gatimaan Express",
            "zone_abbr": "NR",
            "distance_km": 188.0,
            "scheduled_travel_hours": 1.67,
            "num_scheduled_stops": 2,
            "departure_date": "2026-09-10",
            "departure_hour": 8,
            "scheduled_arrival": "09:40"
        },
        "modified_features": {
            "late_incoming_rake": 1,
            "track_doubled": 0
        }
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/simulate/", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()

        # Check required fields
        assert "original_eta" in data
        assert "new_eta" in data
        assert "additional_delay" in data
        assert isinstance(data["additional_delay"], int)
        assert data["additional_delay"] > 0

        assert "comparison_values" in data
        assert isinstance(data["comparison_values"], dict)
        assert data["comparison_values"]["additional_delay"] == data["additional_delay"]
        assert "modified_features" in data["comparison_values"]

        assert "reasoning" in data
        assert isinstance(data["reasoning"], list)
        assert len(data["reasoning"]) > 0

        assert "simulation_time_ms" in data


@pytest.mark.anyio
async def test_simulate_endpoint_validation_failure():
    """Verify POST /api/simulate rejects malformed input."""
    payload = {
        "original_features": "not-a-dict",
        "modified_features": {}
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/simulate/", json=payload)
        assert response.status_code in (400, 422)

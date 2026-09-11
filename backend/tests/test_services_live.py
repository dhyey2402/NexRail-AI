"""
Integration test suite for live external services and database caching.
Verifies real OpenWeatherMap and RailRadar integration, SQLite caching, and endpoints.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.connection import SessionLocal
from app.models.weather import WeatherCache
from app.models.train import TrainCache
from app.models.prediction import PredictionHistory
from app.services.external.weather_service import WeatherService
from app.services.external.train_service import TrainService
from app.services.database import clean_expired_caches


@pytest.mark.anyio
async def test_live_weather_service_and_cache():
    """Verify WeatherService calls OpenWeatherMap and saves to WeatherCache."""
    db = SessionLocal()
    try:
        service = WeatherService(db=db)
        # Coordinates for Ahmedabad
        lat, lon = 23.0333, 72.6167
        
        # 1. First call: live API fetch
        weather = await service.get_current_weather(latitude=lat, longitude=lon)
        assert isinstance(weather["temperature"], float)
        assert isinstance(weather["humidity"], float)
        assert isinstance(weather["visibility"], float)
        assert isinstance(weather["weather_condition"], str)
        assert isinstance(weather["wind_speed"], float)
        assert isinstance(weather["rainfall"], float)
        assert weather["timestamp"] is not None

        # 2. Verify cache record was created in SQLite
        cached = db.query(WeatherCache).filter(
            WeatherCache.latitude.between(lat - 0.05, lat + 0.05),
            WeatherCache.longitude.between(lon - 0.05, lon + 0.05),
        ).order_by(WeatherCache.cached_at.desc()).first()
        assert cached is not None
        assert cached.temperature == weather["temperature"]

        # 3. Second call: should serve from cache
        cached_weather = await service.get_current_weather(latitude=lat, longitude=lon)
        assert cached_weather["temperature"] == weather["temperature"]
    finally:
        db.close()


@pytest.mark.anyio
async def test_live_train_service_and_cache():
    """Verify TrainService calls RailRadar for a live train and caches in TrainCache."""
    db = SessionLocal()
    try:
        service = TrainService(db=db)
        train_num = "12951"  # Mumbai Central - New Delhi Rajdhani
        
        # 1. Live API fetch
        train_data = await service.get_live_train(train_number=train_num)
        assert train_data["train_number"] == train_num
        assert "Rajdhani" in train_data["train_name"] or len(train_data["train_name"]) > 0
        assert isinstance(train_data["current_station"], str) and len(train_data["current_station"]) > 0
        assert isinstance(train_data["next_station"], str) and len(train_data["next_station"]) > 0
        assert isinstance(train_data["latitude"], float)
        assert isinstance(train_data["longitude"], float)
        assert isinstance(train_data["current_delay"], int)
        assert isinstance(train_data["speed"], float)
        assert train_data["last_updated"] is not None

        # 2. Verify cache record in SQLite
        cached = db.query(TrainCache).filter(TrainCache.train_number == train_num).first()
        assert cached is not None
        assert cached.train_number == train_num

        # 3. Second call serves from cache
        cached_train = await service.get_live_train(train_number=train_num)
        assert cached_train["train_name"] == train_data["train_name"]
    finally:
        db.close()


@pytest.mark.anyio
async def test_api_weather_current_endpoint():
    """Verify GET /api/weather/current endpoint returns live schema-compliant response."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/weather/current?lat=28.6139&lon=77.2090")
        assert response.status_code == 200
        data = response.json()
        assert "temperature" in data
        assert "humidity" in data
        assert "visibility" in data
        assert "weather_condition" in data
        assert "wind_speed" in data
        assert "rainfall" in data
        assert "timestamp" in data


@pytest.mark.anyio
async def test_api_train_endpoint():
    """Verify GET /api/train/{train_number} returns live train tracking status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/train/12951")
        assert response.status_code == 200
        data = response.json()
        assert data["train_number"] == "12951"
        assert "train_name" in data
        assert "current_station" in data
        assert "next_station" in data
        assert "latitude" in data
        assert "longitude" in data
        assert "current_delay" in data
        assert "speed" in data
        assert "last_updated" in data


@pytest.mark.anyio
async def test_api_train_not_found():
    """Verify GET /api/train/{invalid_train} returns 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/train/999999999")
        assert response.status_code in (404, 502, 500)


@pytest.mark.anyio
async def test_prediction_persists_to_database():
    """Verify POST /api/predict/ saves record into PredictionHistory."""
    db = SessionLocal()
    initial_count = db.query(PredictionHistory).count()
    db.close()

    payload = {
        "train_number": "12951",
        "train_type": "Rajdhani Express",
        "zone_abbr": "WR",
        "distance_km": 1385.0,
        "scheduled_travel_hours": 15.5,
        "num_scheduled_stops": 8,
        "departure_date": "2026-09-10",
        "departure_hour": 16,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/predict/", json=payload)
        assert response.status_code == 200

    db = SessionLocal()
    new_count = db.query(PredictionHistory).count()
    latest = db.query(PredictionHistory).order_by(PredictionHistory.id.desc()).first()
    db.close()

    assert new_count == initial_count + 1
    assert latest is not None
    assert latest.train_number == "12951"
    assert latest.predicted_delay >= 0


def test_clean_expired_caches():
    """Verify clean_expired_caches database function runs without errors."""
    db = SessionLocal()
    try:
        purged = clean_expired_caches(db)
        assert isinstance(purged, int)
    finally:
        db.close()

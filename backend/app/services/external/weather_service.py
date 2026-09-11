"""
Weather external service integration.
Fetches real-time atmospheric data from OpenWeatherMap and provides SQLite caching.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.services.external.base_client import BaseAPIClient
from app.config import settings
from app.models.weather import WeatherCache

logger = logging.getLogger(__name__)


class WeatherService(BaseAPIClient):
    """
    Client for interacting with OpenWeatherMap API with database caching support.
    """
    def __init__(self, db: Optional[Session] = None) -> None:
        super().__init__(base_url=settings.openweather_base_url)
        self.api_key = settings.openweather_api_key
        self.db = db
        self.cache_ttl_minutes = 15

    async def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetches current weather conditions for given GPS coordinates.
        Checks local WeatherCache first; queries OpenWeatherMap if cache miss or expired.
        
        Args:
            latitude (float): Latitude of the location (-90.0 to 90.0).
            longitude (float): Longitude of the location (-180.0 to 180.0).
            
        Returns:
            Dict[str, Any]: Dynamic weather data conforming to WeatherResponse schema.
        """
        now = datetime.now(timezone.utc)

        # 1. Check database cache
        if self.db is not None:
            try:
                cached = (
                    self.db.query(WeatherCache)
                    .filter(
                        WeatherCache.latitude.between(latitude - 0.05, latitude + 0.05),
                        WeatherCache.longitude.between(longitude - 0.05, longitude + 0.05),
                        WeatherCache.expires_at > now,
                    )
                    .order_by(WeatherCache.cached_at.desc())
                    .first()
                )
                if cached:
                    logger.info(f"Returning cached weather for lat={latitude}, lon={longitude} (expires: {cached.expires_at})")
                    return {
                        "temperature": float(cached.temperature),
                        "humidity": float(cached.humidity),
                        "visibility": float(cached.visibility),
                        "weather_condition": str(cached.weather_condition),
                        "wind_speed": float(cached.wind_speed),
                        "rainfall": float(cached.rainfall),
                        "timestamp": cached.cached_at,
                    }
            except Exception as cache_err:
                logger.warning(f"Error reading WeatherCache: {cache_err}. Falling back to live API.")

        # 2. Query live OpenWeatherMap API
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": self.api_key,
            "units": "metric",
        }
        raw = await self._get("/data/2.5/weather", params=params)

        weather_list = raw.get("weather", [])
        weather_cond = weather_list[0].get("main", "Clear") if weather_list else "Clear"

        temp = float(raw["main"]["temp"])
        humidity = float(raw["main"]["humidity"])
        wind_speed_ms = float(raw.get("wind", {}).get("speed", 0.0))
        wind_speed_kmh = round(wind_speed_ms * 3.6, 2)
        visibility_km = round(float(raw.get("visibility", 10000)) / 1000.0, 2)
        rainfall = float(raw.get("rain", {}).get("1h", 0.0))

        # Validate physically impossible values
        if wind_speed_kmh > 150.0 or temp > 60.0 or temp < -50.0 or humidity < 0.0 or humidity > 100.0:
            logger.error(f"Impossible weather data received from upstream API: wind={wind_speed_kmh}km/h, temp={temp}C, hum={humidity}%")
            raise ValueError("Upstream weather data contains physically impossible values")

        weather_data = {
            "temperature": temp,
            "humidity": humidity,
            "visibility": visibility_km,
            "weather_condition": weather_cond,
            "wind_speed": wind_speed_kmh,
            "rainfall": rainfall,
            "timestamp": now,
        }

        # 3. Store result in database cache
        if self.db is not None:
            try:
                cache_record = WeatherCache(
                    latitude=latitude,
                    longitude=longitude,
                    temperature=weather_data["temperature"],
                    humidity=weather_data["humidity"],
                    visibility=weather_data["visibility"],
                    weather_condition=weather_data["weather_condition"],
                    wind_speed=weather_data["wind_speed"],
                    rainfall=weather_data["rainfall"],
                    cached_at=now,
                    expires_at=now + timedelta(minutes=self.cache_ttl_minutes),
                )
                self.db.add(cache_record)
                self.db.commit()
            except Exception as save_err:
                logger.warning(f"Failed to persist WeatherCache: {save_err}")
                self.db.rollback()

        return weather_data

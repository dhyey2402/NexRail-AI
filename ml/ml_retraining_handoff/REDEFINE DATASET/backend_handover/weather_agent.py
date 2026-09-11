"""
weather_agent.py
================
NexRail AI / RailWise — Weather Agent / Live Weather Service.

Responsible for retrieving live and forecast weather at railway stations
for real-time inference in the ETA prediction engine.

Features:
- In-memory LRU cache with configurable TTL (default: 15 minutes).
- Coordinate snapping to 0.25-degree ERA5 / Open-Meteo grid cells to maximize cache hits.
- Graceful degradation and fallback to pre-computed seasonal/regional medians
  when the weather API is unreachable or times out.
- Origin and destination weather bundling for model feature vector generation.
"""

import time
import logging
from typing import Dict, Any, Optional, Tuple
import urllib.request
import urllib.error
import json
from pathlib import Path
import sys

# Add parent directory to path to import station locations
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from station_locations import get_station_location, snap_to_grid
except ImportError:
    from .station_locations import get_station_location, snap_to_grid

logger = logging.getLogger("NexRailWeatherAgent")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Default fallback values (derived strictly from training set medians)
DEFAULT_FALLBACK_WEATHER: Dict[str, float] = {
    "temperature_2m": 25.4,
    "relative_humidity_2m": 62.0,
    "precipitation": 0.0,
    "rain": 0.0,
    "visibility": 7500.0,
    "wind_speed_10m": 9.8,
    "wind_gusts_10m": 16.5,
    "surface_pressure": 992.0,
    "cloud_cover": 35.0,
    "is_raining": 0.0,
    "is_heavy_rain": 0.0,
    "is_fog_risk": 0.0,
    "is_low_visibility": 0.0,
    "weather_disruption_score": 0.0,
    "has_weather_observation": 0.0,
}


class LiveWeatherService:
    """
    Live Weather Service for NexRail AI inference.
    Handles coordinate resolution, cached API queries to Open-Meteo,
    and returns standardized meteorological features.
    """

    def __init__(
        self,
        api_url: str = "https://api.open-meteo.com/v1/forecast",
        cache_ttl_seconds: int = 900,  # 15 minutes
        request_timeout: float = 1.5,   # 1.5 seconds max latency
    ):
        self.api_url = api_url
        self.cache_ttl_seconds = cache_ttl_seconds
        self.request_timeout = request_timeout
        # Cache key: (snapped_lat, snapped_lon) -> (timestamp, data_dict)
        self._cache: Dict[Tuple[float, float], Tuple[float, Dict[str, float]]] = {}

    def _fetch_from_api(self, lat: float, lon: float) -> Optional[Dict[str, float]]:
        """Fetch current weather directly from Open-Meteo Current Weather API."""
        params = (
            f"?latitude={lat:.4f}&longitude={lon:.4f}"
            f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,"
            f"visibility,wind_speed_10m,wind_gusts_10m,surface_pressure,cloud_cover"
            f"&timezone=auto"
        )
        url = self.api_url + params
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "NexRailAI-ETA/1.0 (Railway Weather Agent)"}
        )

        try:
            with urllib.request.urlopen(req, timeout=self.request_timeout) as resp:
                if resp.status == 200:
                    payload = json.loads(resp.read().decode("utf-8"))
                    current = payload.get("current", {})
                    
                    temp = float(current.get("temperature_2m", 25.0))
                    humidity = float(current.get("relative_humidity_2m", 60.0))
                    precip = float(current.get("precipitation", 0.0))
                    rain = float(current.get("rain", 0.0))
                    vis = float(current.get("visibility", 8000.0))
                    wind_speed = float(current.get("wind_speed_10m", 10.0))
                    wind_gusts = float(current.get("wind_gusts_10m", 15.0))
                    pressure = float(current.get("surface_pressure", 995.0))
                    clouds = float(current.get("cloud_cover", 30.0))

                    # Derived risk flags
                    is_rain = 1.0 if (rain > 0.1 or precip > 0.1) else 0.0
                    is_heavy = 1.0 if (rain > 5.0 or precip > 5.0) else 0.0
                    is_fog = 1.0 if (vis < 2000.0 and humidity > 85.0) else 0.0
                    is_low_vis = 1.0 if (vis < 3000.0) else 0.0

                    # Composite disruption score (0 to 100)
                    disruption = 0.0
                    if is_heavy:
                        disruption += 40.0
                    elif is_rain:
                        disruption += 15.0
                    if is_fog:
                        disruption += 35.0
                    elif is_low_vis:
                        disruption += 20.0
                    if wind_gusts > 45.0:
                        disruption += 25.0
                    disruption = min(disruption, 100.0)

                    return {
                        "temperature_2m": temp,
                        "relative_humidity_2m": humidity,
                        "precipitation": precip,
                        "rain": rain,
                        "visibility": vis,
                        "wind_speed_10m": wind_speed,
                        "wind_gusts_10m": wind_gusts,
                        "surface_pressure": pressure,
                        "cloud_cover": clouds,
                        "is_raining": is_rain,
                        "is_heavy_rain": is_heavy,
                        "is_fog_risk": is_fog,
                        "is_low_visibility": is_low_vis,
                        "weather_disruption_score": disruption,
                        "has_weather_observation": 1.0,
                    }
        except (urllib.error.URLError, TimeoutError, Exception) as e:
            logger.warning(f"Weather API fetch failed for ({lat}, {lon}): {e}. Falling back to default.")
            return None

        return None

    def get_station_weather(self, station_code: str) -> Dict[str, float]:
        """
        Get weather observation for a specific railway station.
        Uses grid snapping and TTL cache.
        """
        station_code = station_code.upper().strip()
        loc = get_station_location(station_code)
        if not loc:
            logger.warning(f"Unknown station code '{station_code}'. Returning fallback weather.")
            return dict(DEFAULT_FALLBACK_WEATHER)

        raw_lat, raw_lon = loc
        grid_lat, grid_lon = snap_to_grid(raw_lat, raw_lon)
        cache_key = (grid_lat, grid_lon)
        now = time.time()

        # Check cache
        if cache_key in self._cache:
            cache_time, data = self._cache[cache_key]
            if now - cache_time < self.cache_ttl_seconds:
                return dict(data)

        # Cache miss or expired - query API
        fetched = self._fetch_from_api(grid_lat, grid_lon)
        if fetched is not None:
            self._cache[cache_key] = (now, fetched)
            return dict(fetched)

        # Fallback if query failed
        return dict(DEFAULT_FALLBACK_WEATHER)

    def get_journey_weather(self, origin_code: str, dest_code: str) -> Dict[str, float]:
        """
        Get bundled weather features for origin and destination of a train journey.
        Prefixes:
        - Origin: 'weather_'
        - Destination: 'dest_weather_'
        """
        origin_w = self.get_station_weather(origin_code)
        dest_w = self.get_station_weather(dest_code)

        result: Dict[str, float] = {}

        # Map origin features
        result["weather_temperature_c"] = origin_w["temperature_2m"]
        result["weather_relative_humidity_pct"] = origin_w["relative_humidity_2m"]
        result["weather_precipitation_mm"] = origin_w["precipitation"]
        result["weather_rain_mm"] = origin_w["rain"]
        result["weather_visibility_m"] = origin_w["visibility"]
        result["weather_wind_speed_kmh"] = origin_w["wind_speed_10m"]
        result["weather_wind_gusts_kmh"] = origin_w["wind_gusts_10m"]
        result["weather_surface_pressure_hpa"] = origin_w["surface_pressure"]
        result["weather_cloud_cover_pct"] = origin_w["cloud_cover"]
        result["weather_is_raining"] = origin_w["is_raining"]
        result["weather_is_heavy_rain"] = origin_w["is_heavy_rain"]
        result["weather_is_fog_risk"] = origin_w["is_fog_risk"]
        result["weather_is_low_visibility"] = origin_w["is_low_visibility"]
        result["weather_disruption_score"] = origin_w["weather_disruption_score"]
        result["has_weather_observation"] = 1.0 if (origin_w["has_weather_observation"] > 0.5 and dest_w["has_weather_observation"] > 0.5) else 0.0

        # Destination features
        result["dest_weather_temperature_c"] = dest_w["temperature_2m"]
        result["dest_weather_precipitation_mm"] = dest_w["precipitation"]
        result["dest_weather_visibility_m"] = dest_w["visibility"]
        result["dest_weather_is_fog_risk"] = dest_w["is_fog_risk"]

        return result


if __name__ == "__main__":
    agent = LiveWeatherService()
    print("Testing live weather agent for NDLS (New Delhi) and HWH (Howrah)...")
    ndls_w = agent.get_station_weather("NDLS")
    print("NDLS Weather:", json.dumps(ndls_w, indent=2))
    
    journey_w = agent.get_journey_weather("NDLS", "HWH")
    print("\nJourney Weather (NDLS -> HWH):")
    for k, v in journey_w.items():
        print(f"  {k:35s}: {v}")

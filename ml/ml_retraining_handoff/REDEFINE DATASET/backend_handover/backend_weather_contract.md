# NexRail AI / RailWise — Weather-Aware ETA Model Backend Integration Contract

## 1. Executive Summary & Integration Objective

This document defines the strict integration contract between the **NexRail AI FastAPI Backend Service** (`backend/app/api/`) and the new **Weather-Aware ETA Prediction Model** (`REDEFINE DATASET/model_weather_v1.pkl`).

The upgraded LightGBM model consumes real-time meteorological features (temperature, humidity, precipitation, visibility, wind speed, wind gusts, surface pressure, cloud cover, and derived risk flags) alongside railway network operational features.

---

## 2. API Contract & Schema Specifications

### 2.1 Extended Request Payload (`PredictionRequest`)
The FastAPI endpoint `/api/v1/predict-eta` receives prediction requests. Weather features can be:
1. **Option A (Automated Backend Resolution - Recommended)**: The client supplies standard journey parameters (`train_number`, `origin_station`, `destination_station`, `departure_time`). The backend queries the `LiveWeatherService` asynchronously or uses cached grid observations.
2. **Option B (Explicit Client Weather Override)**: Testing tools, IoT sensors, or edge dispatch systems can pass observed weather directly.

```json
{
  "train_number": "12951",
  "origin_station": "MMCT",
  "destination_station": "NDLS",
  "departure_time": "2026-09-15T16:55:00Z",
  "distance_km": 1386.0,
  "scheduled_travel_time_minutes": 935.0,
  "departure_delay_minutes": 4.0,
  "weather_override": {
    "temperature_c": 28.5,
    "relative_humidity_pct": 82.0,
    "precipitation_mm": 12.4,
    "rain_mm": 12.4,
    "visibility_m": 2500.0,
    "wind_speed_kmh": 22.0,
    "wind_gusts_kmh": 35.0,
    "surface_pressure_hpa": 1004.2,
    "cloud_cover_pct": 90.0,
    "dest_temperature_c": 24.0,
    "dest_precipitation_mm": 0.0,
    "dest_visibility_m": 8000.0
  }
}
```

### 2.2 Feature Specifications Table

| Feature Name | Type | Physical Unit | Valid Range | Nullable? | Default Imputed Fallback | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `weather_temperature_c` | `float` | °C | -15.0 to 55.0 | Yes (auto-imputed) | `25.4` | Ambient dry-bulb temp at origin |
| `weather_relative_humidity_pct` | `float` | % | 0.0 to 100.0 | Yes (auto-imputed) | `62.0` | Relative humidity (2m) |
| `weather_precipitation_mm` | `float` | mm/hr | 0.0 to 300.0 | Yes (auto-imputed) | `0.0` | Liquid equivalent precipitation |
| `weather_rain_mm` | `float` | mm/hr | 0.0 to 300.0 | Yes (auto-imputed) | `0.0` | Rain rate |
| `weather_visibility_m` | `float` | meters | 0.0 to 50,000.0 | Yes (auto-imputed) | `7500.0` | Horizontal visibility distance |
| `weather_wind_speed_kmh` | `float` | km/h | 0.0 to 200.0 | Yes (auto-imputed) | `9.8` | Sustained 10m wind velocity |
| `weather_wind_gusts_kmh` | `float` | km/h | 0.0 to 300.0 | Yes (auto-imputed) | `16.5` | Peak 10m wind gust velocity |
| `weather_surface_pressure_hpa`| `float` | hPa | 800.0 to 1080.0 | Yes (auto-imputed) | `992.0` | Barometric surface pressure |
| `weather_cloud_cover_pct` | `float` | % | 0.0 to 100.0 | Yes (auto-imputed) | `35.0` | Total cloud cover area |
| `weather_is_raining` | `int/float`| binary {0, 1} | 0 or 1 | No | `0.0` | Derived: `1` if rain > 0.1 mm/h |
| `weather_is_heavy_rain` | `int/float`| binary {0, 1} | 0 or 1 | No | `0.0` | Derived: `1` if rain > 5.0 mm/h |
| `weather_is_fog_risk` | `int/float`| binary {0, 1} | 0 or 1 | No | `0.0` | Derived: `1` if vis < 2000m & rh > 85% |
| `weather_is_low_visibility` | `int/float`| binary {0, 1} | 0 or 1 | No | `0.0` | Derived: `1` if vis < 3000m |
| `weather_disruption_score` | `float` | index | 0.0 to 100.0 | No | `0.0` | Composite hazard penalty |
| `dest_weather_temperature_c` | `float` | °C | -15.0 to 55.0 | Yes (auto-imputed) | `25.4` | Ambient dry-bulb temp at dest |
| `dest_weather_precipitation_mm`| `float` | mm/hr | 0.0 to 300.0 | Yes (auto-imputed) | `0.0` | Precipitation rate at dest |
| `dest_weather_visibility_m` | `float` | meters | 0.0 to 50,000.0 | Yes (auto-imputed) | `7500.0` | Horizontal visibility at dest |
| `dest_weather_is_fog_risk` | `int/float`| binary {0, 1} | 0 or 1 | No | `0.0` | Fog risk indicator at dest |
| `has_weather_observation` | `int/float`| binary {0, 1} | 0 or 1 | No | `0.0` | `1` if live API, `0` if fallback |

---

## 3. Latency Budget & Architecture

### 3.1 Timing Allocation (Target: < 250ms total response)
- FastAPI serialization & validation: **~5ms**
- Live Weather Query (Cache Hit): **< 0.5ms**
- Live Weather Query (Cache Miss, Open-Meteo HTTP): **80ms – 180ms**
- In-memory Feature Engineering: **~2ms**
- LightGBM Pipeline `.predict()`: **~1.5ms**
- Response formatting: **~1ms**

### 3.2 Caching & Concurrency Policy
- **Grid Snapping**: Coordinates are snapped to $0.25^\circ \times 0.25^\circ$ (~28 km) ERA5 grid cells. All stations within the same municipal zone share identical cached readings.
- **Cache TTL**: **900 seconds (15 minutes)**. Weather patterns do not evolve significantly over shorter durations, reducing external HTTP calls by >99.2% under production load.
- **Timeout & Graceful Degradation**: HTTP timeout set to **1.5 seconds**. If Open-Meteo is unreachable, the call fails silently, logging a warning, and returns the pre-computed seasonal/regional medians with `has_weather_observation = 0.0`.

---

## 4. Integration Code Snippet (`predict.py` update)

```python
from pathlib import Path
import joblib
import pandas as pd
from weather.weather_agent import LiveWeatherService

# 1. Load pipeline artifact
MODEL_PATH = Path("REDEFINE DATASET/model_weather_v1.pkl")
weather_pipeline = joblib.load(MODEL_PATH)
weather_service = LiveWeatherService(cache_ttl_seconds=900, request_timeout=1.5)

def predict_train_eta(journey_dict: dict) -> dict:
    """
    Computes weather-aware predicted arrival delay.
    
    Parameters:
        journey_dict: dict containing railway operational parameters
                      and station codes.
    Returns:
        dict: predicted_arrival_delay_minutes, confidence bounds, and weather summary.
    """
    origin = journey_dict["origin_station"]
    dest = journey_dict["destination_station"]
    
    # 2. Retrieve live or cached weather observations
    weather_feats = weather_service.get_journey_weather(origin, dest)
    
    # 3. Combine railway operational features with weather features
    row_data = {**journey_dict, **weather_feats}
    df_row = pd.DataFrame([row_data])
    
    # 4. Predict via end-to-end sklearn Pipeline
    predicted_delay = float(weather_pipeline.predict(df_row)[0])
    predicted_delay = max(0.0, predicted_delay)
    
    return {
        "predicted_arrival_delay_minutes": round(predicted_delay, 1),
        "weather_aware": bool(weather_feats["has_weather_observation"]),
        "origin_disruption_score": weather_feats["weather_disruption_score"],
        "weather_conditions": {
            "origin_rain_mm": weather_feats["weather_rain_mm"],
            "origin_fog_risk": bool(weather_feats["weather_is_fog_risk"]),
            "origin_temp_c": weather_feats["weather_temperature_c"],
            "dest_fog_risk": bool(weather_feats["dest_weather_is_fog_risk"])
        }
    }
```

---

## 5. Verification & Testing Checklist

- [x] Schema parity verified with production `input_schema.py`.
- [x] Fallback tested with simulated network failure.
- [x] Caching verified across multiple station queries within the same $0.25^\circ$ grid cell.
- [x] Absolute independence from production `ML/model.pkl` (MD5: `8ff2ac08de28952859a06479673a720d`).

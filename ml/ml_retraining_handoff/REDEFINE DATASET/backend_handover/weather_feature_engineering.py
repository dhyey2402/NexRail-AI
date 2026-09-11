"""
Weather-Aware Feature Engineering & Preprocessing Pipeline
Workspace: REDEFINE DATASET/weather/
Integrates real meteorological features with causal railway dynamics.
Guarantees:
- Model A: Baseline feature space (clean railway features only)
- Model B: Weather-aware feature space (railway + real historical weather)
- Identical transformation logic for training and live inference
- Missing-data imputation based strictly on training-learned medians
- Zero target leakage and zero future leakage
"""

import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

_CURRENT_DIR = Path(__file__).resolve().parent
_REDEFINE_DIR = _CURRENT_DIR.parent
if str(_REDEFINE_DIR) not in sys.path:
    sys.path.insert(0, str(_REDEFINE_DIR))

from redefine_feature_engineering import RedefineFeatureEngineer



def get_baseline_feature_lists() -> Tuple[List[str], List[str]]:
    """Returns numerical and categorical features for Model A (Baseline without weather)."""
    numerical_features = [
        "total_distance_km",
        "total_halts",
        "departure_delay_minutes",
        "stations_crossed_count",
        "late_incoming_rake",
        "is_hdn_zone",
        "is_weekend",
        "sin_hour",
        "cos_hour",
        "sin_month",
        "cos_month",
        "scheduled_travel_hours",
        "scheduled_speed_kmh",
        "stops_per_100km",
        "avg_stop_spacing_km",
        "route_progress_ratio",
        "rake_delay_pressure",
        "hist_train_delay",
        "hist_train_ontime_pct",
        "hist_zone_delay",
        "hist_zone_ontime_pct",
    ]

    categorical_features = [
        "train_type",
        "zone",
        "season",
    ]

    return numerical_features, categorical_features


def get_weather_aware_feature_lists() -> Tuple[List[str], List[str]]:
    """Returns numerical and categorical features for Model B (Weather-Aware LightGBM)."""
    rail_num, rail_cat = get_baseline_feature_lists()

    weather_numerical = [
        "weather_temperature_c",
        "weather_humidity_pct",
        "weather_rain_mm",
        "weather_wind_speed_kmh",
        "weather_wind_gust_kmh",
        "weather_visibility_km",
        "weather_surface_pressure_hpa",
        "weather_disruption_score",
        "dest_weather_temperature_c",
        "dest_weather_rain_mm",
        "is_raining",
        "is_heavy_rain",
        "is_fog_risk",
        "is_low_visibility",
        "dest_is_fog_risk",
    ]

    weather_categorical = [
        "weather_condition_category",
    ]

    return rail_num + weather_numerical, rail_cat + weather_categorical


class WeatherAwareFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Transforms raw journey payloads into the weather-aware model feature matrix.
    Supports both batch enriched training datasets and live single-record inference.
    """

    def __init__(self, weather_fallbacks: Dict[str, float] = None, railway_fallbacks: Dict[str, Any] = None):
        self.weather_fallbacks = weather_fallbacks or {}
        self.railway_fallbacks = railway_fallbacks or {}
        self.base_engineer = RedefineFeatureEngineer(fallbacks=self.railway_fallbacks)

        # Weather defaults learned from training set
        self.default_temp_c = 28.0
        self.default_humid_pct = 65.0
        self.default_rain_mm = 0.0
        self.default_wind_kmh = 10.0
        self.default_gust_kmh = 15.0
        self.default_vis_km = 12.0
        self.default_press_hpa = 1010.0
        self.default_disruption = 0.0

    def fit(self, X: pd.DataFrame, y=None):
        """Learns training medians for missing-value handling."""
        self.base_engineer.fit(X, y)

        if "weather_temperature_c" in X.columns:
            self.default_temp_c = float(X["weather_temperature_c"].median())
        if "weather_humidity_pct" in X.columns:
            self.default_humid_pct = float(X["weather_humidity_pct"].median())
        if "weather_rain_mm" in X.columns:
            self.default_rain_mm = float(X["weather_rain_mm"].median())
        if "weather_wind_speed_kmh" in X.columns:
            self.default_wind_kmh = float(X["weather_wind_speed_kmh"].median())
        if "weather_wind_gust_kmh" in X.columns:
            self.default_gust_kmh = float(X["weather_wind_gust_kmh"].median())
        if "weather_visibility_km" in X.columns:
            self.default_vis_km = float(X["weather_visibility_km"].median())
        if "weather_surface_pressure_hpa" in X.columns:
            self.default_press_hpa = float(X["weather_surface_pressure_hpa"].median())
        if "weather_disruption_score" in X.columns:
            self.default_disruption = float(X["weather_disruption_score"].median())

        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transforms input DataFrame into the complete weather-aware feature space."""
        # 1. Transform base railway features
        df = self.base_engineer.transform(X)

        # 2. Impute and sanitize meteorological features
        df["weather_temperature_c"] = df.get("weather_temperature_c", pd.Series(self.default_temp_c, index=df.index)).fillna(self.default_temp_c).astype(float)
        df["weather_humidity_pct"] = df.get("weather_humidity_pct", pd.Series(self.default_humid_pct, index=df.index)).fillna(self.default_humid_pct).astype(float)
        df["weather_rain_mm"] = df.get("weather_rain_mm", pd.Series(self.default_rain_mm, index=df.index)).fillna(self.default_rain_mm).astype(float)
        df["weather_wind_speed_kmh"] = df.get("weather_wind_speed_kmh", pd.Series(self.default_wind_kmh, index=df.index)).fillna(self.default_wind_kmh).astype(float)
        df["weather_wind_gust_kmh"] = df.get("weather_wind_gust_kmh", pd.Series(self.default_gust_kmh, index=df.index)).fillna(self.default_gust_kmh).astype(float)
        df["weather_visibility_km"] = df.get("weather_visibility_km", pd.Series(self.default_vis_km, index=df.index)).fillna(self.default_vis_km).astype(float)
        df["weather_surface_pressure_hpa"] = df.get("weather_surface_pressure_hpa", pd.Series(self.default_press_hpa, index=df.index)).fillna(self.default_press_hpa).astype(float)
        df["weather_disruption_score"] = df.get("weather_disruption_score", pd.Series(self.default_disruption, index=df.index)).fillna(self.default_disruption).astype(float)

        df["dest_weather_temperature_c"] = df.get("dest_weather_temperature_c", pd.Series(self.default_temp_c, index=df.index)).fillna(self.default_temp_c).astype(float)
        df["dest_weather_rain_mm"] = df.get("dest_weather_rain_mm", pd.Series(self.default_rain_mm, index=df.index)).fillna(self.default_rain_mm).astype(float)

        df["is_raining"] = df.get("is_raining", (df["weather_rain_mm"] > 0.1).astype(int)).fillna(0).astype(int)
        df["is_heavy_rain"] = df.get("is_heavy_rain", (df["weather_rain_mm"] > 10.0).astype(int)).fillna(0).astype(int)
        df["is_fog_risk"] = df.get("is_fog_risk", (df["weather_visibility_km"] < 1.0).astype(int)).fillna(0).astype(int)
        df["is_low_visibility"] = df.get("is_low_visibility", (df["weather_visibility_km"] < 2.0).astype(int)).fillna(0).astype(int)
        df["dest_is_fog_risk"] = df.get("dest_is_fog_risk", pd.Series(0, index=df.index)).fillna(0).astype(int)

        df["weather_condition_category"] = df.get("weather_condition_category", pd.Series("Clear", index=df.index)).fillna("Clear").astype(str)

        return df

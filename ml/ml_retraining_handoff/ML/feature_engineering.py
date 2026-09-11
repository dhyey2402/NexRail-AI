"""
Feature engineering and transformation pipeline for Train Delay & ETA prediction.
Designed to guarantee identical transformations during both training and single/batch inference.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from config import (
    DROP_COLS,
    LEAKAGE_COLS,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    BOOLEAN_FEATURES,
)


class RailwayFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Extracts domain-specific railway features from raw journey records.
    Calculates operational speeds, stop frequencies, composite risk metrics,
    cyclical temporal encodings, and training-learned target aggregations.
    """

    def __init__(self):
        self.global_target_mean_ = 0.0
        self.train_type_delay_map_ = {}
        self.zone_delay_map_ = {}
        self.traction_delay_map_ = {}
        self.feature_names_out_ = []

    def fit(self, X: pd.DataFrame, y=None):
        """
        Learns training-set target aggregations strictly without data leakage.
        """
        df = X.copy()
        if y is not None:
            df["_target"] = np.array(y)
            self.global_target_mean_ = float(df["_target"].mean())
            self.train_type_delay_map_ = df.groupby("train_type")["_target"].mean().to_dict()
            self.zone_delay_map_ = df.groupby("zone_abbr")["_target"].mean().to_dict()
            self.traction_delay_map_ = df.groupby("traction_type")["_target"].mean().to_dict()
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms input records into the complete modeled feature space.
        """
        df = X.copy()

        # 1. Drop identifiers, leakage, and zero-variance columns if present
        cols_to_remove = [c for c in DROP_COLS + LEAKAGE_COLS if c in df.columns]
        if cols_to_remove:
            df = df.drop(columns=cols_to_remove)

        # 2. Temporal & Cyclical Features
        if "departure_hour" in df.columns:
            hour = df["departure_hour"].astype(float)
            df["sin_hour"] = np.sin(2 * np.pi * hour / 24.0)
            df["cos_hour"] = np.cos(2 * np.pi * hour / 24.0)
        else:
            df["sin_hour"] = 0.0
            df["cos_hour"] = 0.0

        if "month" in df.columns:
            month = df["month"].astype(float)
            df["sin_month"] = np.sin(2 * np.pi * month / 12.0)
            df["cos_month"] = np.cos(2 * np.pi * month / 12.0)
        else:
            df["sin_month"] = 0.0
            df["cos_month"] = 0.0

        # 3. Operational Speed & Density Metrics
        dist = df["distance_km"].astype(float).clip(lower=1.0)
        hours = df["scheduled_travel_hours"].astype(float).clip(lower=0.1)
        stops = df["num_scheduled_stops"].astype(float).clip(lower=0.0)
        psr = df["psr_count"].astype(float).clip(lower=0.0)

        df["scheduled_speed_kmh"] = dist / hours
        df["stops_per_100km"] = stops / (dist / 100.0)
        df["psr_per_100km"] = psr / (dist / 100.0)
        df["avg_stop_spacing_km"] = dist / (stops + 1.0)

        # 4. Composite Risk & Environmental Indices
        zone_cong = df["zone_congestion_index"].astype(float)
        season_sev = df["season_severity_score"].astype(float)
        fog_risk = df["fog_risk_score"].astype(float)
        zone_fog = df["zone_fog_index"].astype(float)

        df["composite_congestion_risk"] = zone_cong * season_sev
        df["composite_fog_risk"] = fog_risk * zone_fog

        # 5. Equipment Degradation & Rake Turnaround Dynamics
        loco_age = df["loco_age_years"].astype(float)
        coach_age = df["coach_age_years"].astype(float)
        maint_score = df["maintenance_score"].astype(float)
        late_rake = df["late_incoming_rake"].astype(float)
        shared_rake = df["is_rake_shared"].astype(float)

        df["avg_rolling_stock_age"] = (loco_age + coach_age) / 2.0
        df["maintenance_deficit"] = (10.0 - maint_score) * (df["avg_rolling_stock_age"] / 20.0)
        df["rake_delay_pressure"] = late_rake * (1.0 + 0.5 * shared_rake)

        # 6. Infrastructure & Capacity Pressure
        track_dbl = df["track_doubled"].astype(float)
        hdn = df["is_hdn_route"].astype(float)
        df["single_track_hdn_bottleneck"] = (1.0 - track_dbl) * hdn

        # 7. Training-Learned Historical Target Encodings (with safe fallback)
        df["hist_train_type_avg_delay"] = (
            df["train_type"]
            .map(self.train_type_delay_map_)
            .fillna(self.global_target_mean_)
        )
        df["hist_zone_avg_delay"] = (
            df["zone_abbr"]
            .map(self.zone_delay_map_)
            .fillna(self.global_target_mean_)
        )
        df["hist_traction_avg_delay"] = (
            df["traction_type"]
            .map(self.traction_delay_map_)
            .fillna(self.global_target_mean_)
        )

        return df


def get_feature_lists():
    """
    Returns configured lists of numerical, categorical, and engineered feature names.
    """
    engineered_numerical = [
        "sin_hour",
        "cos_hour",
        "sin_month",
        "cos_month",
        "scheduled_speed_kmh",
        "stops_per_100km",
        "psr_per_100km",
        "avg_stop_spacing_km",
        "composite_congestion_risk",
        "composite_fog_risk",
        "avg_rolling_stock_age",
        "maintenance_deficit",
        "rake_delay_pressure",
        "single_track_hdn_bottleneck",
        "hist_train_type_avg_delay",
        "hist_zone_avg_delay",
        "hist_traction_avg_delay",
    ]

    all_numerical = NUMERICAL_FEATURES + BOOLEAN_FEATURES + engineered_numerical
    all_categorical = CATEGORICAL_FEATURES

    return all_numerical, all_categorical

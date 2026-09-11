"""
Feature Engineering & Causal Transformation Pipeline for SIH 2026 Train ETA System
Workspace: REDEFINE DATASET/
Guarantees strict causal historical features:
- route_historical_ontime_pct is permanently excluded as leaked raw feature
- Point-in-time expanding historical statistics computed strictly before departure timestamp
- Current row target is strictly excluded (allow_exact_matches=False on arrival event log)
- Hierarchical training-only fallbacks for unobserved trains/zones
- Supports both batch dataset processing and single-record live inference
"""

from typing import Tuple, List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from redefine_config import (
    DROP_COLS,
    RAW_NUMERICAL_FEATURES,
    RAW_CATEGORICAL_FEATURES,
    TRAIN_CUTOFF_DATE,
)


def compute_causal_historical_features(
    df: pd.DataFrame,
    train_cutoff_date: str = TRAIN_CUTOFF_DATE,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Computes strictly causal point-in-time historical delay and punctuality statistics
    for all journeys in the dataset using an arrival event log backward as-of merge.
    
    Mathematical Formulation:
    For journey i departing at scheduled timestamp T_dep(i):
    Historical records H(i) = { journey j | actual_arrival(j) < scheduled_departure(i) }
    
    Guarantees:
    - Zero future leakage: only trips arrived strictly BEFORE current scheduled departure are included.
    - Zero current-row target leakage: journey i's own arrival time is strictly after its departure,
      and allow_exact_matches=False guarantees strict inequality (< T_dep).
    - Split isolation: training records only match earlier training arrivals; validation records only
      match earlier arrivals; holdout records never influence earlier splits.
    - Fallback integrity: journeys with no prior history use training-only baseline aggregates.
    """
    data = df.copy()

    # Ensure datetime parsing
    sched_dep_col = "sched_dep_dt" if "sched_dep_dt" in data.columns else "_sched_dep_dt"
    actual_arr_col = "actual_arr_dt" if "actual_arr_dt" in data.columns else "_actual_arr_dt"

    data[sched_dep_col] = pd.to_datetime(data["scheduled_departure"])
    data[actual_arr_col] = pd.to_datetime(data["actual_arrival"])
    data["_is_on_time"] = (data["arrival_delay_minutes"] <= 15.0).astype(int)

    # 1. Train-level Arrival Event Stream
    train_log = data[["train_number", actual_arr_col, "arrival_delay_minutes", "_is_on_time"]].sort_values(actual_arr_col).reset_index(drop=True)
    train_log["cum_delay"] = train_log.groupby("train_number")["arrival_delay_minutes"].cumsum()
    train_log["cum_ontime"] = train_log.groupby("train_number")["_is_on_time"].cumsum()
    train_log["cum_count"] = train_log.groupby("train_number").cumcount() + 1

    # Query prediction events by scheduled departure
    df_sorted = data.sort_values(sched_dep_col).reset_index()

    m_train = pd.merge_asof(
        df_sorted[["index", "train_number", sched_dep_col]],
        train_log[["train_number", actual_arr_col, "cum_delay", "cum_ontime", "cum_count"]],
        by="train_number",
        left_on=sched_dep_col,
        right_on=actual_arr_col,
        direction="backward",
        allow_exact_matches=False,
    ).sort_values("index").reset_index(drop=True)

    data["hist_train_delay"] = m_train["cum_delay"] / m_train["cum_count"]
    data["hist_train_ontime_pct"] = (m_train["cum_ontime"] / m_train["cum_count"]) * 100.0

    # 2. Zone-level Arrival Event Stream
    zone_log = data[["zone", actual_arr_col, "arrival_delay_minutes", "_is_on_time"]].sort_values(actual_arr_col).reset_index(drop=True)
    zone_log["cum_delay"] = zone_log.groupby("zone")["arrival_delay_minutes"].cumsum()
    zone_log["cum_ontime"] = zone_log.groupby("zone")["_is_on_time"].cumsum()
    zone_log["cum_count"] = zone_log.groupby("zone").cumcount() + 1

    m_zone = pd.merge_asof(
        df_sorted[["index", "zone", sched_dep_col]],
        zone_log[["zone", actual_arr_col, "cum_delay", "cum_ontime", "cum_count"]],
        by="zone",
        left_on=sched_dep_col,
        right_on=actual_arr_col,
        direction="backward",
        allow_exact_matches=False,
    ).sort_values("index").reset_index(drop=True)

    data["hist_zone_delay"] = m_zone["cum_delay"] / m_zone["cum_count"]
    data["hist_zone_ontime_pct"] = (m_zone["cum_ontime"] / m_zone["cum_count"]) * 100.0

    # 3. Compute Hierarchical Training-Only Fallbacks
    train_mask = data["date"] <= train_cutoff_date
    train_subset = data[train_mask]

    global_train_delay = float(train_subset["arrival_delay_minutes"].mean())
    global_train_ontime = float(train_subset["_is_on_time"].mean() * 100.0)

    train_type_delay_map = train_subset.groupby("train_type")["arrival_delay_minutes"].mean().to_dict()
    train_type_ontime_map = (train_subset.groupby("train_type")["_is_on_time"].mean() * 100.0).to_dict()

    # Pre-compute latest training snapshots per train and zone for single-record inference lookup
    train_latest_delay = train_subset.groupby("train_number")["arrival_delay_minutes"].mean().to_dict()
    train_latest_ontime = (train_subset.groupby("train_number")["_is_on_time"].mean() * 100.0).to_dict()

    zone_latest_delay = train_subset.groupby("zone")["arrival_delay_minutes"].mean().to_dict()
    zone_latest_ontime = (train_subset.groupby("zone")["_is_on_time"].mean() * 100.0).to_dict()

    # 4. Fill Missing Prior History with Training-Only Hierarchical Fallback
    # Fallback sequence: train_type training baseline -> global training baseline
    train_type_delay_fallback = data["train_type"].map(train_type_delay_map).fillna(global_train_delay)
    train_type_ontime_fallback = data["train_type"].map(train_type_ontime_map).fillna(global_train_ontime)

    data["hist_train_delay"] = data["hist_train_delay"].fillna(train_type_delay_fallback)
    data["hist_train_ontime_pct"] = data["hist_train_ontime_pct"].fillna(train_type_ontime_fallback)

    data["hist_zone_delay"] = data["hist_zone_delay"].fillna(global_train_delay)
    data["hist_zone_ontime_pct"] = data["hist_zone_ontime_pct"].fillna(global_train_ontime)

    # Clean temporary columns
    data = data.drop(columns=[sched_dep_col, actual_arr_col, "_is_on_time"], errors="ignore")

    fallbacks = {
        "global_train_delay": global_train_delay,
        "global_train_ontime": global_train_ontime,
        "train_type_delay_map": train_type_delay_map,
        "train_type_ontime_map": train_type_ontime_map,
        "train_latest_delay": train_latest_delay,
        "train_latest_ontime": train_latest_ontime,
        "zone_latest_delay": zone_latest_delay,
        "zone_latest_ontime": zone_latest_ontime,
    }

    return data, fallbacks


class RedefineFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Transforms raw and precomputed train journey records into the clean model feature space.
    - Eliminates all leaked features (DROP_COLS including route_historical_ontime_pct)
    - Computes authentic departure hour and scheduled travel duration
    - Computes cyclical time encodings (hour, month)
    - Computes operational speed, stop spacing, and progress ratios
    - Computes late rake turnover delay interaction
    - Integrates causal expanding historical features with training lookup fallbacks
    """

    def __init__(self, fallbacks: Dict[str, Any] = None):
        self.fallbacks = fallbacks or {}
        self.global_train_delay_ = 30.0
        self.global_train_ontime_ = 70.0
        self.train_type_delay_map_ = {}
        self.train_type_ontime_map_ = {}
        self.train_latest_delay_ = {}
        self.train_latest_ontime_ = {}
        self.zone_latest_delay_ = {}
        self.zone_latest_ontime_ = {}

    def fit(self, X: pd.DataFrame, y=None):
        """
        Stores training-learned historical lookups and fallbacks.
        """
        if self.fallbacks:
            self.global_train_delay_ = self.fallbacks.get("global_train_delay", 29.45)
            self.global_train_ontime_ = self.fallbacks.get("global_train_ontime", 66.90)
            self.train_type_delay_map_ = self.fallbacks.get("train_type_delay_map", {})
            self.train_type_ontime_map_ = self.fallbacks.get("train_type_ontime_map", {})
            self.train_latest_delay_ = self.fallbacks.get("train_latest_delay", {})
            self.train_latest_ontime_ = self.fallbacks.get("train_latest_ontime", {})
            self.zone_latest_delay_ = self.fallbacks.get("zone_latest_delay", {})
            self.zone_latest_ontime_ = self.fallbacks.get("zone_latest_ontime", {})
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms raw journey records into the feature-engineered matrix.
        """
        df = X.copy()

        # 1. Permanently Drop Leakage, Duplicates, and Zero-Variance Columns
        cols_to_remove = [c for c in DROP_COLS if c in df.columns]
        if cols_to_remove:
            df = df.drop(columns=cols_to_remove)

        # 2. Extract Authentic Departure Hour and Travel Duration
        if "scheduled_departure" in df.columns and "scheduled_arrival" in df.columns:
            sched_dep = pd.to_datetime(df["scheduled_departure"], errors="coerce")
            sched_arr = pd.to_datetime(df["scheduled_arrival"], errors="coerce")

            dep_hour = sched_dep.dt.hour.fillna(12.0).astype(float)
            travel_hours = ((sched_arr - sched_dep).dt.total_seconds() / 3600.0).fillna(10.0)
            travel_hours = travel_hours.clip(lower=0.1)
        else:
            dep_hour = df.get("departure_hour", pd.Series(12.0, index=df.index)).astype(float)
            travel_hours = df.get("scheduled_travel_hours", pd.Series(10.0, index=df.index)).astype(float).clip(lower=0.1)

        # 3. Cyclical Temporal Encodings
        df["sin_hour"] = np.sin(2 * np.pi * dep_hour / 24.0)
        df["cos_hour"] = np.cos(2 * np.pi * dep_hour / 24.0)

        if "month" in df.columns:
            m = df["month"].astype(float)
        elif "date" in df.columns:
            m = pd.to_datetime(df["date"], errors="coerce").dt.month.fillna(6.0).astype(float)
        elif "departure_date" in df.columns:
            m = pd.to_datetime(df["departure_date"], errors="coerce").dt.month.fillna(6.0).astype(float)
        else:
            m = pd.Series(6.0, index=df.index)

        df["sin_month"] = np.sin(2 * np.pi * m / 12.0)
        df["cos_month"] = np.cos(2 * np.pi * m / 12.0)

        # 4. Operational Speed, Stop Density & Journey Progress
        dist_col = "total_distance_km" if "total_distance_km" in df.columns else "distance_km"
        halts_col = "total_halts" if "total_halts" in df.columns else "num_scheduled_stops"

        dist = df.get(dist_col, pd.Series(250.0, index=df.index)).astype(float).clip(lower=1.0)
        halts = df.get(halts_col, pd.Series(10.0, index=df.index)).astype(float).clip(lower=0.0)

        df["total_distance_km"] = dist
        df["total_halts"] = halts
        df["scheduled_travel_hours"] = travel_hours
        df["scheduled_speed_kmh"] = dist / travel_hours
        df["stops_per_100km"] = halts / (dist / 100.0)
        df["avg_stop_spacing_km"] = dist / (halts + 1.0)

        crossed = df.get("stations_crossed_count", pd.Series(0.0, index=df.index)).fillna(0.0).astype(float)
        df["stations_crossed_count"] = crossed
        df["route_progress_ratio"] = crossed / (halts + 1.0)

        # 5. Dynamic Delay & Turnaround Pressure
        dep_delay = df.get("departure_delay_minutes", pd.Series(0.0, index=df.index)).fillna(0.0).astype(float)
        df["departure_delay_minutes"] = dep_delay
        rake_late = df.get("late_incoming_rake", pd.Series(0.0, index=df.index)).fillna(0.0).astype(float)
        df["late_incoming_rake"] = rake_late
        df["rake_delay_pressure"] = rake_late * dep_delay.clip(lower=0.0)

        # 6. Historical Delay & Punctuality Lookups (Inference or Precomputed Fallback)
        if "hist_train_delay" not in df.columns:
            if "train_number" in df.columns:
                train_num_series = df["train_number"]
                type_fallback = df.get("train_type", pd.Series("EXP-TRAINS", index=df.index)).map(self.train_type_delay_map_).fillna(self.global_train_delay_)
                df["hist_train_delay"] = train_num_series.map(self.train_latest_delay_).fillna(type_fallback)
            else:
                df["hist_train_delay"] = self.global_train_delay_

        if "hist_train_ontime_pct" not in df.columns:
            if "train_number" in df.columns:
                train_num_series = df["train_number"]
                type_fallback = df.get("train_type", pd.Series("EXP-TRAINS", index=df.index)).map(self.train_type_ontime_map_).fillna(self.global_train_ontime_)
                df["hist_train_ontime_pct"] = train_num_series.map(self.train_latest_ontime_).fillna(type_fallback)
            else:
                df["hist_train_ontime_pct"] = self.global_train_ontime_

        if "hist_zone_delay" not in df.columns:
            zone_col = "zone" if "zone" in df.columns else "zone_abbr"
            if zone_col in df.columns:
                df["hist_zone_delay"] = df[zone_col].map(self.zone_latest_delay_).fillna(self.global_train_delay_)
            else:
                df["hist_zone_delay"] = self.global_train_delay_

        if "hist_zone_ontime_pct" not in df.columns:
            zone_col = "zone" if "zone" in df.columns else "zone_abbr"
            if zone_col in df.columns:
                df["hist_zone_ontime_pct"] = df[zone_col].map(self.zone_latest_ontime_).fillna(self.global_train_ontime_)
            else:
                df["hist_zone_ontime_pct"] = self.global_train_ontime_

        # Ensure standard types
        df["is_hdn_zone"] = df.get("is_hdn_zone", pd.Series(0, index=df.index)).fillna(0).astype(int)
        df["is_weekend"] = df.get("is_weekend", pd.Series(0, index=df.index)).fillna(0).astype(int)

        df["train_type"] = df.get("train_type", pd.Series("EXP-TRAINS", index=df.index)).astype(str)
        df["zone"] = df.get("zone", df.get("zone_abbr", pd.Series("NR", index=df.index))).astype(str)
        df["season"] = df.get("season", pd.Series("Winter", index=df.index)).astype(str)

        return df


def get_modeled_feature_lists() -> Tuple[List[str], List[str]]:
    """
    Returns ordered lists of numerical and categorical features fed to the final clean estimator.
    route_historical_ontime_pct is permanently omitted.
    Strictly causal expanding features are included.
    """
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

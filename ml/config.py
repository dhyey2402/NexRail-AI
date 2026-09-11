"""
Global configuration for SIH 2026 Train Delay & ETA Prediction System.
Defines directory paths, feature schemas, model hyperparameters, and constants.
"""

from pathlib import Path

# Base Paths
ML_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = ML_DIR.parent
DATA_DIR = PROJECT_ROOT / "indian-railways-predict-train-delay"
ARCHIVE_DIR = PROJECT_ROOT / "archive"
RESULTS_DIR = ML_DIR / "results"
TESTS_DIR = ML_DIR / "tests"

# Data Files
TRAIN_CSV = DATA_DIR / "ir_train.csv"
TEST_CSV = DATA_DIR / "ir_test.csv"
DATA_DICT_CSV = DATA_DIR / "ir_data_dictionary.csv"

# Saved Artifacts
MODEL_PATH = ML_DIR / "model.pkl"
METADATA_PATH = ML_DIR / "model_metadata.pkl"
METRICS_JSON = RESULTS_DIR / "metrics.json"
MODEL_COMPARISON_CSV = RESULTS_DIR / "model_comparison.csv"
FEATURE_IMPORTANCE_CSV = RESULTS_DIR / "feature_importance.csv"
FEATURE_IMPORTANCE_PNG = RESULTS_DIR / "feature_importance.png"

# Split Parameters (Chronological)
TRAIN_MAX_YEAR = 2022   # 2018-2022 for Training (~71.3% / 1,070,215 rows)
VAL_YEAR = 2023         # 2023 for Validation (~14.4% / 215,538 rows)
TEST_YEAR = 2024        # 2024 for Local Evaluation Holdout (~14.3% / 214,247 rows)
RANDOM_STATE = 42

# Column Designations
TARGET_COL = "delay_minutes"
CLASSIFICATION_TARGET = "is_delayed"
ID_COL = "journey_id"

LEAKAGE_COLS = [
    "primary_delay_cause",
    "is_delayed",
]

DROP_COLS = [
    "journey_id",
    "zone",             # Redundant with zone_abbr
    "is_overloaded",     # Constant 0 in all 1.5M rows (zero variance)
]

# Raw Feature Groups (present in ir_train.csv and ir_test.csv)
NUMERICAL_FEATURES = [
    "distance_km",
    "num_scheduled_stops",
    "scheduled_travel_hours",
    "psr_count",
    "fog_risk_score",
    "zone_fog_index",
    "zone_congestion_index",
    "season_severity_score",
    "loco_age_years",
    "coach_age_years",
    "maintenance_score",
    "seat_utilisation_pct",
    "route_historical_ontime_pct",
]

BOOLEAN_FEATURES = [
    "is_weekend",
    "is_night_departure",
    "is_peak_hour",
    "is_festival_season",
    "track_doubled",
    "is_hdn_route",
    "is_electrified",
    "is_circular_route",
    "is_monsoon_season",
    "is_fog_risk",
    "has_lhb_coaches",
    "is_rake_shared",
    "late_incoming_rake",
    "is_special_train",
]

CATEGORICAL_FEATURES = [
    "train_type",
    "zone_abbr",
    "source_station_category",
    "destination_station_category",
    "season",
    "traction_type",
]

DATETIME_COLS = [
    "departure_date",
    "year",
    "month",
    "day_of_week",
    "departure_hour",
]

# XGBoost Hyperparameters
XGB_PARAMS = {
    "n_estimators": 500,
    "max_depth": 8,
    "learning_rate": 0.05,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "tree_method": "hist",
    "objective": "reg:squarederror",
    "n_jobs": -1,
    "random_state": RANDOM_STATE,
}

# Supported Live Features vs Features Requiring Retraining
LIVE_FEATURE_SUPPORT = {
    # Supported by current model
    "train_number": True,
    "train_type": True,
    "zone_abbr": True,
    "distance_km": True,
    "num_scheduled_stops": True,
    "scheduled_travel_hours": True,
    "late_incoming_rake": True,
    "track_doubled": True,
    "is_hdn_route": True,
    "traction_type": True,
    "psr_count": True,
    "zone_congestion_index": True,
    "route_historical_ontime_pct": True,
    "maintenance_score": True,
    "seat_utilisation_pct": True,
    "scheduled_arrival": True,
    # Unsupported in historical training data (requires retraining with operational telemetry)
    "current_speed": False,
    "speed_deviation": False,
    "live_rainfall": False,
    "live_temperature": False,
    "live_visibility": False,
    "live_wind_speed": False,
    "weather_condition": False,
}
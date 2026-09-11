"""
Configuration for SIH 2026 Train Delay & ETA Prediction Experimental Pipeline
Workspace: REDEFINE DATASET/
Target: Dynamic ETA & Delay Forecast for Coaching Trains (PS ID 26028)
Ensures strict zero temporal leakage, causal historical features, and split isolation.
"""

from pathlib import Path

# Paths
REDEFINE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = REDEFINE_DIR.parent
PROD_ML_DIR = PROJECT_ROOT / "ML"
RESULTS_DIR = REDEFINE_DIR / "results"

# Data Files
NEW_DATASET_CSV = REDEFINE_DIR / "ml_training_dataset.csv"

# Saved Candidate Artifacts (DO NOT OVERWRITE ML/model.pkl!)
MODEL_NEW_CLEAN_PATH = REDEFINE_DIR / "model_new_clean.pkl"
METADATA_NEW_CLEAN_PATH = REDEFINE_DIR / "model_new_clean_metadata.pkl"

# Legacy Candidate Path (Deprecated due to leaked route_historical_ontime_pct)
MODEL_NEW_PATH = REDEFINE_DIR / "model_new.pkl"
METADATA_NEW_PATH = REDEFINE_DIR / "model_new_metadata.pkl"

# Production Model Path (READ-ONLY BASELINE - NEVER OVERWRITE)
OLD_MODEL_PATH = PROD_ML_DIR / "model.pkl"
OLD_METADATA_PATH = PROD_ML_DIR / "model_metadata.pkl"

# Clean Result Files
MODEL_COMPARISON_CLEAN_CSV = RESULTS_DIR / "model_comparison_clean.csv"
MODEL_COMPARISON_CLEAN_JSON = RESULTS_DIR / "model_comparison_clean.json"
CLEAN_MODEL_METRICS_JSON = RESULTS_DIR / "clean_model_metrics.json"
CLEAN_FEATURE_IMPORTANCE_CSV = RESULTS_DIR / "clean_model_feature_importance.csv"
CLEAN_FEATURE_IMPORTANCE_PNG = RESULTS_DIR / "clean_model_feature_importance.png"
CLEAN_SHAP_SUMMARY_PNG = RESULTS_DIR / "clean_shap_summary.png"
LEAKAGE_FIXED_REPORT_MD = RESULTS_DIR / "leakage_fixed_report.md"

# Legacy Result Files (for backward reference)
MODEL_COMPARISON_CSV = RESULTS_DIR / "model_comparison_old_vs_new.csv"
MODEL_COMPARISON_JSON = RESULTS_DIR / "model_comparison_old_vs_new.json"
NEW_MODEL_METRICS_JSON = RESULTS_DIR / "new_model_metrics.json"
FEATURE_IMPORTANCE_CSV = RESULTS_DIR / "new_model_feature_importance.csv"
FEATURE_IMPORTANCE_PNG = RESULTS_DIR / "new_model_feature_importance.png"
COMPARISON_REPORT_MD = RESULTS_DIR / "comparison_report.md"
INSPECTION_REPORT_MD = RESULTS_DIR / "dataset_inspection_report.md"

# Chronological Split Thresholds
# Total span: 2025-02-08 to 2026-02-07 (365 calendar days)
TRAIN_CUTOFF_DATE = "2025-10-31"   # Train: Feb 8, 2025 - Oct 31, 2025 (~1,354,993 rows, ~73.1%)
VAL_CUTOFF_DATE = "2025-12-31"     # Validation: Nov 1, 2025 - Dec 31, 2025 (~308,873 rows, ~16.7%)
TEST_START_DATE = "2026-01-01"     # Unseen Holdout: Jan 1, 2026 - Feb 7, 2026 (~189,376 rows, ~10.2%)
RANDOM_STATE = 42

# Target Definition
TARGET_COL = "arrival_delay_minutes"
CORRUPTED_TARGET_THRESHOLD = 10000.0  # Filters the 6 year-rollover typo records (>500,000 min)

# Blacklist: Direct Leaks, Duplicates, and Zero-Variance Fields
DIRECT_LEAKAGE_COLS = [
    "actual_arrival",              # Directly gives away arrival delay (actual - scheduled)
    "on_time",                     # Derived directly from arrival_delay <= 15
    "route_completion_status",     # Post-hoc journey outcome
    "average_delay",               # Pre-calculated target mean across whole dataset
    "median_delay",                # Pre-calculated target median across whole dataset
    "delay_std",                   # Pre-calculated target standard deviation
    "percentile_90_delay",         # Pre-calculated target 90th percentile
    "average_delay_by_train",      # Pre-calculated train target mean across whole dataset
    "average_delay_by_zone",       # Pre-calculated zone target mean across whole dataset
    "route_historical_ontime_pct", # CRITICAL AUDIT FINDING: Pre-calculated full-dataset train on-time mean
]

DUPLICATE_AND_CORRUPT_COLS = [
    "final_delay_minutes",         # 100% duplicate of arrival_delay_minutes
    "current_delay",               # 100% duplicate of departure_delay_minutes
    "distance_km",                 # 100% duplicate of total_distance_km
    "total_stops",                 # 99.09% duplicate of total_halts
    "cancellation_status",         # Constant 0 across all 1.85M rows (zero variance)
    "scheduled_dep_hour",          # Hardcoded constant 12 across all rows (corrupt)
]

DROP_COLS = DIRECT_LEAKAGE_COLS + DUPLICATE_AND_CORRUPT_COLS

# Base Numerical Features in Raw Dataset (Free of Leakage)
RAW_NUMERICAL_FEATURES = [
    "total_distance_km",
    "total_halts",
    "departure_delay_minutes",
    "stations_crossed_count",
    "late_incoming_rake",
    "is_hdn_zone",
    "is_weekend",
]

# Raw Categorical Features
RAW_CATEGORICAL_FEATURES = [
    "train_type",
    "zone",
    "season",
]

# Datetime Fields for Engineering
RAW_DATETIME_COLS = [
    "date",
    "scheduled_departure",
    "scheduled_arrival",
    "actual_departure",
]

# LightGBM Clean Candidate Hyperparameters
LGBM_PARAMS = {
    "objective": "regression",
    "metric": "mae",
    "boosting_type": "gbdt",
    "n_estimators": 350,
    "learning_rate": 0.05,
    "num_leaves": 63,
    "max_depth": 8,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
    "verbose": -1,
}

"""
Weather-Aware LightGBM Retraining & Ablation Evaluation Pipeline
Workspace: REDEFINE DATASET/weather/
Trains and benchmarks:
- MODEL A (Baseline): Clean causal railway features only (No weather)
- MODEL B (Weather-Aware): Causal railway features + Real historical weather features
Evaluates:
- Identical chronological splits (Train, Validation, 2026 Unseen Holdout)
- MAE, RMSE, R², MedAE, ±5/10/15/30 min accuracy, P90/P95/P99, signed error
- Ablation analysis across weather conditions (Rain, Heavy Rain, Fog, Severe weather)
- Saves model_weather_v1.pkl and model_weather_v1_metadata.pkl
- STRICTLY PRESERVES ML/model.pkl
"""

import json
import sys
import time
from datetime import datetime
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

import lightgbm as lgb

WEATHER_DIR = Path(__file__).resolve().parent
REDEFINE_DIR = WEATHER_DIR.parent
PROJECT_ROOT = REDEFINE_DIR.parent

if str(REDEFINE_DIR) not in sys.path:
    sys.path.insert(0, str(REDEFINE_DIR))
if str(WEATHER_DIR) not in sys.path:
    sys.path.insert(0, str(WEATHER_DIR))

from redefine_config import (
    TARGET_COL,
    TRAIN_CUTOFF_DATE,
    VAL_CUTOFF_DATE,
    TEST_START_DATE,
    RANDOM_STATE,
    LGBM_PARAMS,
    RESULTS_DIR,
)
from weather_feature_engineering import (
    WeatherAwareFeatureEngineer,
    get_baseline_feature_lists,
    get_weather_aware_feature_lists,
)

ENRICHED_DATASET_CSV = REDEFINE_DIR / "ml_training_dataset_weather.csv"
MODEL_WEATHER_V1_PATH = REDEFINE_DIR / "model_weather_v1.pkl"
METADATA_WEATHER_V1_PATH = REDEFINE_DIR / "model_weather_v1_metadata.pkl"

WEATHER_COMPARISON_CSV = RESULTS_DIR / "weather_model_comparison.csv"
WEATHER_COMPARISON_JSON = RESULTS_DIR / "weather_model_comparison.json"
WEATHER_METRICS_JSON = RESULTS_DIR / "weather_model_metrics.json"
WEATHER_FI_CSV = RESULTS_DIR / "weather_feature_importance.csv"
WEATHER_FI_PNG = RESULTS_DIR / "weather_feature_importance.png"


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Computes operational and statistical regression metrics with non-negative clipping."""
    y_pred_clipped = np.clip(y_pred, 0.0, None)
    y_true_clipped = np.clip(y_true, 0.0, None)
    abs_errors = np.abs(y_true_clipped - y_pred_clipped)
    signed_errors = y_pred_clipped - y_true_clipped

    mae = float(mean_absolute_error(y_true_clipped, y_pred_clipped))
    rmse = float(np.sqrt(mean_squared_error(y_true_clipped, y_pred_clipped)))
    r2 = float(r2_score(y_true_clipped, y_pred_clipped))
    medae = float(np.median(abs_errors))

    pct_5 = float((abs_errors <= 5.0).mean() * 100.0)
    pct_10 = float((abs_errors <= 10.0).mean() * 100.0)
    pct_15 = float((abs_errors <= 15.0).mean() * 100.0)
    pct_30 = float((abs_errors <= 30.0).mean() * 100.0)

    p90 = float(np.percentile(abs_errors, 90.0))
    p95 = float(np.percentile(abs_errors, 95.0))
    p99 = float(np.percentile(abs_errors, 99.0))

    mean_signed = float(np.mean(signed_errors))
    median_signed = float(np.median(signed_errors))

    return {
        "MAE": round(mae, 3),
        "RMSE": round(rmse, 3),
        "R2": round(r2, 4),
        "MedAE": round(medae, 3),
        "within_5_min": round(pct_5, 2),
        "within_10_min": round(pct_10, 2),
        "within_15_min": round(pct_15, 2),
        "within_30_min": round(pct_30, 2),
        "p90_abs_err": round(p90, 3),
        "p95_abs_err": round(p95, 3),
        "p99_abs_err": round(p99, 3),
        "mean_signed_err": round(mean_signed, 3),
        "median_signed_err": round(median_signed, 3),
    }


def main():
    total_start = time.time()
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("WEATHER-AWARE MODEL RETRAINING & ABLATION BENCHMARK (SIH 2026)")
    print("=" * 80)

    # 1. Load Weather-Enriched Dataset
    print(f"\n[1/6] Loading enriched dataset from '{ENRICHED_DATASET_CSV}'...")
    df = pd.read_csv(ENRICHED_DATASET_CSV)
    print(f"Loaded {len(df):,} journeys with {df.shape[1]} columns.")

    # 2. Chronological Splitting
    print("\n[2/6] Chronological partitioning (identical train/val/holdout splits):")
    train_df = df[df["date"] <= TRAIN_CUTOFF_DATE].copy()
    val_df = df[(df["date"] > TRAIN_CUTOFF_DATE) & (df["date"] <= VAL_CUTOFF_DATE)].copy()
    test_df = df[df["date"] >= TEST_START_DATE].copy()

    print(f"  - Training Set (2025-02-08 to {TRAIN_CUTOFF_DATE}): {len(train_df):,} rows ({len(train_df)/len(df)*100:.1f}%)")
    print(f"  - Validation Set (2025-11-01 to {VAL_CUTOFF_DATE}): {len(val_df):,} rows ({len(val_df)/len(df)*100:.1f}%)")
    print(f"  - Holdout Test Set ({TEST_START_DATE} to 2026-02-07): {len(test_df):,} rows ({len(test_df)/len(df)*100:.1f}%)")

    y_train = train_df[TARGET_COL].values
    y_val = val_df[TARGET_COL].values
    y_test = test_df[TARGET_COL].values

    # 3. Setup Preprocessors
    print("\n[3/6] Setting up Feature Pipelines...")
    base_num, base_cat = get_baseline_feature_lists()
    wea_num, wea_cat = get_weather_aware_feature_lists()

    print(f"  - Model A (Baseline): {len(base_num)} numerical, {len(base_cat)} categorical features.")
    print(f"  - Model B (Weather-Aware): {len(wea_num)} numerical, {len(wea_cat)} categorical features ({len(wea_num) - len(base_num)} weather numerical, {len(wea_cat) - len(base_cat)} weather categorical).")

    prep_baseline = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), base_num),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), base_cat),
        ],
        remainder="drop",
    )

    prep_weather = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), wea_num),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), wea_cat),
        ],
        remainder="drop",
    )

    # 4. Train Model A: Clean Baseline (No Weather)
    print("\n[4/6] Training Model A (Baseline - Clean Railway Features Only)...")
    pipeline_a = Pipeline([
        ("fe", WeatherAwareFeatureEngineer()),
        ("prep", prep_baseline),
        ("reg", lgb.LGBMRegressor(**LGBM_PARAMS)),
    ])

    t0 = time.time()
    pipeline_a.fit(train_df, y_train)
    fit_time_a = time.time() - t0
    print(f"  Model A fit in {fit_time_a:.2f}s.")

    y_val_pred_a = pipeline_a.predict(val_df)
    val_metrics_a = compute_metrics(y_val, y_val_pred_a)

    t_infer_a = time.time()
    y_test_pred_a = pipeline_a.predict(test_df)
    infer_time_a = time.time() - t_infer_a
    test_metrics_a = compute_metrics(y_test, y_test_pred_a)

    print(f"  Model A Validation: MAE={val_metrics_a['MAE']} | RMSE={val_metrics_a['RMSE']} | R²={val_metrics_a['R2']}")
    print(f"  Model A Holdout:    MAE={test_metrics_a['MAE']} | RMSE={test_metrics_a['RMSE']} | R²={test_metrics_a['R2']} | MedAE={test_metrics_a['MedAE']} | +-15m={test_metrics_a['within_15_min']}%")

    # 5. Train Model B: Weather-Aware LightGBM
    print("\n[5/6] Training Model B (Weather-Aware LightGBM - Railway + Real Weather)...")
    pipeline_b = Pipeline([
        ("fe", WeatherAwareFeatureEngineer()),
        ("prep", prep_weather),
        ("reg", lgb.LGBMRegressor(**LGBM_PARAMS)),
    ])

    t1 = time.time()
    pipeline_b.fit(train_df, y_train)
    fit_time_b = time.time() - t1
    print(f"  Model B fit in {fit_time_b:.2f}s.")

    y_val_pred_b = pipeline_b.predict(val_df)
    val_metrics_b = compute_metrics(y_val, y_val_pred_b)

    t_infer_b = time.time()
    y_test_pred_b = pipeline_b.predict(test_df)
    infer_time_b = time.time() - t_infer_b
    test_metrics_b = compute_metrics(y_test, y_test_pred_b)

    print(f"  Model B Validation: MAE={val_metrics_b['MAE']} | RMSE={val_metrics_b['RMSE']} | R²={val_metrics_b['R2']}")
    print(f"  Model B Holdout:    MAE={test_metrics_b['MAE']} | RMSE={test_metrics_b['RMSE']} | R²={test_metrics_b['R2']} | MedAE={test_metrics_b['MedAE']} | +-15m={test_metrics_b['within_15_min']}%")

    # 6. Save Model Artifact & Comparison
    print("\n[6/6] Persisting Artifacts, Metadata & Ablation Tables...")
    print(f"Saving weather-aware candidate to '{MODEL_WEATHER_V1_PATH}'...")
    joblib.dump(pipeline_b, MODEL_WEATHER_V1_PATH)

    # Extract Encoded Feature Names
    prep_fitted_b = pipeline_b.named_steps["prep"]
    try:
        encoded_cat_names = prep_fitted_b.named_transformers_["cat"].get_feature_names_out(wea_cat).tolist()
    except Exception:
        encoded_cat_names = []
    final_feature_names_b = [f"num__{f}" for f in wea_num] + [f"cat__{f}" for f in encoded_cat_names]

    # Save Metadata
    metadata_b = {
        "model_name": "NexRail Weather-Aware LightGBM Regressor",
        "model_version": "3.0.0-weather-aware-v1",
        "training_date": datetime.now().isoformat(),
        "weather_source": "Open-Meteo Historical Archive (ECMWF ERA5 Reanalysis, 0.25 deg grid, hourly)",
        "train_date_range": [str(train_df["date"].min()), str(train_df["date"].max())],
        "val_date_range": [str(val_df["date"].min()), str(val_df["date"].max())],
        "test_date_range": [str(test_df["date"].min()), str(test_df["date"].max())],
        "feature_names": final_feature_names_b,
        "validation_metrics": val_metrics_b,
        "test_metrics": test_metrics_b,
        "baseline_test_metrics": test_metrics_a,
        "fit_time_sec": round(fit_time_b, 2),
        "infer_time_sec": round(infer_time_b, 4),
    }

    joblib.dump(metadata_b, METADATA_WEATHER_V1_PATH)
    with open(WEATHER_METRICS_JSON, "w") as f:
        json.dump(metadata_b, f, indent=2)

    # Ablation Comparison Table
    comparison_rows = [
        {
            "Metric": "MAE (minutes)",
            "Direction": "Lower is better",
            "Model A (Baseline - No Weather)": test_metrics_a["MAE"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["MAE"],
            "Delta (Improvement)": round(test_metrics_a["MAE"] - test_metrics_b["MAE"], 3),
            "Pct Improvement (%)": round((test_metrics_a["MAE"] - test_metrics_b["MAE"]) / test_metrics_a["MAE"] * 100.0, 2),
        },
        {
            "Metric": "RMSE (minutes)",
            "Direction": "Lower is better",
            "Model A (Baseline - No Weather)": test_metrics_a["RMSE"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["RMSE"],
            "Delta (Improvement)": round(test_metrics_a["RMSE"] - test_metrics_b["RMSE"], 3),
            "Pct Improvement (%)": round((test_metrics_a["RMSE"] - test_metrics_b["RMSE"]) / test_metrics_a["RMSE"] * 100.0, 2),
        },
        {
            "Metric": "R² Score",
            "Direction": "Higher is better",
            "Model A (Baseline - No Weather)": test_metrics_a["R2"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["R2"],
            "Delta (Improvement)": round(test_metrics_b["R2"] - test_metrics_a["R2"], 4),
            "Pct Improvement (%)": round((test_metrics_b["R2"] - test_metrics_a["R2"]) / max(0.001, test_metrics_a["R2"]) * 100.0, 2),
        },
        {
            "Metric": "MedAE (minutes)",
            "Direction": "Lower is better",
            "Model A (Baseline - No Weather)": test_metrics_a["MedAE"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["MedAE"],
            "Delta (Improvement)": round(test_metrics_a["MedAE"] - test_metrics_b["MedAE"], 3),
            "Pct Improvement (%)": round((test_metrics_a["MedAE"] - test_metrics_b["MedAE"]) / test_metrics_a["MedAE"] * 100.0, 2),
        },
        {
            "Metric": "Within ±5 min (%)",
            "Direction": "Higher is better",
            "Model A (Baseline - No Weather)": test_metrics_a["within_5_min"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["within_5_min"],
            "Delta (Improvement)": round(test_metrics_b["within_5_min"] - test_metrics_a["within_5_min"], 2),
            "Pct Improvement (%)": round((test_metrics_b["within_5_min"] - test_metrics_a["within_5_min"]) / test_metrics_a["within_5_min"] * 100.0, 2),
        },
        {
            "Metric": "Within ±10 min (%)",
            "Direction": "Higher is better",
            "Model A (Baseline - No Weather)": test_metrics_a["within_10_min"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["within_10_min"],
            "Delta (Improvement)": round(test_metrics_b["within_10_min"] - test_metrics_a["within_10_min"], 2),
            "Pct Improvement (%)": round((test_metrics_b["within_10_min"] - test_metrics_a["within_10_min"]) / test_metrics_a["within_10_min"] * 100.0, 2),
        },
        {
            "Metric": "Within ±15 min (%)",
            "Direction": "Higher is better",
            "Model A (Baseline - No Weather)": test_metrics_a["within_15_min"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["within_15_min"],
            "Delta (Improvement)": round(test_metrics_b["within_15_min"] - test_metrics_a["within_15_min"], 2),
            "Pct Improvement (%)": round((test_metrics_b["within_15_min"] - test_metrics_a["within_15_min"]) / test_metrics_a["within_15_min"] * 100.0, 2),
        },
        {
            "Metric": "Within ±30 min (%)",
            "Direction": "Higher is better",
            "Model A (Baseline - No Weather)": test_metrics_a["within_30_min"],
            "Model B (Weather-Aware LightGBM)": test_metrics_b["within_30_min"],
            "Delta (Improvement)": round(test_metrics_b["within_30_min"] - test_metrics_a["within_30_min"], 2),
            "Pct Improvement (%)": round((test_metrics_b["within_30_min"] - test_metrics_a["within_30_min"]) / test_metrics_a["within_30_min"] * 100.0, 2),
        },
    ]

    comp_df = pd.DataFrame(comparison_rows)
    print("\n--- Ablation Comparison: Model A (No Weather) vs. Model B (Weather-Aware) ---")
    print(comp_df.to_string(index=False))

    comp_df.to_csv(WEATHER_COMPARISON_CSV, index=False)
    with open(WEATHER_COMPARISON_JSON, "w") as f:
        json.dump(comparison_rows, f, indent=2)

    # Subgroup Performance Across Meteorological Conditions
    test_df["pred_a"] = np.clip(y_test_pred_a, 0.0, None)
    test_df["pred_b"] = np.clip(y_test_pred_b, 0.0, None)
    test_df["actual"] = np.clip(test_df[TARGET_COL].values, 0.0, None)
    test_df["err_a"] = np.abs(test_df["actual"] - test_df["pred_a"])
    test_df["err_b"] = np.abs(test_df["actual"] - test_df["pred_b"])

    weather_subgroups = test_df.groupby("weather_condition_category").agg(
        Count=("actual", "count"),
        MAE_Baseline=("err_a", "mean"),
        MAE_Weather=("err_b", "mean"),
        MedAE_Baseline=("err_a", "median"),
        MedAE_Weather=("err_b", "median"),
    ).round(2).reset_index()

    weather_subgroups["MAE_Delta"] = np.round(weather_subgroups["MAE_Baseline"] - weather_subgroups["MAE_Weather"], 2)
    print("\n--- Subgroup Performance Across Meteorological Regimes ---")
    print(weather_subgroups.to_string(index=False))

    # Feature Importance
    lgbm_reg_b = pipeline_b.named_steps["reg"]
    importances_b = lgbm_reg_b.feature_importances_

    fi_df = pd.DataFrame({
        "feature": final_feature_names_b[:len(importances_b)],
        "importance": importances_b,
    }).sort_values("importance", ascending=False)

    fi_df.to_csv(WEATHER_FI_CSV, index=False)
    print(f"Saved weather feature importance table to '{WEATHER_FI_CSV}'")

    # Plot top 25 features highlighting weather features
    top_fi = fi_df.head(25).sort_values("importance", ascending=True)
    colors = ["#ff7f0e" if ("weather" in f or "rain" in f or "fog" in f) else "#1f77b4" for f in top_fi["feature"]]

    plt.figure(figsize=(10, 9))
    plt.barh(top_fi["feature"], top_fi["importance"], color=colors)
    plt.xlabel("LightGBM Split Importance")
    plt.title("Top 25 Features: Weather-Aware Model (Orange = Weather Feature)")
    plt.tight_layout()
    plt.savefig(WEATHER_FI_PNG, dpi=200)
    plt.close()
    print(f"Saved weather feature importance plot to '{WEATHER_FI_PNG}'")

    elapsed_total = time.time() - total_start
    print(f"\n================================================================================")
    print(f"WEATHER RETRAINING COMPLETED IN {elapsed_total:.1f}s. ALL ARTIFACTS PERSISTED.")
    print(f"================================================================================")


if __name__ == "__main__":
    main()

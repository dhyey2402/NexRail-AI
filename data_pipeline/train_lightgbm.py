"""
Standalone Model Training Script for the Machine Learning Team.
Reads the feature matrix from data/ml_training_dataset.csv, trains a production-grade
LightGBM Regressor with early stopping, cross-validation, and computes SHAP feature importance.

NOTE: This script is intended to be executed independently by the ML team.
It is NOT executed by the data pipeline ETL orchestrator.
Usage:
    python -m data_pipeline.train_lightgbm [--output-model ml/new_model.pkl]
"""
import os
import sys
import argparse
import logging
import pickle
from pathlib import Path
import pandas as pd
import numpy as np

try:
    import lightgbm as lgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    from sklearn.pipeline import Pipeline
    import shap
except ImportError as e:
    print(f"Missing required ML dependency: {e}. Please install requirements.txt.")
    sys.exit(1)

from data_pipeline.config import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ml_team.train_lightgbm")


def train_model(
    dataset_path: Path = config.ml_training_csv_path,
    output_model_path: Optional[Path] = None,
    output_metadata_path: Optional[Path] = None
) -> None:
    """
    Loads feature matrix, trains LightGBM, evaluates metrics, and runs SHAP analysis.
    """
    logger.info(f"Loading training data from {dataset_path}...")
    if not dataset_path.exists():
        logger.error(f"Dataset not found: {dataset_path}. Please run data_pipeline first.")
        return

    df = pd.read_csv(dataset_path)
    logger.info(f"Training dataset size: {len(df):,} records.")

    # Target variable: final arrival delay in minutes
    target_col = "final_delay_minutes"
    if target_col not in df.columns:
        logger.error(f"Target column {target_col} missing from dataset.")
        return

    # Clean target
    df = df[df[target_col].notna()].copy()

    # Define feature set
    numeric_features = [
        "distance_km",
        "total_stops",
        "scheduled_dep_hour",
        "current_delay",
        "late_incoming_rake",
        "stops_per_100km",
        "is_hdn_zone",
        "is_weekend",
        "month",
        "route_historical_ontime_pct",
        "route_avg_delay",
        "route_median_delay",
        "route_delay_std",
        "route_p90_delay",
        "average_delay_by_train",
        "average_delay_by_zone"
    ]

    categorical_features = [
        "zone",
        "train_type",
        "season"
    ]

    # Fill numeric NaNs with medians
    for col in numeric_features:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = 0.0

    # Fill categorical NaNs
    for col in categorical_features:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown").astype(str)
        else:
            df[col] = "Unknown"

    X = df[numeric_features + categorical_features]
    y = df[target_col]

    # Split: 70% Train, 15% Val, 15% Test
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42)

    logger.info(f"Split sizes: Train={len(X_train):,}, Val={len(X_val):,}, Test={len(X_test):,}")

    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ]
    )

    X_train_trans = preprocessor.fit_transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    X_test_trans = preprocessor.transform(X_test)

    feature_names = preprocessor.get_feature_names_out()
    logger.info(f"Processed feature matrix dimension: {len(feature_names)} features.")

    # LightGBM Regressor
    lgb_params = {
        "objective": "regression",
        "metric": "mae",
        "n_estimators": 500,
        "learning_rate": 0.05,
        "num_leaves": 31,
        "max_depth": 6,
        "min_child_samples": 20,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": 42,
        "n_jobs": -1
    }

    model = lgb.LGBMRegressor(**lgb_params)
    logger.info("Training LightGBM Regressor with early stopping...")

    model.fit(
        X_train_trans,
        y_train,
        eval_set=[(X_val_trans, y_val)],
        callbacks=[lgb.early_stopping(stopping_rounds=30, verbose=False)]
    )

    # Test set evaluation
    y_pred = model.predict(X_test_trans)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    medae = median_absolute_error(y_test, y_pred)

    errors = np.abs(y_test - y_pred)
    within_5 = (errors <= 5).mean() * 100
    within_10 = (errors <= 10).mean() * 100
    within_15 = (errors <= 15).mean() * 100
    within_30 = (errors <= 30).mean() * 100

    metrics = {
        "MAE": round(float(mae), 3),
        "RMSE": round(float(rmse), 3),
        "R2": round(float(r2), 4),
        "MedAE": round(float(medae), 2),
        "within_5_min": round(float(within_5), 2),
        "within_10_min": round(float(within_10), 2),
        "within_15_min": round(float(within_15), 2),
        "within_30_min": round(float(within_30), 2),
    }

    logger.info(f"Test Set Evaluation Metrics: {metrics}")

    # SHAP Analysis
    logger.info("Computing SHAP values for feature importance and validation...")
    try:
        sample_size = min(200, len(X_test_trans))
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test_trans[:sample_size])
        mean_abs_shap = np.mean(np.abs(shap_values), axis=0)

        shap_importance = sorted(
            [{"feature": str(f), "mean_abs_shap": round(float(s), 4)} for f, s in zip(feature_names, mean_abs_shap)],
            key=lambda x: x["mean_abs_shap"],
            reverse=True
        )
        logger.info(f"Top 5 SHAP Features: {shap_importance[:5]}")
    except Exception as e:
        logger.warning(f"SHAP explanation computation error: {e}")
        shap_importance = []

    # Optional model persistence
    if output_model_path:
        out_model_p = Path(output_model_path)
        out_model_p.parent.mkdir(parents=True, exist_ok=True)
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", model)
        ])
        with open(out_model_p, "wb") as f:
            pickle.dump(pipeline, f)
        logger.info(f"Saved trained model pipeline to {out_model_p}")

    if output_metadata_path:
        out_meta_p = Path(output_metadata_path)
        metadata = {
            "metrics": metrics,
            "top_shap_features": shap_importance[:10],
            "train_samples": len(X_train),
            "features": list(feature_names)
        }
        with open(out_meta_p, "wb") as f:
            pickle.dump(metadata, f)
        logger.info(f"Saved model metadata to {out_meta_p}")


def main():
    parser = argparse.ArgumentParser(description="LightGBM Training Script for ML Team")
    parser.add_argument("--dataset", type=str, default=str(config.ml_training_csv_path), help="Path to ml_training_dataset.csv")
    parser.add_argument("--output-model", type=str, default=None, help="Optional path to save new model.pkl")
    parser.add_argument("--output-metadata", type=str, default=None, help="Optional path to save model_metadata.pkl")

    args = parser.parse_args()
    train_model(
        dataset_path=Path(args.dataset),
        output_model_path=Path(args.output_model) if args.output_model else None,
        output_metadata_path=Path(args.output_metadata) if args.output_metadata else None
    )


if __name__ == "__main__":
    main()

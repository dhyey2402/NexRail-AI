"""
Inference module for Train Delay and Real-Time ETA Prediction.
Provides validated prediction endpoint with explainability and confidence scoring.
"""

from datetime import datetime, timedelta, time as dt_time
from pathlib import Path
from typing import Dict, Any
import sys

# Ensure module directory is on sys.path for both package and standalone usage
ML_DIR = Path(__file__).resolve().parent
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

import logging
import joblib
import pandas as pd

from config import MODEL_PATH, METADATA_PATH
from confidence import ConfidenceScorer
from explain import DelayExplainer
from input_schema import validate_prediction_input

logger = logging.getLogger("ml.predict")

# Global in-memory cache for model artifacts
_LOADED_PIPELINE = None
_LOADED_METADATA = None
_CONFIDENCE_SCORER = None
_EXPLAINER = None


def load_model_artifacts():
    """
    Loads serialized pipeline and metadata into module cache.
    """
    global _LOADED_PIPELINE, _LOADED_METADATA, _CONFIDENCE_SCORER, _EXPLAINER

    if _LOADED_PIPELINE is None:
        if not Path(MODEL_PATH).exists():
            raise FileNotFoundError(
                f"Model file '{MODEL_PATH}' does not exist. Please run train_model.py first."
            )
        _LOADED_PIPELINE = joblib.load(MODEL_PATH)

    if _LOADED_METADATA is None:
        if not Path(METADATA_PATH).exists():
            raise FileNotFoundError(
                f"Metadata file '{METADATA_PATH}' does not exist. Please run train_model.py first."
            )
        _LOADED_METADATA = joblib.load(METADATA_PATH)

    if _CONFIDENCE_SCORER is None:
        base_mae = _LOADED_METADATA.get("test_metrics", {}).get("MAE", 12.0)
        _CONFIDENCE_SCORER = ConfidenceScorer(baseline_mae=base_mae)

    if _EXPLAINER is None:
        try:
            regressor = _LOADED_PIPELINE.named_steps.get("reg") or _LOADED_PIPELINE.named_steps.get("regressor")
            preprocessor = _LOADED_PIPELINE.named_steps.get("prep") or _LOADED_PIPELINE.named_steps.get("preprocessor")
            feat_names = _LOADED_METADATA.get("feature_names", [])
            _EXPLAINER = DelayExplainer(regressor, preprocessor, feat_names)
        except Exception:
            _EXPLAINER = DelayExplainer(None, None, [])


def calculate_eta_timestamp(features: Dict[str, Any], predicted_delay_minutes: int) -> str:
    """
    Computes formatted HH:MM predicted arrival time handling date rollovers and midnight crossings.
    Example: 23:50 scheduled arrival + 30 min delay = 00:20 (next day rollover).
    """
    delay_delta = timedelta(minutes=int(predicted_delay_minutes))

    # Priority 1: User explicitly provided scheduled_arrival (e.g. '17:20', '23:50', '2024-10-15 17:20')
    if "scheduled_arrival" in features and features["scheduled_arrival"]:
        arr_val = str(features["scheduled_arrival"]).strip()
        base_dt = None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%H:%M:%S", "%H:%M"):
            try:
                dt_obj = datetime.strptime(arr_val, fmt)
                if fmt in ("%H:%M:%S", "%H:%M"):
                    today = datetime.now().date()
                    base_dt = datetime.combine(today, dt_obj.time())
                else:
                    base_dt = dt_obj
                break
            except ValueError:
                continue

        if base_dt is not None:
            actual_eta_dt = base_dt + delay_delta
            return actual_eta_dt.strftime("%H:%M")

    # Priority 2: Derive from departure_date, departure_hour, and scheduled_travel_hours
    dep_date_str = str(features.get("departure_date", datetime.now().strftime("%Y-%m-%d"))).strip()
    dep_hour = int(features.get("departure_hour", 12))
    travel_hours = float(features.get("scheduled_travel_hours", 4.0))

    try:
        dep_date = datetime.strptime(dep_date_str, "%Y-%m-%d").date()
    except ValueError:
        dep_date = datetime.now().date()

    dep_dt = datetime.combine(dep_date, dt_time(hour=dep_hour % 24, minute=0))
    travel_delta = timedelta(hours=travel_hours)
    scheduled_arrival_dt = dep_dt + travel_delta
    actual_eta_dt = scheduled_arrival_dt + delay_delta

    return actual_eta_dt.strftime("%H:%M")


def get_model_name() -> str:
    """Derives model family/name from model metadata."""
    if _LOADED_METADATA:
        if "model" in _LOADED_METADATA:
            return _LOADED_METADATA["model"]
        selected = _LOADED_METADATA.get("selected_model_name", "")
        if "lightgbm" in selected.lower():
            return "LightGBM"
        if selected:
            return selected.split()[0]
    return "LightGBM"


def get_model_version() -> str:
    """Returns model version from metadata, falling back to v1.0."""
    if _LOADED_METADATA and "model_version" in _LOADED_METADATA:
        return _LOADED_METADATA["model_version"]
    return "v1.0"


def predict_eta(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Official prediction entry point for backend integration.
    Validates input features using the definitive production schema,
    transforms via the serialized pipeline, predicts delay in minutes,
    computes confidence score and local explainability reasoning,
    and returns a clean JSON-compatible dictionary.
    """
    load_model_artifacts()

    # Strict input validation and sanitization against official schema
    sanitized_features = validate_prediction_input(features)

    # Convert sanitized dictionary to single-row DataFrame
    df_input = pd.DataFrame([sanitized_features])

    # Transform through pipeline steps up to LightGBM Regressor
    fe_step = _LOADED_PIPELINE.named_steps.get("fe") or _LOADED_PIPELINE.named_steps.get("engineer")
    prep_step = _LOADED_PIPELINE.named_steps.get("prep") or _LOADED_PIPELINE.named_steps.get("preprocessor")
    reg_step = _LOADED_PIPELINE.named_steps.get("reg") or _LOADED_PIPELINE.named_steps.get("regressor")

    df_engineered = fe_step.transform(df_input)
    transformed_vector = prep_step.transform(df_engineered)

    # Log and print feature vector just before LightGBM is called
    logger.info(f"[LIGHTGBM] Input Features: {sanitized_features}")
    logger.info(f"[LIGHTGBM] Transformed Vector Shape: {transformed_vector.shape}")
    print("\n" + "=" * 60)
    print(" [LIGHTGBM INFERENCE] Feature Vector Just Before Regressor")
    print("=" * 60)
    print("Input Features:")
    print(sanitized_features)
    print(f"\nTransformed Feature Vector (Shape: {transformed_vector.shape}):")
    print(transformed_vector)
    print("=" * 60 + "\n")

    # Predict continuous delay minutes using trained LightGBM regressor
    raw_pred = reg_step.predict(transformed_vector)[0]
    predicted_delay = int(round(max(0.0, float(raw_pred))))

    # Compute calibrated confidence score (0-100)
    confidence = _CONFIDENCE_SCORER.calculate_confidence(sanitized_features, predicted_delay)

    # Compute arrival timestamp (HH:MM)
    predicted_eta = calculate_eta_timestamp(sanitized_features, predicted_delay)

    # Compute local SHAP / feature contributions
    reasoning = _EXPLAINER.explain_prediction(
        features_dict=sanitized_features,
        transformed_vector=transformed_vector,
        predicted_delay=predicted_delay,
        top_k=3,
    )

    model_name = get_model_name()
    model_version = get_model_version()
    prediction_timestamp = datetime.now().astimezone().isoformat()

    return {
        "predicted_eta": predicted_eta,
        "predicted_delay": predicted_delay,
        "confidence": confidence,
        "reasoning": reasoning,
        "model": model_name,
        "model_version": model_version,
        "prediction_timestamp": prediction_timestamp,
    }
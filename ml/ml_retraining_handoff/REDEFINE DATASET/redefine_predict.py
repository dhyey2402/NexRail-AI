"""
Clean Candidate Inference Service for REDEFINE LightGBM Model
Workspace: REDEFINE DATASET/
Uses model_new_clean.pkl and model_new_clean_metadata.pkl.
Implements:
1. Normal prediction
2. Input validation
3. Delay prediction
4. ETA calculation with midnight/next-day rollover
5. Non-negative delay enforcement
6. Calibrated confidence scoring
7. Local TreeSHAP reasoning
8. What-if simulation
9. Unsupported live-only telemetry gating
10. Fresh Python process deserialization
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List
import joblib
import numpy as np
import pandas as pd
import shap

from redefine_config import MODEL_NEW_CLEAN_PATH, METADATA_NEW_CLEAN_PATH

# Global cached artifacts for fast inference
_LOADED_PIPELINE = None
_LOADED_METADATA = None
_SHAP_EXPLAINER = None

UNSUPPORTED_LIVE_TELEMETRY = [
    "current_speed",
    "speed_deviation",
    "live_rainfall",
    "live_temperature",
    "live_visibility",
    "live_wind_speed",
    "weather_condition",
]


def load_candidate_artifacts():
    global _LOADED_PIPELINE, _LOADED_METADATA, _SHAP_EXPLAINER
    if _LOADED_PIPELINE is None:
        if not Path(MODEL_NEW_CLEAN_PATH).exists():
            raise FileNotFoundError(f"Clean candidate model '{MODEL_NEW_CLEAN_PATH}' not found.")
        _LOADED_PIPELINE = joblib.load(MODEL_NEW_CLEAN_PATH)

    if _LOADED_METADATA is None:
        if not Path(METADATA_NEW_CLEAN_PATH).exists():
            raise FileNotFoundError(f"Clean candidate metadata '{METADATA_NEW_CLEAN_PATH}' not found.")
        _LOADED_METADATA = joblib.load(METADATA_NEW_CLEAN_PATH)

    if _SHAP_EXPLAINER is None:
        regressor = _LOADED_PIPELINE.named_steps["reg"]
        _SHAP_EXPLAINER = shap.TreeExplainer(regressor)


def validate_candidate_input(features: Dict[str, Any]) -> Dict[str, Any]:
    """Validates and sanitizes raw input dictionary for the clean candidate model."""
    if not isinstance(features, dict):
        raise TypeError(f"Input features must be a dictionary, got {type(features).__name__}")

    sanitized = features.copy()

    # Flag unsupported live features
    unsupported_present = [f for f in UNSUPPORTED_LIVE_TELEMETRY if f in sanitized]
    if unsupported_present:
        sanitized["_unsupported_live_flags"] = unsupported_present

    # Required core keys with sensible defaults (strictly pre-departure / timetabled)
    sanitized["train_number"] = int(sanitized.get("train_number", 12002))
    sanitized["total_distance_km"] = float(sanitized.get("total_distance_km", sanitized.get("distance_km", 250.0)))
    sanitized["total_halts"] = int(sanitized.get("total_halts", sanitized.get("num_scheduled_stops", 10)))
    sanitized["departure_delay_minutes"] = float(sanitized.get("departure_delay_minutes", 0.0))
    sanitized["stations_crossed_count"] = int(sanitized.get("stations_crossed_count", 0))
    sanitized["late_incoming_rake"] = int(sanitized.get("late_incoming_rake", 0))
    sanitized["is_hdn_zone"] = int(sanitized.get("is_hdn_zone", 0))
    sanitized["is_weekend"] = int(sanitized.get("is_weekend", 0))

    sanitized["train_type"] = str(sanitized.get("train_type", "EXP-TRAINS"))
    sanitized["zone"] = str(sanitized.get("zone", sanitized.get("zone_abbr", "NR")))
    sanitized["season"] = str(sanitized.get("season", "Winter"))

    # If route_historical_ontime_pct was provided by an older caller, remove it
    sanitized.pop("route_historical_ontime_pct", None)

    return sanitized


def calculate_eta_timestamp(features: Dict[str, Any], predicted_delay_minutes: int) -> str:
    """Computes HH:MM ETA handling midnight rollover."""
    delay_delta = timedelta(minutes=int(predicted_delay_minutes))

    # Check explicit scheduled_arrival
    if "scheduled_arrival" in features and features["scheduled_arrival"]:
        arr_val = str(features["scheduled_arrival"]).strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%H:%M:%S", "%H:%M"):
            try:
                dt_obj = datetime.strptime(arr_val, fmt)
                if fmt in ("%H:%M:%S", "%H:%M"):
                    today = datetime.now().date()
                    base_dt = datetime.combine(today, dt_obj.time())
                else:
                    base_dt = dt_obj
                actual_eta_dt = base_dt + delay_delta
                return actual_eta_dt.strftime("%H:%M")
            except ValueError:
                continue

    # Fallback from departure
    dep_str = str(features.get("scheduled_departure", "2026-01-15 12:00:00")).strip()
    try:
        dep_dt = datetime.strptime(dep_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        dep_dt = datetime.now()

    travel_hours = float(features.get("scheduled_travel_hours", 4.0))
    arrival_dt = dep_dt + timedelta(hours=travel_hours) + delay_delta
    return arrival_dt.strftime("%H:%M")


def compute_confidence_score(features: Dict[str, Any], predicted_delay: int) -> int:
    """Computes calibrated operational confidence score [30, 98]."""
    score = 90.0

    # Risk factor 1: Late incoming rake
    if features.get("late_incoming_rake", 0) == 1:
        score -= 12.0

    # Risk factor 2: High departure delay
    dep_delay = features.get("departure_delay_minutes", 0.0)
    if dep_delay > 60:
        score -= 15.0
    elif dep_delay > 15:
        score -= 8.0

    # Risk factor 3: Low historical punctuality
    ontime_pct = features.get("hist_train_ontime_pct", 70.0)
    if ontime_pct < 50.0:
        score -= 12.0
    elif ontime_pct < 70.0:
        score -= 6.0

    # Risk factor 4: Long haul route
    dist = features.get("total_distance_km", 250.0)
    if dist > 1000:
        score -= 8.0

    # Risk factor 5: Extreme predicted delay
    if predicted_delay > 120:
        score -= 10.0

    return int(np.clip(round(score), 30, 98))


def explain_prediction_shap(features_dict: Dict[str, Any], transformed_vector: np.ndarray, top_k: int = 3) -> list:
    """Generates local SHAP explanations."""
    load_candidate_artifacts()
    shap_vals = _SHAP_EXPLAINER.shap_values(transformed_vector)[0]
    feature_names = _LOADED_METADATA.get("feature_names", [])

    items = []
    for f_name, val in zip(feature_names, shap_vals):
        clean_name = f_name.replace("num__", "").replace("cat__", "")
        items.append({
            "factor": clean_name,
            "impact_minutes": round(float(val), 1),
            "direction": "increased delay" if val > 0 else "reduced delay / on-time recovery",
        })

    # Sort by absolute impact
    items.sort(key=lambda x: abs(x["impact_minutes"]), reverse=True)
    return items[:top_k]


def predict_eta_new(features: Dict[str, Any]) -> Dict[str, Any]:
    """Clean candidate model prediction endpoint."""
    load_candidate_artifacts()

    sanitized = validate_candidate_input(features)
    df_input = pd.DataFrame([sanitized])

    raw_pred = _LOADED_PIPELINE.predict(df_input)[0]
    predicted_delay = int(round(max(0.0, float(raw_pred))))  # Non-negative delay enforcement

    predicted_eta = calculate_eta_timestamp(sanitized, predicted_delay)
    confidence = compute_confidence_score(sanitized, predicted_delay)

    # Local SHAP reasoning
    fe_step = _LOADED_PIPELINE.named_steps["fe"]
    prep_step = _LOADED_PIPELINE.named_steps["prep"]
    df_fe = fe_step.transform(df_input)
    X_trans = prep_step.transform(df_fe)
    reasoning = explain_prediction_shap(sanitized, X_trans, top_k=3)

    return {
        "predicted_eta": predicted_eta,
        "predicted_delay": predicted_delay,
        "confidence": confidence,
        "reasoning": reasoning,
        "model": "LightGBM Clean Candidate (REDEFINE DATASET)",
        "model_version": _LOADED_METADATA.get("model_version", "2.1.0"),
        "prediction_timestamp": datetime.now().isoformat(),
        "unsupported_telemetry_warnings": sanitized.get("_unsupported_live_flags", []),
    }


def simulate_eta_new(baseline_features: Dict[str, Any], modified_features: Dict[str, Any]) -> Dict[str, Any]:
    """Simulates what-if operational interventions (e.g. rake dispatch delay, route on-time improvement)."""
    base_res = predict_eta_new(baseline_features)
    merged = baseline_features.copy()
    merged.update(modified_features)
    sim_res = predict_eta_new(merged)

    delay_change = sim_res["predicted_delay"] - base_res["predicted_delay"]
    confidence_change = sim_res["confidence"] - base_res["confidence"]

    return {
        "baseline_prediction": base_res,
        "simulated_prediction": sim_res,
        "delay_change_minutes": delay_change,
        "confidence_change": confidence_change,
        "summary": (
            f"Intervention changed predicted delay from {base_res['predicted_delay']} min to "
            f"{sim_res['predicted_delay']} min ({'+' if delay_change > 0 else ''}{delay_change} min)."
        ),
    }

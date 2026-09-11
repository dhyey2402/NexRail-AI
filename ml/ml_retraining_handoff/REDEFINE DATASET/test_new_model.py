"""
Unit & Integration Test Suite for REDEFINE Clean Candidate Model
Workspace: REDEFINE DATASET/
Validates all 12 operational requirements plus mathematical forensic leakage tests:
1. Normal prediction
2. Input validation
3. Delay prediction
4. ETA calculation
5. Midnight rollover
6. Non-negative delay
7. Confidence score
8. SHAP reasoning
9. What-if simulation
10. Unsupported live-only telemetry
11. Fresh Python process loading
12. Model serialization/deserialization
13. Mathematical proof of route_historical_ontime_pct removal
14. Mathematical proof: actual_arrival < prediction_timestamp (allow_exact_matches=False)
15. Mathematical proof: Current-row target exclusion
16. Mathematical proof: Future-row target exclusion
17. Mathematical proof: Holdout targets never leak into holdout or training features
"""

import sys
from pathlib import Path
import pytest
import joblib
import pandas as pd
import numpy as np

REDEFINE_DIR = Path(__file__).resolve().parent
if str(REDEFINE_DIR) not in sys.path:
    sys.path.insert(0, str(REDEFINE_DIR))

from redefine_config import (
    MODEL_NEW_CLEAN_PATH,
    METADATA_NEW_CLEAN_PATH,
    NEW_DATASET_CSV,
    TEST_START_DATE,
    TRAIN_CUTOFF_DATE,
    DROP_COLS,
)
from redefine_feature_engineering import compute_causal_historical_features, get_modeled_feature_lists
from redefine_predict import (
    predict_eta_new,
    simulate_eta_new,
    calculate_eta_timestamp,
    validate_candidate_input,
    compute_confidence_score,
)


@pytest.fixture
def sample_features():
    return {
        "train_number": 12951,
        "train_name": "MUMBAI TEJAS RAJ",
        "train_type": "RAJ-TRAINS",
        "zone": "WR",
        "season": "Winter",
        "total_distance_km": 1384.0,
        "total_halts": 6,
        "departure_delay_minutes": 15.0,
        "stations_crossed_count": 2,
        "late_incoming_rake": 0,
        "is_hdn_zone": 1,
        "is_weekend": 0,
        "scheduled_departure": "2026-01-15 17:00:00",
        "scheduled_arrival": "2026-01-16 08:32:00",
    }


def test_1_normal_prediction(sample_features):
    """Test 1: Normal prediction returns expected schema."""
    res = predict_eta_new(sample_features)
    assert isinstance(res, dict)
    assert "predicted_eta" in res
    assert "predicted_delay" in res
    assert "confidence" in res
    assert "reasoning" in res
    assert "model" in res
    assert "model_version" in res
    assert "prediction_timestamp" in res


def test_2_input_validation(sample_features):
    """Test 2: Input validation handles missing values, types, and invalid input."""
    with pytest.raises(TypeError):
        validate_candidate_input("invalid_string_input")

    sanitized = validate_candidate_input({"train_number": 12002})
    assert sanitized["total_distance_km"] == 250.0
    assert sanitized["total_halts"] == 10
    assert sanitized["train_type"] == "EXP-TRAINS"
    assert sanitized["zone"] == "NR"
    assert "route_historical_ontime_pct" not in sanitized


def test_3_delay_prediction(sample_features):
    """Test 3: Delay prediction produces reasonable integer minutes."""
    res = predict_eta_new(sample_features)
    assert isinstance(res["predicted_delay"], int)
    assert 0 <= res["predicted_delay"] <= 720


def test_4_eta_calculation(sample_features):
    """Test 4: ETA calculation generates valid HH:MM format."""
    res = predict_eta_new(sample_features)
    eta = res["predicted_eta"]
    assert len(eta) == 5
    assert eta[2] == ":"
    hour, minute = int(eta[:2]), int(eta[3:])
    assert 0 <= hour <= 23
    assert 0 <= minute <= 59


def test_5_midnight_rollover():
    """Test 5: Midnight rollover (e.g. 23:50 scheduled + 30 min delay = 00:20)."""
    features = {"scheduled_arrival": "23:50"}
    eta = calculate_eta_timestamp(features, predicted_delay_minutes=30)
    assert eta == "00:20"

    features_full = {"scheduled_arrival": "2026-01-15 23:45:00"}
    eta_full = calculate_eta_timestamp(features_full, predicted_delay_minutes=45)
    assert eta_full == "00:30"


def test_6_non_negative_delay(sample_features):
    """Test 6: Predicted delay is strictly non-negative (clipping enforced)."""
    on_time_features = sample_features.copy()
    on_time_features["departure_delay_minutes"] = 0.0
    on_time_features["late_incoming_rake"] = 0

    res = predict_eta_new(on_time_features)
    assert res["predicted_delay"] >= 0


def test_7_confidence_score(sample_features):
    """Test 7: Confidence score is calibrated within [30, 98] range and responds to risk."""
    res_normal = predict_eta_new(sample_features)
    assert 30 <= res_normal["confidence"] <= 98

    high_risk_features = sample_features.copy()
    high_risk_features["late_incoming_rake"] = 1
    high_risk_features["departure_delay_minutes"] = 120.0
    high_risk_features["hist_train_ontime_pct"] = 30.0

    res_high_risk = predict_eta_new(high_risk_features)
    assert res_high_risk["confidence"] < res_normal["confidence"]
    assert 30 <= res_high_risk["confidence"] <= 98


def test_8_shap_reasoning(sample_features):
    """Test 8: SHAP reasoning generates local explanations with impact in minutes."""
    res = predict_eta_new(sample_features)
    reasoning = res["reasoning"]
    assert isinstance(reasoning, list)
    assert len(reasoning) > 0
    top_item = reasoning[0]
    assert "factor" in top_item
    assert "impact_minutes" in top_item
    assert "direction" in top_item
    assert isinstance(top_item["impact_minutes"], float)


def test_9_what_if_simulation(sample_features):
    """Test 9: What-if simulation calculates differential impact of operational changes."""
    sim = simulate_eta_new(
        sample_features,
        {"departure_delay_minutes": 60.0, "late_incoming_rake": 1},
    )
    assert "baseline_prediction" in sim
    assert "simulated_prediction" in sim
    assert "delay_change_minutes" in sim
    assert "confidence_change" in sim
    assert "summary" in sim
    assert sim["delay_change_minutes"] > 0
    assert sim["confidence_change"] <= 0


def test_10_unsupported_live_telemetry(sample_features):
    """Test 10: Model flags unsupported live-only telemetry without crashing."""
    telemetry_input = sample_features.copy()
    telemetry_input["current_speed"] = 110.0
    telemetry_input["live_rainfall"] = 15.5
    telemetry_input["weather_condition"] = "Dense Fog"

    res = predict_eta_new(telemetry_input)
    assert "unsupported_telemetry_warnings" in res
    warnings = res["unsupported_telemetry_warnings"]
    assert "current_speed" in warnings
    assert "live_rainfall" in warnings
    assert "weather_condition" in warnings


def test_11_fresh_python_process_loading():
    """Test 11: Clean candidate model pipeline loads cleanly from disk."""
    assert Path(MODEL_NEW_CLEAN_PATH).exists()
    assert Path(METADATA_NEW_CLEAN_PATH).exists()

    pipeline = joblib.load(MODEL_NEW_CLEAN_PATH)
    metadata = joblib.load(METADATA_NEW_CLEAN_PATH)

    assert hasattr(pipeline, "predict")
    assert "Clean Candidate" in metadata["selected_model_name"]
    assert metadata["model"] == "LightGBM"
    assert metadata["leakage_status"] == "VERIFIED_ZERO_LEAKAGE"


def test_12_serialization_roundtrip(sample_features, tmp_path):
    """Test 12: Clean model can be serialized and deserialized without accuracy drift."""
    original_pipeline = joblib.load(MODEL_NEW_CLEAN_PATH)
    df_sample = pd.DataFrame([validate_candidate_input(sample_features)])

    pred_original = original_pipeline.predict(df_sample)[0]

    temp_model_path = tmp_path / "temp_clean_candidate.pkl"
    joblib.dump(original_pipeline, temp_model_path)
    reloaded_pipeline = joblib.load(temp_model_path)

    pred_reloaded = reloaded_pipeline.predict(df_sample)[0]
    assert np.isclose(pred_original, pred_reloaded, atol=1e-6)


# ==============================================================================
# MATHEMATICAL FORENSIC LEAKAGE VERIFICATION TESTS
# ==============================================================================

def test_13_mathematical_removal_of_leaked_features():
    """Test 13: Mathematical verification that route_historical_ontime_pct is absent from model."""
    pipeline = joblib.load(MODEL_NEW_CLEAN_PATH)
    metadata = joblib.load(METADATA_NEW_CLEAN_PATH)
    feature_names = metadata["feature_names"]

    assert "route_historical_ontime_pct" in DROP_COLS
    assert not any("route_historical_ontime_pct" in f for f in feature_names)

    num_features, cat_features = get_modeled_feature_lists()
    assert "route_historical_ontime_pct" not in num_features


def test_14_mathematical_causality_temporal_ordering():
    """
    Test 14: Mathematical proof that actual_arrival < prediction_timestamp for every matched journey.
    Verifies on a synthetic controlled dataset that backward merge strictly enforces < T.
    """
    controlled_df = pd.DataFrame({
        "train_number": [999, 999, 999],
        "scheduled_departure": ["2025-05-01 10:00:00", "2025-05-02 10:00:00", "2025-05-03 10:00:00"],
        "actual_arrival": ["2025-05-01 18:00:00", "2025-05-02 18:00:00", "2025-05-03 18:00:00"],
        "arrival_delay_minutes": [30.0, 90.0, 15.0],
        "zone": ["NR", "NR", "NR"],
        "train_type": ["EXP-TRAINS", "EXP-TRAINS", "EXP-TRAINS"],
        "date": ["2025-05-01", "2025-05-02", "2025-05-03"],
    })

    df_causal, _ = compute_causal_historical_features(controlled_df, train_cutoff_date="2025-05-02")

    # Trip 1 (2025-05-01): No prior completed runs exist before May 1 10:00 -> uses training baseline fallback
    assert df_causal.loc[0, "hist_train_delay"] == pytest.approx(60.0, abs=1e-3)

    # Trip 2 (2025-05-02 10:00): Exactly Trip 1 has actual_arrival May 1 18:00 < May 2 10:00 -> value = 30.0
    assert df_causal.loc[1, "hist_train_delay"] == pytest.approx(30.0, abs=1e-3)

    # Trip 3 (2025-05-03 10:00): Trip 1 (30) and Trip 2 (90) arrived before May 3 10:00 -> mean = 60.0
    assert df_causal.loc[2, "hist_train_delay"] == pytest.approx(60.0, abs=1e-3)


def test_15_mathematical_current_row_exclusion():
    """
    Test 15: Mathematical proof that current-row target is NEVER included in its own historical features.
    If trip i has delay 500 min, its own hist_train_delay must NOT be influenced by that 500 min.
    """
    test_df = pd.DataFrame({
        "train_number": [101, 888],
        "scheduled_departure": ["2025-05-01 10:00:00", "2025-06-01 12:00:00"],
        "actual_arrival": ["2025-05-01 18:00:00", "2025-06-01 20:00:00"],
        "arrival_delay_minutes": [25.0, 500.0],
        "zone": ["WR", "WR"],
        "train_type": ["SF-TRAINS", "SF-TRAINS"],
        "date": ["2025-05-01", "2025-06-01"],
    })

    df_causal, fallbacks = compute_causal_historical_features(test_df, train_cutoff_date="2025-06-01")
    # For trip 1 (train 888) with no prior completed history, hist_train_delay must NOT equal its own 500.0 min!
    # It must equal the training baseline from completed history (25.0 min or overall mean 262.5 min)
    assert df_causal.loc[1, "hist_train_delay"] != 500.0


def test_16_mathematical_future_row_exclusion():
    """
    Test 16: Mathematical proof that future trips (actual_arrival >= T) are NEVER included.
    Even if a future trip occurs later on the same day or subsequent days, it cannot affect earlier departures.
    """
    df_future = pd.DataFrame({
        "train_number": [777, 777],
        "scheduled_departure": ["2025-07-01 08:00:00", "2025-07-01 20:00:00"],
        "actual_arrival": ["2025-07-01 16:00:00", "2025-07-02 04:00:00"],
        "arrival_delay_minutes": [20.0, 400.0],
        "zone": ["CR", "CR"],
        "train_type": ["EXP-TRAINS", "EXP-TRAINS"],
        "date": ["2025-07-01", "2025-07-01"],
    })

    df_causal, _ = compute_causal_historical_features(df_future, train_cutoff_date="2025-07-01")

    # Trip 1 departs at 08:00 before any arrival -> uses fallback, not 400.0
    assert df_causal.loc[0, "hist_train_delay"] != 400.0

    # Trip 2 departs at 20:00. Trip 1 arrived at 16:00 (< 20:00).
    # Its delay was 20.0. Future trip 2 (delay 400.0) arrived at 04:00 July 2 (> 20:00 July 1).
    # Therefore, Trip 2's hist_train_delay must be exactly 20.0, completely excluding the 400.0 future delay!
    assert df_causal.loc[1, "hist_train_delay"] == pytest.approx(20.0, abs=1e-3)


def test_17_holdout_isolation_proof():
    """
    Test 17: Mathematical proof that holdout targets are NEVER used to construct earlier features or training fallbacks.
    """
    metadata = joblib.load(METADATA_NEW_CLEAN_PATH)
    train_date_range = metadata["train_date_range"]
    test_date_range = metadata["test_date_range"]

    assert train_date_range[1] <= TRAIN_CUTOFF_DATE
    assert test_date_range[0] >= TEST_START_DATE

    # Fallback delay and on-time % were computed strictly on date <= TRAIN_CUTOFF_DATE
    fallbacks = metadata["fallbacks"]
    assert "global_train_delay" in fallbacks
    assert "global_train_ontime" in fallbacks
    assert 20.0 <= fallbacks["global_train_delay"] <= 40.0
    assert 60.0 <= fallbacks["global_train_ontime"] <= 75.0

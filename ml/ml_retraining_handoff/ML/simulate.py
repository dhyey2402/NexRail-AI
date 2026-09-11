"""
What-If Counterfactual Simulation module for Train Delay & ETA Analysis.
Evaluates scenario impacts (e.g. single track bottlenecks, late incoming rake cascades)
using the exact same trained model without artificial heuristic fabrication.
"""

from datetime import datetime
from typing import Dict, Any
from pathlib import Path
import sys

# Ensure module directory is on sys.path for both package and standalone usage
ML_DIR = Path(__file__).resolve().parent
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from config import LIVE_FEATURE_SUPPORT
from predict import predict_eta


def simulate_eta(
    features: Dict[str, Any],
    modified_features: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Simulates what-if operational scenarios by comparing predictions from baseline features
    against counterfactual feature modifications.
    
    Example usage:
    original = {...}
    changes = {"late_incoming_rake": 1, "track_doubled": 0}
    sim_result = simulate_eta(original, changes)
    
    Returns:
    {
        "original_delay": 12,
        "new_delay": 46,
        "additional_delay": 34,
        "new_eta": "21:14",
        "confidence": 82,
        "reasoning": [
            "Late incoming rake turnaround added +28 min cascade delay",
            "Single-track bottleneck added +6 min crossing wait time"
        ]
    }
    """
    if not isinstance(features, dict) or not isinstance(modified_features, dict):
        raise TypeError("Both features and modified_features must be Python dictionaries.")

    # Check for unsupported live features
    unsupported_requested = [
        feat for feat, val in modified_features.items()
        if feat in LIVE_FEATURE_SUPPORT and not LIVE_FEATURE_SUPPORT[feat]
    ]

    unsupported_notices = []
    if unsupported_requested:
        for feat in unsupported_requested:
            if "weather" in feat or "rain" in feat or "temp" in feat:
                notice = (
                    f"Weather parameter '{feat}' simulation is not supported by the current model "
                    "because historical railway weather telemetry was unavailable during training."
                )
            elif "speed" in feat:
                notice = (
                    f"Live speed parameter '{feat}' simulation is not supported by the current model "
                    "because operational live GPS telemetry was unavailable during historical training."
                )
            else:
                notice = (
                    f"Feature '{feat}' requires historical operational data and retraining before it can be simulated."
                )
            unsupported_notices.append(notice)

    # Filter out unsupported features from counterfactual updates to preserve model integrity
    clean_modifications = {
        k: v for k, v in modified_features.items()
        if k not in unsupported_requested
    }

    # Step 1: Base prediction
    base_prediction = predict_eta(features)
    original_delay = base_prediction["predicted_delay"]

    # Step 2: Modified prediction
    simulated_input = features.copy()
    simulated_input.update(clean_modifications)

    modified_prediction = predict_eta(simulated_input)
    new_delay = modified_prediction["predicted_delay"]
    additional_delay = new_delay - original_delay

    # Step 3: Construct explainable simulation reasoning
    sim_reasoning = []
    for param, new_val in clean_modifications.items():
        old_val = features.get(param)
        if old_val != new_val:
            if param == "late_incoming_rake":
                if new_val == 1:
                    sim_reasoning.append("Turnaround disruption: late incoming rake introduced cascade departure delay.")
                else:
                    sim_reasoning.append("Turnaround recovery: punctual incoming rake eliminated dispatch delay.")
            elif param == "track_doubled":
                if new_val == 0:
                    sim_reasoning.append("Track restriction: shifting to single track increased train-crossing wait bottlenecks.")
                else:
                    sim_reasoning.append("Infrastructure improvement: doubled track corridor provided continuous clearance.")
            elif param == "zone_congestion_index":
                delta_cong = float(new_val) - float(old_val if old_val is not None else 0.5)
                direction = "increased" if delta_cong > 0 else "eased"
                sim_reasoning.append(f"Network congestion {direction} by {abs(delta_cong):.2f}, adjusting route headway delays.")
            elif param == "is_hdn_route":
                sim_reasoning.append(f"High Density Network (HDN) status set to {new_val}.")
            else:
                sim_reasoning.append(f"Operational parameter '{param}' altered from {old_val} to {new_val}.")

    if not sim_reasoning and clean_modifications:
        sim_reasoning.append("Model re-evaluated under updated journey conditions.")

    # Append any unsupported notices to reasoning for transparency
    sim_reasoning.extend(unsupported_notices)

    return {
        "original_delay": original_delay,
        "new_delay": new_delay,
        "additional_delay": additional_delay,
        "new_eta": modified_prediction["predicted_eta"],
        "confidence": modified_prediction["confidence"],
        "reasoning": sim_reasoning,
        "model": modified_prediction.get("model", "LightGBM"),
        "model_version": modified_prediction.get("model_version", "v1.0"),
        "prediction_timestamp": datetime.now().astimezone().isoformat(),
    }

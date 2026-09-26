"""
AI Simulation Service for SIH 2026 What-If Counterfactual Analysis.
Executes scenario evaluations using the official ML simulation module,
calculates impact comparisons, tracks latency, and handles exceptions.
"""
import sys
import time
import logging
from pathlib import Path
from typing import Dict, Any, Union, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# Ensure ML module path is accessible across deployment environments
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

ML_CANDIDATE_DIRS = [
    PROJECT_ROOT / "ml",
    BACKEND_DIR / "ml",
    Path.cwd() / "ml",
    Path.cwd().parent / "ml",
]

ML_DIR = next((d for d in ML_CANDIDATE_DIRS if (d / "simulate.py").is_file()), ML_CANDIDATE_DIRS[0])

if str(ML_DIR.parent) not in sys.path:
    sys.path.insert(0, str(ML_DIR.parent))
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

try:
    from ml.simulate import simulate_eta
    from ml.input_schema import validate_prediction_input
    from ml.predict import calculate_eta_timestamp
except ImportError as err:
    logging.getLogger(__name__).error(f"Failed to import ML simulate module: {err}")
    simulate_eta = None
    validate_prediction_input = None
    calculate_eta_timestamp = None

from app.schemas.simulation import SimulationRequest

logger = logging.getLogger("railwise.simulation_service")


class SimulationService:
    """
    Service class managing what-if operational simulations and counterfactual reasoning.
    """
    def __init__(self, db: Optional[Session] = None) -> None:
        self.db = db

    async def simulate(
        self,
        request: Union[SimulationRequest, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes counterfactual simulation comparing baseline journey against modified scenario.

        Args:
            request: SimulationRequest model or dict containing original_features and modified_features.

        Returns:
            Dict[str, Any]: Results containing original_eta, new_eta, additional_delay,
                            original_delay, new_delay, confidence, reasoning, comparison_values,
                            and execution runtime.
        """
        if isinstance(request, SimulationRequest):
            original_features = request.original_features
            modified_features = request.modified_features
        elif isinstance(request, dict):
            original_features = request.get("original_features", {})
            modified_features = request.get("modified_features", {})
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request type: expected SimulationRequest or dict, got {type(request).__name__}"
            )

        if not isinstance(original_features, dict) or not isinstance(modified_features, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both 'original_features' and 'modified_features' must be JSON objects (dictionaries)."
            )

        train_num = original_features.get("train_number", "UNKNOWN")
        mod_keys = list(modified_features.keys())
        logger.info(
            f"Received simulation request for train_number={train_num} "
            f"with {len(mod_keys)} modifications: {mod_keys}"
        )

        # 0. Authoritative ML feature metadata derivation
        from app.services.external.train_metadata import TrainMetadataService
        meta = TrainMetadataService.get_train_metadata(train_num)
        if not meta:
            logger.warning(f"Insufficient authoritative metadata for train {train_num}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient data: Could not find authoritative schedule/metadata for train {train_num}. The simulation pipeline cannot use heuristics."
            )
        
        # Hydrate the missing features
        for k, v in meta.items():
            if k not in original_features or original_features[k] is None:
                original_features[k] = v
        
        if "departure_date" not in original_features or not original_features["departure_date"]:
            from datetime import datetime
            original_features["departure_date"] = datetime.now().strftime("%Y-%m-%d")

        # Validate baseline input
        try:
            if validate_prediction_input is None:
                raise ImportError("ML input validation schema is not available.")
            sanitized_original = validate_prediction_input(original_features)
        except (ValueError, TypeError) as val_err:
            logger.warning(f"Simulation baseline validation failed for train_number={train_num}: {val_err}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Original features validation error: {str(val_err)}"
            )

        # Execute simulation with performance timing
        t0 = time.perf_counter()
        try:
            if simulate_eta is None:
                raise ImportError("ML simulation module 'simulate_eta' is not available.")

            sim_result = simulate_eta(sanitized_original, modified_features)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0

            # Derive original ETA timestamp
            orig_delay = sim_result["original_delay"]
            new_delay = sim_result["new_delay"]
            orig_eta = calculate_eta_timestamp(sanitized_original, orig_delay) if calculate_eta_timestamp else None

            # Construct structured comparison values
            comparison_values = {
                "original_delay": orig_delay,
                "new_delay": new_delay,
                "additional_delay": sim_result["additional_delay"],
                "original_eta": orig_eta,
                "new_eta": sim_result["new_eta"],
                "confidence": sim_result["confidence"],
                "modified_features": {
                    param: {
                        "baseline_value": sanitized_original.get(param),
                        "simulated_value": val
                    }
                    for param, val in modified_features.items()
                }
            }

            # Derive corridor stations for realistic delay progression
            corridor_stations = []
            if self.db is not None:
                from app.models.train import TrainCache
                t_cache = self.db.query(TrainCache).filter(TrainCache.train_number == str(train_num)).first()
                if t_cache and t_cache.stations:
                    raw_halts = [s.get("code") or s.get("name") for s in t_cache.stations if s.get("code") or s.get("name")]
                    if len(raw_halts) > 7:
                        step = max(1, len(raw_halts) // 6)
                        sampled = raw_halts[::step]
                        if raw_halts[-1] not in sampled:
                            sampled.append(raw_halts[-1])
                        corridor_stations = sampled[:7]
                    else:
                        corridor_stations = raw_halts

            if not corridor_stations:
                src = meta.get("source", "Origin")
                dst = meta.get("destination", "Destination")
                corridor_stations = [f"{src} (Dep)", f"{dst} (Arr)"]

            response_data = {
                "original_eta": orig_eta,
                "new_eta": sim_result["new_eta"],
                "additional_delay": sim_result["additional_delay"],
                "original_delay": orig_delay,
                "new_delay": new_delay,
                "confidence": sim_result["confidence"],
                "reasoning": sim_result.get("reasoning", []),
                "comparison_values": comparison_values,
                "model": sim_result.get("model", "LightGBM"),
                "model_version": sim_result.get("model_version", "1.1.0-sih2026-production"),
                "prediction_timestamp": sim_result.get("prediction_timestamp"),
                "simulation_time_ms": round(elapsed_ms, 2),
                "corridor_stations": corridor_stations,
            }

            logger.info(
                f"Simulation completed for train_number={train_num}: "
                f"additional_delay={sim_result['additional_delay']}m, "
                f"orig_delay={orig_delay}m -> new_delay={new_delay}m, "
                f"new_ETA={sim_result['new_eta']} "
                f"(simulation_time={elapsed_ms:.2f} ms)"
            )
            return response_data

        except HTTPException:
            raise
        except Exception as sim_err:
            logger.error(
                f"Simulation failure for train_number={train_num}: {sim_err}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Simulation service encountered an error: {str(sim_err)}"
            )

    async def simulate_eta(self, train_number: str, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """
        Operational simulation helper if called with train_number and scenario modifications.
        """
        return await self.simulate({"original_features": {"train_number": str(train_number)}, "modified_features": scenario})

"""
AI Prediction Service for SIH 2026 Train Delay & ETA Prediction System.
Handles singleton ML model lifecycle, strict schema validation, inference timing,
logging, error handling, and operational decision support extensions (weather context,
recovery advice, delay propagation, and alternative plan).
"""
import sys
import time
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Union, Optional
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

ML_DIR = next((d for d in ML_CANDIDATE_DIRS if (d / "predict.py").is_file()), ML_CANDIDATE_DIRS[0])

if str(ML_DIR.parent) not in sys.path:
    sys.path.insert(0, str(ML_DIR.parent))
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

try:
    from ml.predict import predict_eta, load_model_artifacts, calculate_eta_timestamp
    from ml.input_schema import validate_prediction_input
except ImportError as err:
    # Graceful fallback attempt for direct relative imports
    logging.getLogger(__name__).error(f"Failed to import ML module: {err}")
    predict_eta = None
    load_model_artifacts = None
    calculate_eta_timestamp = None
    validate_prediction_input = None

from app.schemas.prediction import PredictionRequest

logger = logging.getLogger("railwise.prediction_service")


class PredictionService:
    """
    Service class managing ML ETA predictions, model lifecycle, and
    operational recovery advisory for railway controllers.
    """
    _model_loaded: bool = False

    def __init__(self, db: Optional[Session] = None) -> None:
        self.db = db

    @classmethod
    def load_model(cls) -> None:
        """
        Loads the ML model artifacts once into memory during application startup.
        Prevents redundant reloads per incoming request.
        """
        if cls._model_loaded:
            logger.info("ML model is already loaded in memory. Skipping reload.")
            return

        logger.info("Starting one-time ML model artifact initialization...")
        t0 = time.perf_counter()
        try:
            if load_model_artifacts is None:
                raise ImportError("ML module 'load_model_artifacts' is not available.")

            load_model_artifacts()
            cls._model_loaded = True
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            logger.info(f"Successfully loaded ML model artifacts in {elapsed_ms:.2f} ms.")
        except Exception as e:
            logger.error(f"Failed to load ML model artifacts: {e}", exc_info=True)
            raise RuntimeError(f"ML Model Loading Failure: {str(e)}") from e

    def _build_weather_context(
        self,
        features: Dict[str, Any],
        live_weather: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Derives atmospheric and weather context grounded in live OpenWeather telemetry
        and journey operational features.
        """
        is_fog = int(features.get("is_fog_risk", 0)) == 1 or float(features.get("fog_risk_score", 0.0)) > 0.3
        is_monsoon = int(features.get("is_monsoon_season", 0)) == 1
        season = str(features.get("season", "Summer"))
        severity = float(features.get("season_severity_score", 0.45))
        fog_score = float(features.get("fog_risk_score", 0.0))

        if live_weather and isinstance(live_weather, dict):
            condition = str(live_weather.get("weather_condition", "Clear"))
            visibility_km = float(live_weather.get("visibility", 10.0))
            temp_c = float(live_weather.get("temperature", 28.0))
            rain_val = float(live_weather.get("rainfall", 0.0))
            rain_intensity = "Heavy" if rain_val > 15.0 else ("Moderate" if rain_val > 2.0 else ("Light" if rain_val > 0.0 else "None"))
            impact = "High" if severity > 0.65 else ("Moderate" if severity > 0.40 else "Low")
            if is_fog or "fog" in condition.lower():
                summary = f"Dense fog caution order active. Visibility {visibility_km} km; automatic signal spacing protocols enforced."
            elif rain_val > 0.0:
                summary = f"Precipitation active ({rain_val} mm/h). Reduced track adhesion; caution braking distances required."
            else:
                summary = f"{condition} sky conditions with {visibility_km} km visibility along section corridor."
            return {
                "condition": condition,
                "visibility_km": visibility_km,
                "fog_alert": is_fog or (visibility_km < 2.0),
                "rainfall_intensity": rain_intensity,
                "temperature_c": temp_c,
                "impact_level": impact,
                "summary": summary
            }

        if is_fog:
            condition = "Dense Fog"
            visibility_km = max(0.5, round(2.0 - fog_score * 1.5, 1))
            rainfall_intensity = "None"
            impact_level = "High"
            summary = f"Dense fog caution order active. Visibility reduced to ~{visibility_km} km; automatic signal caution protocol enforced."
        elif is_monsoon:
            condition = "Monsoon Downpour" if severity > 0.6 else "Monsoon Rain"
            visibility_km = max(2.5, round(6.0 - severity * 3.0, 1))
            rainfall_intensity = "Heavy" if severity > 0.6 else "Moderate"
            impact_level = "High" if severity > 0.7 else "Moderate"
            summary = f"Monsoon seasonal precipitation active. Track adhesion reduced; sectional water logging caution orders may apply."
        else:
            condition = "Clear / Favorable"
            visibility_km = 8.5
            rainfall_intensity = "None"
            impact_level = "Low" if severity > 0.6 else "None"
            summary = f"{season} operating conditions favorable with unobstructed line-of-sight visibility."

        return {
            "condition": condition,
            "visibility_km": visibility_km,
            "fog_alert": is_fog,
            "rainfall_intensity": rainfall_intensity,
            "temperature_c": 28.0 if season == "Summer" else (18.0 if is_fog else 25.0),
            "impact_level": impact_level,
            "summary": summary
        }

    def _build_recovery_advice(self, features: Dict[str, Any], predicted_delay: int) -> List[str]:
        """
        Generates actionable, domain-specific dispatch and operational recovery advice.
        """
        advice = []
        is_single_track = int(features.get("track_doubled", 1)) == 0
        is_hdn = int(features.get("is_hdn_route", 0)) == 1
        late_rake = int(features.get("late_incoming_rake", 0)) == 1

        if predicted_delay <= 5:
            advice.append("Journey running punctually on timetable; maintain standard line regulation.")
            advice.append("Adhere strictly to standard 2-minute commercial passenger halt dwell limits.")
            advice.append("Ensure green-wave signal precedence through upcoming major junction throats.")
        else:
            # Speed recovery
            advice.append("Authorize sectional speed recovery up to Maximum Permissible Speed (MPS) where track PSR permits.")
            # Dwell time compression
            advice.append("Enforce commercial dwell compression: trim passenger station stops by 60 to 90 seconds.")
            # Junction clearance
            advice.append("Grant dynamic precedence over freight loops and lower-tier passenger services at crossing interlockings.")
    def _build_recovery_advice(self, features: Dict[str, Any], predicted_delay: int, stations: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        from app.services.ai.agents.recovery_agent import RecoveryAdvisorAgent
        return RecoveryAdvisorAgent.generate_advice(features, predicted_delay, stations or [])

    def _build_delay_propagation(self, features: Dict[str, Any], predicted_delay: int, stations: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        from app.services.ai.agents.propagation_agent import DelayPropagationAgent
        return DelayPropagationAgent.calculate_propagation(
            current_delay_min=int(features.get("current_delay", 0)),
            predicted_delay_min=predicted_delay,
            stations=stations or []
        )

    def _build_alternative_plan(
        self,
        features: Dict[str, Any],
        predicted_delay: int,
        predicted_eta: str
    ) -> Optional[Dict[str, Any]]:
        from app.services.ai.agents.alternative_agent import AlternativePlanningAgent
        train_number = str(features.get("train_number", ""))
        return AlternativePlanningAgent.find_alternative(
            current_train_number=train_number,
            predicted_delay_min=predicted_delay,
            predicted_eta_str=predicted_eta,
            features=features
        )

    async def predict(self, request: Union[PredictionRequest, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes ETA prediction using the production LightGBM pipeline
        and enriches the response with decision support context for the frontend.

        Args:
            request: PredictionRequest model or dictionary of journey features.

        Returns:
            Dict[str, Any]: Exact ML prediction enriched with weather_context,
                            recovery_advice, delay_propagation, and alternative_plan.
        """
        # Ensure model is ready
        if not self._model_loaded:
            logger.warning("ML model was not preloaded at startup. Initializing on first request...")
            self.load_model()

        # Extract features dictionary
        if isinstance(request, PredictionRequest):
            features = request.to_feature_dict()
        elif isinstance(request, dict):
            features = request
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request type: expected PredictionRequest or dict, got {type(request).__name__}"
            )

        train_num = features.get("train_number", "UNKNOWN")
        logger.info(f"Received prediction request for train_number={train_num}")

        # 0. Authoritative ML feature metadata derivation
        from app.services.external.train_metadata import TrainMetadataService
        meta = TrainMetadataService.get_train_metadata(train_num)
        if not meta:
            logger.warning(f"Insufficient authoritative metadata for train {train_num}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient data: Could not find authoritative schedule/metadata for train {train_num}. The prediction pipeline cannot use heuristics."
            )
        
        # Hydrate the missing features
        for k, v in meta.items():
            if k not in features or features[k] is None:
                features[k] = v
        
        if "departure_date" not in features or not features["departure_date"]:
            features["departure_date"] = datetime.now().strftime("%Y-%m-%d")

        # 1. Fetch live train status via RailRadar if train_number is available
        live_train = None
        if train_num and train_num != "UNKNOWN":
            try:
                from app.services.external.train_service import TrainService
                train_service = TrainService(db=self.db)
                live_train = await train_service.get_live_train(train_num)
                if ("train_type" not in features or not features["train_type"]) and live_train:
                    features["train_type"] = live_train.get("train_name", "Superfast Express")
            except Exception as train_err:
                logger.warning(f"Could not retrieve live train telemetry for train {train_num}: {train_err}")

        # 2. Fetch live weather via OpenWeather at train's coordinates
        live_weather = None
        lat = features.get("latitude") or (live_train.get("latitude") if live_train else None)
        lon = features.get("longitude") or (live_train.get("longitude") if live_train else None)
        if lat is not None and lon is not None:
            try:
                from app.services.external.weather_service import WeatherService
                weather_service = WeatherService(db=self.db)
                live_weather = await weather_service.get_current_weather(latitude=float(lat), longitude=float(lon))
            except Exception as wx_err:
                logger.warning(f"Could not retrieve live weather telemetry for lat={lat}, lon={lon}: {wx_err}")

        # 3. Synthesize dynamic operational, climatic, and historical features
        try:
            from ml.dynamic_features import synthesize_dynamic_features
            features = synthesize_dynamic_features(
                features=features,
                live_train=live_train,
                live_weather=live_weather,
                db=self.db
            )
        except Exception as syn_err:
            logger.warning(f"Dynamic feature synthesis fallback: {syn_err}")

        # 4. Strict validation against ML contract
        try:
            if validate_prediction_input is None:
                raise ImportError("ML validation schema is not available.")
            sanitized = validate_prediction_input(features)
        except (ValueError, TypeError) as val_err:
            logger.warning(f"Input validation rejected for train_number={train_num}: {val_err}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Input validation error: {str(val_err)}"
            )

        # 5. Execute model inference with performance timing
        t0 = time.perf_counter()
        try:
            logger.info(f"Submitting sanitized feature vector to ML pipeline for train {train_num}: {sanitized}")
            result = predict_eta(sanitized)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0

            predicted_delay = int(result.get("predicted_delay", 0))
            predicted_eta_str = str(result.get("predicted_eta", ""))

            # Enrich response with decision support extensions for frontend
            stations = live_train.get("stations", []) if live_train else []
            result["weather_context"] = self._build_weather_context(sanitized, live_weather=live_weather)
            result["recovery_advice"] = self._build_recovery_advice(sanitized, predicted_delay, stations)
            result["delay_propagation"] = self._build_delay_propagation(sanitized, predicted_delay, stations)
            result["alternative_plan"] = self._build_alternative_plan(sanitized, predicted_delay, predicted_eta_str)
            result["inference_time_ms"] = round(elapsed_ms, 2)
            
            is_static_model = "current_delay" not in sanitized
            is_midway = False
            if live_train:
                curr = live_train.get("current_station")
                src = live_train.get("source")
                if curr and src and curr != src and curr != "DEP":
                    is_midway = True
            
            if is_static_model and is_midway:
                result["is_valid_for_live_journey"] = False
                result["invalid_reason"] = "Insufficient live journey state (Model is static origin-to-destination)"
            else:
                result["is_valid_for_live_journey"] = True
                result["invalid_reason"] = None

            # Persist prediction in SQLite PredictionHistory
            if self.db is not None:
                try:
                    from app.models.prediction import PredictionHistory
                    today = datetime.now(timezone.utc).date()
                    try:
                        eta_time = datetime.strptime(predicted_eta_str, "%H:%M").time()
                        eta_dt = datetime.combine(today, eta_time, tzinfo=timezone.utc)
                    except Exception:
                        eta_dt = datetime.now(timezone.utc)

                    real_train_name = ""
                    if live_train:
                        real_train_name = live_train.get("train_name", "")
                    if not real_train_name:
                        real_train_name = meta.get("train_type", f"Train {train_num}")

                    existing_record = self.db.query(PredictionHistory).filter(
                        PredictionHistory.train_number == str(train_num)
                    ).order_by(PredictionHistory.created_at.desc()).first()

                    now_utc = datetime.now(timezone.utc)
                    if existing_record and existing_record.created_at.date() == today:
                        existing_record.predicted_eta = eta_dt
                        existing_record.predicted_delay = float(predicted_delay)
                        existing_record.confidence = float(result.get("confidence", 85.0))
                        existing_record.weather_condition = str(result.get("weather_context", {}).get("condition", "Clear"))
                        existing_record.created_at = now_utc
                    else:
                        history_record = PredictionHistory(
                            train_number=str(train_num),
                            train_name=str(real_train_name),
                            predicted_eta=eta_dt,
                            predicted_delay=float(predicted_delay),
                            confidence=float(result.get("confidence", 85.0)),
                            weather_condition=str(result.get("weather_context", {}).get("condition", "Clear")),
                            created_at=now_utc,
                        )
                        self.db.add(history_record)
                    self.db.commit()
                except Exception as hist_err:
                    logger.warning(f"Could not persist PredictionHistory for {train_num}: {hist_err}")
                    self.db.rollback()

            logger.info(
                f"Prediction completed for train_number={train_num}: "
                f"delay={predicted_delay}m, "
                f"ETA={predicted_eta_str}, "
                f"confidence={result.get('confidence')}% "
                f"(inference_time={elapsed_ms:.2f} ms)"
            )
            return result
        except HTTPException:
            raise
        except Exception as pred_err:
            logger.error(
                f"Prediction failure for train_number={train_num}: {pred_err}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Prediction service encountered an error: {str(pred_err)}"
            )

    async def predict_eta(self, train_number: str) -> Dict[str, Any]:
        """
        Operational helper if called with just train_number.
        """
        return await self.predict({"train_number": str(train_number)})

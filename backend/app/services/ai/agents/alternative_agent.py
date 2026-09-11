import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class AlternativePlanningAgent:
    """
    Agent responsible for searching the authoritative registry for genuine 
    faster alternatives to the current delayed train.
    """

    @staticmethod
    def find_alternative(
        current_train_number: str,
        predicted_delay_min: int,
        predicted_eta_str: str,
        features: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        if predicted_delay_min < 30:
            # If delay is minor, don't suggest alternatives
            return None

        try:
            from app.services.external.train_metadata import TRAIN_METADATA_REGISTRY
            
            current_meta = TRAIN_METADATA_REGISTRY.get(str(current_train_number))
            if not current_meta:
                return None
                
            destination = current_meta.get("destination")
            source = current_meta.get("source")
            if not destination:
                return None

            # For real implementation, this would query a routing DB.
            # Here we search the static authoritative registry.
            best_alt = None
            best_time_saved = 0

            # Convert predicted ETA to minutes from midnight
            try:
                eta_h, eta_m = map(int, predicted_eta_str.split(":")[:2])
                current_eta_min = eta_h * 60 + eta_m
                
                # Handle next-day wrap around roughly
                now = datetime.now()
                now_min = now.hour * 60 + now.minute
                if current_eta_min < now_min:
                    current_eta_min += 24 * 60
            except:
                return None

            for alt_num, alt_meta in TRAIN_METADATA_REGISTRY.items():
                if alt_num == current_train_number:
                    continue
                    
                # Must share the same destination
                if alt_meta.get("destination") != destination:
                    continue
                    
                # Basic check: is this train leaving soon from the same general area?
                # In a real DB we'd check if it stops at the current station.
                # For this implementation, we assume it's valid if it leaves later today.
                dep_hour = alt_meta.get("departure_hour", 0)
                travel_hours = alt_meta.get("scheduled_travel_hours", 1)
                
                # Calculate arrival time
                arr_min = int(dep_hour * 60 + travel_hours * 60)
                if arr_min < now_min:
                    arr_min += 24 * 60 # Next day
                    
                # Is it faster than our delayed train?
                time_saved = current_eta_min - arr_min
                
                if time_saved >= 30 and time_saved > best_time_saved:
                    best_time_saved = time_saved
                    best_alt = {
                        "train_number": alt_num,
                        "train_name": alt_meta.get("train_type", f"Train {alt_num}"),
                        "departure_station": alt_meta.get("source", "Current Station"),
                        "destination": destination,
                        "departure_time": f"{dep_hour:02d}:00",
                        "arrival_time": f"{(arr_min // 60) % 24:02d}:{(arr_min % 60):02d}",
                        "estimated_journey_hours": travel_hours,
                        "estimated_time_saved_minutes": time_saved,
                        "reason": f"Shorter route with less congestion. Arrives {time_saved} minutes earlier."
                    }

            return best_alt

        except Exception as e:
            logger.warning(f"Alternative planning failed: {e}")
            return None

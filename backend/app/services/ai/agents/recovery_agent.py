import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class RecoveryAdvisorAgent:
    """
    Agent responsible for generating actionable operational recovery recommendations 
    based on deterministic evaluation of remaining route and train capabilities.
    """

    @staticmethod
    def generate_advice(
        features: Dict[str, Any], 
        predicted_delay_min: int,
        stations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        if predicted_delay_min <= 0:
            return []

        advice = []
        
        # Determine remaining route metrics
        remaining_stops = 0
        remaining_km = 0.0
        
        if stations:
            upcoming = [s for s in stations if s.get("status") in ["current", "upcoming"]]
            remaining_stops = len(upcoming) - 1 # exclude destination
            if len(upcoming) >= 2:
                remaining_km = upcoming[-1].get("km", 0) - upcoming[0].get("km", 0)
        else:
            # Fallback if no detailed route data
            remaining_stops = int(features.get("num_scheduled_stops", 2)) // 2
            remaining_km = float(features.get("distance_km", 100.0)) / 2

        # 1. Action: Dwell Time Compression
        # If there are stops remaining, we can compress dwell by ~1 min per stop
        if remaining_stops > 0:
            dwell_savings = min(predicted_delay_min, remaining_stops * 1)
            if dwell_savings > 0:
                advice.append({
                    "action": "Compress Halt Dwell Times",
                    "reason": f"Expediting dispatch at {remaining_stops} remaining intermediate halts.",
                    "estimated_recovery_minutes": dwell_savings,
                    "confidence": 85,
                    "affected_station": "Upcoming route halts"
                })

        # 2. Action: Accelerate to Maximum Permissible Speed (MPS)
        # Assuming current scheduled speed has a 10% buffer.
        if remaining_km > 50:
            scheduled_hours = float(features.get("scheduled_travel_hours", 1.0))
            if scheduled_hours > 0:
                scheduled_speed = features.get("distance_km", 100) / scheduled_hours
                # Time remaining at scheduled speed vs MPS (scheduled * 1.1)
                hours_at_scheduled = remaining_km / max(1.0, scheduled_speed)
                hours_at_mps = remaining_km / max(1.0, scheduled_speed * 1.1)
                
                speed_savings_min = int((hours_at_scheduled - hours_at_mps) * 60)
                speed_savings_min = min(speed_savings_min, predicted_delay_min)
                
                if speed_savings_min >= 5:
                    advice.append({
                        "action": "Accelerate to Sectional MPS",
                        "reason": f"Utilizing the ~10% operational speed buffer over the remaining {int(remaining_km)} km.",
                        "estimated_recovery_minutes": speed_savings_min,
                        "confidence": 75,
                        "affected_station": "Mainline sections"
                    })

        # 3. Action: Priority Routing at Junctions
        # High delay warrants an override
        if predicted_delay_min >= 45 and remaining_km > 100:
            advice.append({
                "action": "Grant Through-Line Priority",
                "reason": "Bypass freight loops and hold lower-priority traffic at upcoming major junctions.",
                "estimated_recovery_minutes": min(15, predicted_delay_min),
                "confidence": 60,
                "affected_station": "Division Junctions"
            })

        return advice

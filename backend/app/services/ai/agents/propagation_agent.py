import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DelayPropagationAgent:
    """
    Agent responsible for projecting delay cascades across the upcoming stations 
    on a train's route. Uses deterministic interpolation of the final ML-predicted delay.
    """
    
    @staticmethod
    def calculate_propagation(
        current_delay_min: int,
        predicted_delay_min: int,
        stations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Projects delay at each upcoming station.
        """
        if not stations:
            return []

        # Filter to only upcoming stations
        upcoming_stations = []
        passed_current = False
        
        for st in stations:
            status = st.get("status", "upcoming")
            if status == "current":
                passed_current = True
                # Sometimes we want to include current if it hasn't departed yet.
                upcoming_stations.append(st)
            elif status == "upcoming" or passed_current:
                upcoming_stations.append(st)
                
        if not upcoming_stations:
            return []

        # If there's only 1 upcoming station (the destination), just apply predicted_delay
        if len(upcoming_stations) == 1:
            st = upcoming_stations[0]
            return [DelayPropagationAgent._build_station_projection(st, predicted_delay_min)]

        total_distance = upcoming_stations[-1].get("km", 0) - upcoming_stations[0].get("km", 0)
        
        propagation = []
        for i, st in enumerate(upcoming_stations):
            if i == len(upcoming_stations) - 1:
                # Destination gets the final predicted delay exactly
                delay_at_st = predicted_delay_min
            elif total_distance <= 0:
                # Fallback if distance data is missing
                progression = i / (len(upcoming_stations) - 1)
                delay_at_st = int(current_delay_min + progression * (predicted_delay_min - current_delay_min))
            else:
                dist_progress = st.get("km", 0) - upcoming_stations[0].get("km", 0)
                progression = dist_progress / total_distance
                delay_at_st = int(current_delay_min + progression * (predicted_delay_min - current_delay_min))
            
            propagation.append(DelayPropagationAgent._build_station_projection(st, delay_at_st))

        return propagation

    @staticmethod
    def _build_station_projection(st: Dict[str, Any], delay_min: int) -> Dict[str, Any]:
        """
        Builds the structured projection dictionary.
        """
        scheduled_arrival = st.get("scheduledArrival")
        predicted_arrival = None
        
        if scheduled_arrival:
            try:
                # scheduled_arrival is usually HH:MM or ISO string
                if "T" in scheduled_arrival:
                    dt = datetime.fromisoformat(scheduled_arrival)
                    dt += timedelta(minutes=delay_min)
                    predicted_arrival = dt.strftime("%H:%M")
                elif ":" in scheduled_arrival:
                    # HH:MM
                    hours, mins = map(int, scheduled_arrival.split(":")[:2])
                    total_mins = hours * 60 + mins + delay_min
                    arr_h = (total_mins // 60) % 24
                    arr_m = total_mins % 60
                    predicted_arrival = f"{arr_h:02d}:{arr_m:02d}"
            except Exception:
                pass

        return {
            "station_code": st.get("code", "UNK"),
            "station_name": st.get("name", "Unknown Station"),
            "scheduled_arrival": scheduled_arrival if scheduled_arrival else None,
            "predicted_arrival": predicted_arrival,
            "predicted_delay_minutes": delay_min,
            "status": "Delayed" if delay_min > 10 else "On Time"
        }

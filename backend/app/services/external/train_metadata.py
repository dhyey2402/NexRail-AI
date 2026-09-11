"""
Authoritative train metadata and schedule service.
In a production system, this would query a dedicated Timetable/Schedule Database.
For now, this serves as the authoritative static registry.
"""
from typing import Dict, Any, Optional

# Static registry acting as the authoritative schedule DB
TRAIN_METADATA_REGISTRY = {
    "12301": {
        "train_type": "Rajdhani Express",
        "zone_abbr": "ER",
        "distance_km": 1530.0,
        "scheduled_travel_hours": 17.0,
        "num_scheduled_stops": 6,
        "departure_hour": 16,
        "source": "HWH",
        "destination": "NDLS"
    },
    "12951": {
        "train_type": "Rajdhani Express",
        "zone_abbr": "WR",
        "distance_km": 1384.0,
        "scheduled_travel_hours": 15.5,
        "num_scheduled_stops": 7,
        "departure_hour": 17,
        "source": "MMCT",
        "destination": "NDLS"
    },
    "12002": {
        "train_type": "Shatabdi Express",
        "zone_abbr": "NR",
        "distance_km": 705.0,
        "scheduled_travel_hours": 8.5,
        "num_scheduled_stops": 5,
        "departure_hour": 6,
        "source": "NDLS",
        "destination": "RKMP"
    },
    "12627": {
        "train_type": "Karnataka Express",
        "zone_abbr": "SWR",
        "distance_km": 2406.0,
        "scheduled_travel_hours": 39.0,
        "num_scheduled_stops": 32,
        "departure_hour": 19,
        "source": "SBC",
        "destination": "NDLS"
    },
    "12839": {
        "train_type": "Chennai Mail",
        "zone_abbr": "SER",
        "distance_km": 1663.0,
        "scheduled_travel_hours": 28.0,
        "num_scheduled_stops": 25,
        "departure_hour": 23,
        "source": "HWH",
        "destination": "MAS"
    },
    "12259": {
        "train_type": "Duronto Express",
        "zone_abbr": "ER",
        "distance_km": 1454.0,
        "scheduled_travel_hours": 16.5,
        "num_scheduled_stops": 3,
        "departure_hour": 18,
        "source": "SDAH",
        "destination": "BKN"
    },
    "12050": {
        "train_type": "Gatimaan Express",
        "zone_abbr": "NR",
        "distance_km": 188.0,
        "scheduled_travel_hours": 1.67,
        "num_scheduled_stops": 2,
        "departure_hour": 8,
        "source": "NZM",
        "destination": "VGLB"
    },
    "12004": {
        "train_type": "Shatabdi Express",
        "zone_abbr": "NR",
        "distance_km": 195.0,
        "scheduled_travel_hours": 2.0,
        "num_scheduled_stops": 2,
        "departure_hour": 6,
        "source": "NZM",
        "destination": "VGLB"
    }
}

class TrainMetadataService:
    @staticmethod
    def get_train_metadata(train_number: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves authoritative ML feature metadata (schedule, distance, zone) for a given train.
        Returns None if the train is not in the authoritative database.
        """
        return TRAIN_METADATA_REGISTRY.get(str(train_number).strip())

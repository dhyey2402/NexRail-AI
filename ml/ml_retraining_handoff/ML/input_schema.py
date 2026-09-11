"""
Official Input Schema and Validation Contract for SIH 2026 Train Delay & ETA Prediction System.
Defines required fields, automatically derived features, optional fields with domain defaults,
and unsupported live features.
"""

from typing import Dict, Any, List, Tuple
from datetime import datetime


# 1. REQUIRED FIELDS (must be provided by caller/backend)
REQUIRED_FROM_BACKEND: List[str] = [
    "train_number",
    "train_type",
    "zone_abbr",
    "distance_km",
    "scheduled_travel_hours",
    "num_scheduled_stops",
    "departure_date",
    "departure_hour",
]

# 2. DERIVED AUTOMATICALLY (computed from required fields or feature engineering)
DERIVED_FEATURES: List[str] = [
    "year",
    "month",
    "day_of_week",
    "is_weekend",
    "is_night_departure",
    "is_peak_hour",
    "is_monsoon_season",
    "scheduled_speed_kmh",
    "stops_per_100km",
    "psr_per_100km",
    "avg_stop_spacing_km",
    "sin_hour",
    "cos_hour",
    "sin_month",
    "cos_month",
    "composite_congestion_risk",
    "composite_fog_risk",
    "avg_rolling_stock_age",
    "maintenance_deficit",
    "rake_delay_pressure",
    "single_track_hdn_bottleneck",
    "hist_train_type_avg_delay",
    "hist_zone_avg_delay",
    "hist_traction_avg_delay",
]

# 3. OPTIONAL FIELDS WITH DOMAIN-SAFE OPERATIONAL DEFAULTS
# These defaults reflect standard Indian Railways operational baselines
# (e.g. broad-gauge electrification, doubled track trunk lines, regular rake)
DOMAIN_DEFAULTS: Dict[str, Any] = {
    "track_doubled": 1,                     # Most primary IR trunk lines are doubled/quadrupled
    "is_hdn_route": 0,                      # Non-HDN route default
    "traction_type": "Electric (25kV AC)",  # Over 90% of IR broad-gauge network is electrified
    "is_electrified": 1,                    # Electrified default
    "psr_count": 2,                         # National section median permanent speed restrictions
    "is_circular_route": 0,                 # Linear service standard
    "is_fog_risk": 0,                       # No fog caution order default
    "fog_risk_score": 0.0,                  # Clear visibility base
    "zone_fog_index": 0.45,                 # Network average fog risk
    "zone_congestion_index": 0.65,          # Network median line capacity utilization
    "season_severity_score": 0.45,          # Neutral climatic severity
    "season": "Summer",                     # Standard season
    "loco_age_years": 10.0,                 # Median active locomotive fleet age
    "coach_age_years": 10.0,                # Median active passenger coach fleet age
    "has_lhb_coaches": 1,                   # Modern LHB coaches are standard for express trains
    "is_rake_shared": 0,                    # Dedicated rake allocation default
    "maintenance_score": 7.0,               # Satisfactory preventive overhaul tier
    "seat_utilisation_pct": 80.0,           # Standard reservation occupancy load
    "late_incoming_rake": 0,                # On-time turnaround assumed unless flagged
    "is_special_train": 0,                  # Regular timetabled service
    "route_historical_ontime_pct": 70.0,    # National average route punctuality
    "source_station_category": "B",         # Standard origin junction tier
    "destination_station_category": "B",    # Standard destination junction tier
    "is_festival_season": 0,                # Non-festival operational base
    "scheduled_arrival": None,              # If None, dynamically computed from departure + travel hours
}

OPTIONAL_FEATURES: List[str] = list(DOMAIN_DEFAULTS.keys())

# 4. UNSUPPORTED LIVE TELEMETRY (requires historical logging + model retraining)
UNSUPPORTED_LIVE_FEATURES: List[str] = [
    "current_speed",
    "speed_deviation",
    "live_rainfall",
    "live_temperature",
    "live_visibility",
    "live_wind_speed",
    "weather_condition",
    "current_gps_lat",
    "current_gps_lon",
]

# Valid Category Domains for input validation
VALID_TRAIN_TYPES = {
    "Superfast Express", "Mail/Express", "DEMU/MEMU", "Intercity Express",
    "Passenger Train", "Jan Shatabdi Express", "Vande Bharat Express",
    "Shatabdi Express", "Sampark Kranti Express", "Rajdhani Express",
    "Humsafar Express", "Garib Rath Express", "Duronto Express",
    "Tejas Express", "Gatimaan Express"
}

VALID_ZONES = {
    "NR", "NCR", "NER", "NFR", "NWR", "ER", "ECR", "ECoR",
    "SER", "SECR", "SR", "SCR", "SWR", "WR", "WCR", "CR"
}

VALID_STATION_CATEGORIES = {"A1", "A", "B", "C", "D", "E"}
VALID_TRACTIONS = {"Electric (25kV AC)", "Diesel", "Dual"}


def validate_prediction_input(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rigorously validates raw input dictionary against the official schema.
    Applies domain-safe defaults for missing optional features.
    Computes date-derived fields if not present.
    Returns sanitized, fully populated journey dictionary ready for pipeline.
    """
    if not isinstance(features, dict):
        raise TypeError(f"Input features must be a Python dictionary, got {type(features).__name__}")

    # Check required fields
    missing = [f for f in REQUIRED_FROM_BACKEND if f not in features]
    if missing:
        raise ValueError(
            f"Missing required prediction features: {', '.join(missing)}. "
            f"These fields are mandatory for accurate ETA calculation."
        )

    # Type & Range Checks
    # 1. distance_km
    try:
        dist = float(features["distance_km"])
        if dist <= 0 or dist > 5000:
            raise ValueError(f"distance_km must be between 1 and 5000 km, got {dist}")
    except (TypeError, ValueError) as e:
        if "must be between" in str(e):
            raise
        raise TypeError(f"distance_km must be numeric, got {features['distance_km']}")

    # 2. scheduled_travel_hours
    try:
        hours = float(features["scheduled_travel_hours"])
        if hours <= 0 or hours > 120:
            raise ValueError(f"scheduled_travel_hours must be between 0.1 and 120.0 hours, got {hours}")
    except (TypeError, ValueError) as e:
        if "must be between" in str(e):
            raise
        raise TypeError(f"scheduled_travel_hours must be numeric, got {features['scheduled_travel_hours']}")

    # 3. num_scheduled_stops
    try:
        stops = int(features["num_scheduled_stops"])
        if stops < 0 or stops > 150:
            raise ValueError(f"num_scheduled_stops must be between 0 and 150, got {stops}")
    except (TypeError, ValueError) as e:
        if "must be between" in str(e):
            raise
        raise TypeError(f"num_scheduled_stops must be an integer, got {features['num_scheduled_stops']}")

    # 4. departure_hour
    try:
        hour = int(features["departure_hour"])
        if hour < 0 or hour > 23:
            raise ValueError(f"departure_hour must be in range [0, 23], got {hour}")
    except (TypeError, ValueError) as e:
        if "must be in range" in str(e):
            raise
        raise TypeError(f"departure_hour must be an integer, got {features['departure_hour']}")

    # 5. departure_date
    dep_date_str = str(features["departure_date"]).strip()
    try:
        dep_date = datetime.strptime(dep_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"departure_date must follow 'YYYY-MM-DD' format, got '{dep_date_str}'")

    # 6. train_type check (graceful normalization)
    tt = str(features["train_type"]).strip()
    if tt not in VALID_TRAIN_TYPES:
        # Match case-insensitively or fall back safely
        matched = False
        for vt in VALID_TRAIN_TYPES:
            if vt.lower() == tt.lower():
                tt = vt
                matched = True
                break
        if not matched:
            raise ValueError(
                f"Unknown train_type '{tt}'. Must be one of: {', '.join(sorted(VALID_TRAIN_TYPES))}"
            )

    # 7. zone_abbr check
    zone = str(features["zone_abbr"]).strip().upper()
    if zone not in VALID_ZONES:
        raise ValueError(f"Unknown zone_abbr '{zone}'. Must be one of: {', '.join(sorted(VALID_ZONES))}")

    # Build sanitized output with domain defaults
    sanitized = features.copy()
    sanitized["train_type"] = tt
    sanitized["zone_abbr"] = zone
    sanitized["distance_km"] = dist
    sanitized["scheduled_travel_hours"] = hours
    sanitized["num_scheduled_stops"] = stops
    sanitized["departure_hour"] = hour
    sanitized["departure_date"] = dep_date_str

    # Apply date-derived attributes if not explicitly supplied
    if "year" not in sanitized:
        sanitized["year"] = dep_date.year
    if "month" not in sanitized:
        sanitized["month"] = dep_date.month
    if "day_of_week" not in sanitized:
        sanitized["day_of_week"] = dep_date.weekday()
    if "is_weekend" not in sanitized:
        sanitized["is_weekend"] = 1 if dep_date.weekday() in [5, 6] else 0
    if "is_night_departure" not in sanitized:
        sanitized["is_night_departure"] = 1 if hour in [22, 23, 0, 1, 2, 3] else 0
    if "is_peak_hour" not in sanitized:
        sanitized["is_peak_hour"] = 1 if hour in [6, 7, 8, 17, 18, 19] else 0
    if "is_monsoon_season" not in sanitized:
        sanitized["is_monsoon_season"] = 1 if dep_date.month in [6, 7, 8, 9] else 0

    # Fill domain defaults for remaining optional operational features
    for opt_key, opt_def in DOMAIN_DEFAULTS.items():
        if opt_key not in sanitized or sanitized[opt_key] is None:
            sanitized[opt_key] = opt_def

    return sanitized

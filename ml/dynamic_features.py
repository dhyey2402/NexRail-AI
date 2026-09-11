"""
Dynamic Feature Synthesizer for SIH 2026 Train Delay & ETA Prediction System.
Computes deterministic, explainable operational features from Live APIs (RailRadar, OpenWeather)
and SQLite historical database analytics, replacing static DOMAIN_DEFAULTS.
"""
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("ml.dynamic_features")

# Zonal Line Capacity Benchmarks (Indian Railways Line Capacity Utilization Reports)
ZONAL_CAPACITY_BASE: Dict[str, float] = {
    "NCR": 0.85,  # North Central (high-density Golden Quadrilateral corridor)
    "NR": 0.82,   # Northern (congested Delhi hub & junctions)
    "WR": 0.78,   # Western (Mumbai-Ahmedabad trunk)
    "CR": 0.78,   # Central (Mumbai-Bhusawal-Nagpur trunk)
    "ECR": 0.76,  # East Central (heavy coal & freight trunks)
    "ER": 0.75,   # Eastern (Howrah approach network)
    "SECR": 0.72, # South East Central (heavy mineral freight)
    "SCR": 0.68,  # South Central
    "SR": 0.66,   # Southern
    "ECoR": 0.64, # East Coast
    "WCR": 0.64,  # West Central
    "NER": 0.60,  # North Eastern
    "NWR": 0.58,  # North Western
    "SWR": 0.55,  # South Western
    "NFR": 0.52,  # Northeast Frontier
}

# Zonal On-Time Punctuality Historical Benchmarks (%)
ZONAL_ONTIME_BASE: Dict[str, float] = {
    "SWR": 82.0,
    "SCR": 80.0,
    "SR": 78.0,
    "WR": 76.0,
    "WCR": 75.0,
    "CR": 74.0,
    "ECoR": 72.0,
    "SECR": 71.0,
    "NWR": 70.0,
    "NER": 68.0,
    "NFR": 67.0,
    "ER": 66.0,
    "ECR": 65.0,
    "NR": 64.0,
    "NCR": 62.0,
}

# High-Density Network (HDN) Zones
HDN_ZONES = {"NR", "NCR", "WR", "CR", "ER", "ECR"}


def derive_season(month: int) -> Tuple[str, int]:
    """
    Derives standard Indian meteorological season and monsoon indicator from calendar month.
    
    Returns:
        Tuple[str, int]: (season_name, is_monsoon_season)
    """
    if month in [12, 1, 2]:
        return "Winter", 0
    elif month in [3, 4, 5]:
        return "Summer", 0
    elif month in [6, 7, 8, 9]:
        return "Monsoon", 1
    else:
        return "Post-Monsoon", 0


def derive_weather_features(
    weather: Optional[Dict[str, Any]],
    season: str,
    month: int,
    hour: int,
    zone_abbr: str
) -> Dict[str, Any]:
    """
    Translates live OpenWeather telemetry into model features:
    fog_risk_score, is_fog_risk, zone_fog_index, and season_severity_score.
    """
    if weather and isinstance(weather, dict):
        vis_km = float(weather.get("visibility", 10.0))
        hum = float(weather.get("humidity", 50.0))
        temp = float(weather.get("temperature", 28.0))
        rain = float(weather.get("rainfall", 0.0))
        wind = float(weather.get("wind_speed", 10.0))
        condition = str(weather.get("weather_condition", "Clear")).lower()

        # 1. Fog Risk Score (0.0 to 1.0)
        if any(c in condition for c in ["fog", "mist", "haze", "smoke"]) or vis_km < 2.0:
            fog_score = min(1.0, max(0.40, (2.0 - vis_km) / 2.0 * 0.70 + (hum / 100.0) * 0.30))
        elif hum > 85.0 and hour in [22, 23, 0, 1, 2, 3, 4, 5, 6, 7]:
            fog_score = min(0.60, max(0.0, (hum - 80.0) / 20.0 * 0.50))
        else:
            fog_score = 0.0

        is_fog = 1 if (fog_score >= 0.30 or vis_km < 2.0) else 0

        # 2. Zone Fog Index (0.0 to 1.0)
        is_northern = zone_abbr in ["NR", "NCR", "NER", "NWR", "ECR", "ER"]
        base_zone_fog = 0.75 if (is_northern and season == "Winter") else (0.45 if season == "Winter" else 0.20)
        zone_fog_index = round(min(1.0, base_zone_fog * 0.50 + fog_score * 0.50), 2)

        # 3. Season Severity Score (0.10 to 0.95)
        rain_factor = min(1.0, rain / 30.0)
        wind_factor = min(1.0, max(0.0, (wind - 25.0) / 40.0))
        heat_factor = min(1.0, max(0.0, (temp - 38.0) / 10.0))
        cold_factor = min(1.0, max(0.0, (10.0 - temp) / 10.0))

        if season == "Monsoon":
            severity = 0.35 + 0.45 * rain_factor + 0.15 * wind_factor
        elif season == "Winter":
            severity = 0.30 + 0.45 * fog_score + 0.20 * cold_factor
        elif season == "Summer":
            severity = 0.25 + 0.50 * heat_factor
        else:  # Post-Monsoon
            severity = 0.20 + 0.30 * rain_factor

        season_severity = round(min(0.95, max(0.10, severity)), 2)

        return {
            "fog_risk_score": round(fog_score, 2),
            "is_fog_risk": is_fog,
            "zone_fog_index": zone_fog_index,
            "season_severity_score": season_severity,
        }

    # Climatological baseline if live weather not accessible
    is_winter = (season == "Winter")
    is_monsoon = (season == "Monsoon")
    return {
        "fog_risk_score": 0.45 if (is_winter and zone_abbr in ["NR", "NCR"]) else 0.0,
        "is_fog_risk": 1 if (is_winter and zone_abbr in ["NR", "NCR"]) else 0,
        "zone_fog_index": 0.70 if is_winter else 0.30,
        "season_severity_score": 0.65 if is_monsoon else (0.55 if is_winter else 0.35),
    }


def derive_congestion_index(
    zone_abbr: str,
    hour: int,
    current_delay: int = 0,
    speed: float = 0.0
) -> float:
    """
    Computes dynamic sectional congestion index based on zonal capacity,
    departure peak periods, delay backpressure, and operating velocity.
    """
    base = ZONAL_CAPACITY_BASE.get(zone_abbr, 0.65)
    
    # Peak suburban/trunk departure windows: 07:00-10:00 and 17:00-20:00
    peak_bonus = 0.08 if hour in [7, 8, 9, 10, 17, 18, 19, 20] else 0.0
    
    # Sectional delay propagation backpressure (up to +0.15)
    delay_penalty = min(0.15, max(0.0, current_delay / 120.0))
    
    # High running speed indicates clear block sections (relief -0.05)
    speed_relief = 0.05 if speed > 95.0 else 0.0

    congestion = base + peak_bonus + delay_penalty - speed_relief
    return round(min(0.95, max(0.30, congestion)), 2)


def derive_maintenance_score(
    train_type: str,
    has_lhb: int = 1,
    loco_age: float = 10.0,
    coach_age: float = 10.0
) -> float:
    """
    Computes explainable rolling stock maintenance tier based on operational tier,
    coach technology (LHB vs ICF), and fleet vintage.
    """
    tt = train_type.lower()
    if any(k in tt for k in ["vande bharat", "tejas", "gatimaan"]):
        base = 9.2
    elif any(k in tt for k in ["rajdhani", "shatabdi", "duronto"]):
        base = 8.6
    elif any(k in tt for k in ["superfast", "garib rath", "humsafar", "sampark kranti"]):
        base = 7.8
    elif any(k in tt for k in ["mail", "express", "intercity", "jan shatabdi"]):
        base = 7.0
    else:  # Passenger, DEMU, MEMU
        base = 5.8

    # LHB stainless steel modern coaches vs ICF legacy design
    coach_tech_adj = 0.5 if has_lhb == 1 else -0.6

    # Fleet age decay (baseline 5 years)
    age_decay = max(0.0, loco_age - 5.0) * 0.04 + max(0.0, coach_age - 5.0) * 0.04

    score = base + coach_tech_adj - age_decay
    return round(min(9.8, max(3.5, score)), 1)


def derive_seat_utilisation(
    train_type: str,
    day_of_week: int,
    month: int,
    distance_km: float = 500.0
) -> float:
    """
    Estimates passenger reservation load factor based on train category,
    weekend travel surges, festival seasonality, and route haul.
    """
    tt = train_type.lower()
    if any(k in tt for k in ["garib rath", "humsafar"]):
        base = 96.0
    elif any(k in tt for k in ["rajdhani", "shatabdi", "vande bharat"]):
        base = 94.0
    elif any(k in tt for k in ["superfast", "mail", "express", "sampark kranti"]):
        base = 88.0
    elif any(k in tt for k in ["intercity", "jan shatabdi"]):
        base = 78.0
    else:
        base = 65.0

    # Day-of-week demand curve
    if day_of_week in [4, 6]:  # Friday & Sunday weekend exodus/return
        day_adj = 6.0
    elif day_of_week in [0, 5]:  # Monday business / Saturday weekend
        day_adj = 3.0
    elif day_of_week in [1, 2]:  # Tuesday / Wednesday midweek
        day_adj = -3.0
    else:
        day_adj = 0.0

    # Festival season (October/November Diwali, Chhath, Durga Puja)
    is_festival = 1 if month in [10, 11] else 0
    fest_adj = 7.0 if is_festival == 1 else 0.0

    # Long-distance cross-country trains
    dist_adj = 3.0 if distance_km > 1000.0 else 0.0

    total = base + day_adj + fest_adj + dist_adj
    return round(min(100.0, max(40.0, total)), 1)


def derive_late_incoming_rake(
    train_telemetry: Optional[Dict[str, Any]] = None,
    current_delay: int = 0
) -> int:
    """
    Detects if the incoming rake turnaround was delayed at origin.
    """
    if train_telemetry and isinstance(train_telemetry, dict):
        status = str(train_telemetry.get("status", "")).lower()
        if "at-station" in status and current_delay > 15:
            return 1
        curr_loc = train_telemetry.get("currentLocation", {})
        if curr_loc and curr_loc.get("distanceFromOriginKm", 100) < 40 and current_delay > 20:
            return 1

    return 1 if current_delay > 25 else 0


def derive_historical_ontime_pct(
    train_number: str,
    zone_abbr: str,
    db: Optional[Any] = None
) -> float:
    """
    Calculates historical on-time punctuality rate (<=15 min delay)
    from SQLite PredictionHistory, blended with official IR zonal benchmarks.
    """
    zonal_benchmark = ZONAL_ONTIME_BASE.get(zone_abbr, 70.0)

    if db is not None:
        try:
            from app.models.prediction import PredictionHistory
            past_records = (
                db.query(PredictionHistory.predicted_delay)
                .filter(PredictionHistory.train_number == str(train_number))
                .limit(50)
                .all()
            )
            if past_records and len(past_records) >= 3:
                ontime_count = sum(1 for (delay,) in past_records if delay <= 15.0)
                sample_rate = (ontime_count / len(past_records)) * 100.0
                # Weighted blend: 60% sample data + 40% zonal benchmark
                blended = 0.60 * sample_rate + 0.40 * zonal_benchmark
                return round(blended, 1)
        except Exception as e:
            logger.warning(f"Error querying PredictionHistory for on-time stats: {e}")

    return round(zonal_benchmark, 1)


def synthesize_dynamic_features(
    features: Dict[str, Any],
    live_train: Optional[Dict[str, Any]] = None,
    live_weather: Optional[Dict[str, Any]] = None,
    db: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Master dynamic feature synthesizer.
    Combines caller inputs, live train telemetry, live weather telemetry,
    and historical database records into a complete, non-hardcoded feature dictionary.
    """
    syn = features.copy()

    # 1. Parse date and hour
    dep_date_str = str(syn.get("departure_date", datetime.now().strftime("%Y-%m-%d")))
    try:
        dep_date = datetime.strptime(dep_date_str, "%Y-%m-%d").date()
    except Exception:
        dep_date = datetime.now().date()

    hour = int(syn.get("departure_hour", 12))
    month = dep_date.month
    day_of_week = dep_date.weekday()
    zone = str(syn.get("zone_abbr", "NR")).upper()
    train_type = str(syn.get("train_type", "Superfast Express"))
    train_num = str(syn.get("train_number", "UNKNOWN"))
    dist = float(syn["distance_km"]) if ("distance_km" in syn and syn["distance_km"] is not None) else 500.0

    # 2. Season & Monsoon (respect explicit caller input if supplied)
    if "season" not in syn or not syn["season"]:
        season, is_monsoon = derive_season(month)
        syn["season"] = season
        syn["is_monsoon_season"] = is_monsoon
    else:
        season = str(syn["season"])
        if "is_monsoon_season" not in syn or syn["is_monsoon_season"] is None:
            syn["is_monsoon_season"] = 1 if season.lower() == "monsoon" else 0
        is_monsoon = int(syn["is_monsoon_season"])

    # 3. Calendar Flags
    syn["year"] = dep_date.year
    syn["month"] = month
    syn["day_of_week"] = day_of_week
    syn["is_weekend"] = 1 if day_of_week in [5, 6] else 0
    syn["is_night_departure"] = 1 if hour in [22, 23, 0, 1, 2, 3] else 0
    syn["is_peak_hour"] = 1 if hour in [6, 7, 8, 9, 17, 18, 19, 20] else 0
    syn["is_festival_season"] = 1 if month in [10, 11] else 0

    # 4. Live Train Telemetry Integration
    current_delay = 0
    current_speed = 0.0
    if live_train and isinstance(live_train, dict):
        current_delay = int(live_train.get("current_delay", 0))
        current_speed = float(live_train.get("speed", 0.0))

    # 5. Live Weather Features Integration (only overwrite defaults, preserve caller/live overrides)
    if live_weather is not None:
        weather_feats = derive_weather_features(live_weather, season, month, hour, zone)
        syn.update(weather_feats)
    else:
        weather_feats = derive_weather_features(None, season, month, hour, zone)
        for k, v in weather_feats.items():
            if k not in syn or syn[k] is None:
                syn[k] = v

    # 6. Congestion Index
    if "zone_congestion_index" not in syn or syn["zone_congestion_index"] is None:
        syn["zone_congestion_index"] = derive_congestion_index(zone, hour, current_delay, current_speed)

    # 7. Late Incoming Rake
    if "late_incoming_rake" not in syn or syn["late_incoming_rake"] is None:
        syn["late_incoming_rake"] = derive_late_incoming_rake(live_train, current_delay)

    # 8. Maintenance Score
    has_lhb = int(syn.get("has_lhb_coaches", 1))
    loco_age = float(syn.get("loco_age_years", 10.0))
    coach_age = float(syn.get("coach_age_years", 10.0))
    if "maintenance_score" not in syn or syn["maintenance_score"] is None:
        syn["maintenance_score"] = derive_maintenance_score(train_type, has_lhb, loco_age, coach_age)

    # 9. Seat Utilisation
    if "seat_utilisation_pct" not in syn or syn["seat_utilisation_pct"] is None:
        syn["seat_utilisation_pct"] = derive_seat_utilisation(train_type, day_of_week, month, dist)

    # 10. Route Historical Punctuality
    if "route_historical_ontime_pct" not in syn or syn["route_historical_ontime_pct"] is None:
        syn["route_historical_ontime_pct"] = derive_historical_ontime_pct(train_num, zone, db)

    # 11. Infrastructure & Route characteristics
    if "is_hdn_route" not in syn or syn["is_hdn_route"] is None:
        syn["is_hdn_route"] = 1 if zone in HDN_ZONES and dist > 400.0 else 0

    if "track_doubled" not in syn or syn["track_doubled"] is None:
        # Single track is more common on non-trunk routes in NFR, SWR, ECoR
        syn["track_doubled"] = 0 if zone in ["NFR"] else 1

    if "traction_type" not in syn or syn["traction_type"] is None:
        syn["traction_type"] = "Electric (25kV AC)"

    if "is_electrified" not in syn or syn["is_electrified"] is None:
        syn["is_electrified"] = 1 if "electric" in str(syn["traction_type"]).lower() else 0

    if "psr_count" not in syn or syn["psr_count"] is None:
        # PSR count scales with distance: approx 1 restriction per 250 km
        syn["psr_count"] = max(1, int(round(dist / 250.0)))

    if "has_lhb_coaches" not in syn:
        syn["has_lhb_coaches"] = 1

    if "is_rake_shared" not in syn:
        syn["is_rake_shared"] = 0

    if "is_special_train" not in syn:
        syn["is_special_train"] = 1 if train_num.startswith("0") else 0

    if "is_circular_route" not in syn:
        syn["is_circular_route"] = 0

    if "source_station_category" not in syn:
        syn["source_station_category"] = "A" if any(k in train_type.lower() for k in ["rajdhani", "shatabdi", "vande bharat"]) else "B"

    if "destination_station_category" not in syn:
        syn["destination_station_category"] = "A" if any(k in train_type.lower() for k in ["rajdhani", "shatabdi", "vande bharat"]) else "B"

    if "loco_age_years" not in syn:
        syn["loco_age_years"] = loco_age

    if "coach_age_years" not in syn:
        syn["coach_age_years"] = coach_age

    return syn

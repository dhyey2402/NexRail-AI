"""
Geographic Sanity and Station Coordinate Resolution Service.
Provides authoritative geographic coordinates for Indian Railways stations,
route enrichment, Haversine spatial validation, and GPS sanity auditing.
"""
import json
import math
import logging
from pathlib import Path
from typing import Dict, Tuple, Optional, List, Any

logger = logging.getLogger(__name__)

# Locate stations_coords.json
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

CANDIDATE_PATHS = [
    BACKEND_DIR / "data" / "stations_coords.json",
    PROJECT_ROOT / "backend" / "app" / "data" / "stations_coords.json",
    Path.cwd() / "app" / "data" / "stations_coords.json",
    Path.cwd() / "backend" / "app" / "data" / "stations_coords.json",
]

STATIONS_MAP: Dict[str, List[Any]] = {}

for p in CANDIDATE_PATHS:
    if p.is_file():
        try:
            with open(p, "r", encoding="utf-8") as f:
                STATIONS_MAP = json.load(f)
            logger.info(f"Loaded {len(STATIONS_MAP)} station coordinates from {p}")
            break
        except Exception as e:
            logger.warning(f"Error loading station coordinates from {p}: {e}")

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points on Earth in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_station_coords(code: str) -> Optional[Tuple[float, float, str]]:
    """Returns (lat, lng, name) for a station code or None if unmapped."""
    if not code:
        return None
    info = STATIONS_MAP.get(str(code).strip().upper())
    if info and len(info) >= 2:
        name = info[2] if len(info) > 2 else code
        return (float(info[0]), float(info[1]), str(name))
    return None

def is_valid_indian_coord(lat: float, lng: float) -> bool:
    """Checks whether coordinates are strictly within India's terrestrial bounds and non-zero."""
    if not lat or not lng:
        return False
    if lat == 0.0 and lng == 0.0:
        return False
    # India terrestrial bounds: Lat 6.0°N - 37.5°N, Lon 68.0°E - 97.5°E
    return 6.0 <= lat <= 38.0 and 68.0 <= lng <= 98.0

def enrich_route_stations(stations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Enriches a list of route station dictionaries with authoritative latitude/longitude coordinates.
    Never invents coordinates; uses verified stations_coords.json.
    """
    if not stations:
        return []
    
    enriched = []
    for s in stations:
        st_copy = dict(s)
        code = st_copy.get("code") or st_copy.get("stationCode")
        cur_lat = float(st_copy.get("lat", 0.0) or 0.0)
        cur_lng = float(st_copy.get("lng", 0.0) or 0.0)

        # If coords are missing or 0.0, resolve from authoritative registry
        if not is_valid_indian_coord(cur_lat, cur_lng) and code:
            resolved = get_station_coords(code)
            if resolved:
                st_copy["lat"] = resolved[0]
                st_copy["lng"] = resolved[1]
                if not st_copy.get("name"):
                    st_copy["name"] = resolved[2]
            else:
                st_copy["lat"] = 0.0
                st_copy["lng"] = 0.0
        enriched.append(st_copy)
    return enriched

def is_location_consistent_with_route(
    lat: float, 
    lng: float, 
    stations: List[Dict[str, Any]], 
    max_tolerance_km: float = 120.0
) -> Tuple[bool, str]:
    """
    Performs geographic sanity check: verifies whether a reported GPS position is plausible
    relative to the train's verified route.
    
    Returns:
        (is_consistent: bool, message: str)
    """
    if not is_valid_indian_coord(lat, lng):
        return (False, "Coordinates are missing or outside valid Indian geographic bounds")

    # Find valid stations in route
    valid_stn_coords = []
    for s in (stations or []):
        s_lat = float(s.get("lat", 0.0) or 0.0)
        s_lng = float(s.get("lng", 0.0) or 0.0)
        if is_valid_indian_coord(s_lat, s_lng):
            valid_stn_coords.append((s_lat, s_lng, s.get("code", "STN")))

    if not valid_stn_coords:
        # If route has no mapped station coordinates, we cannot verify consistency
        return (True, "Route coordinates unavailable for sanity comparison")

    # Calculate distance from reported coordinate to closest route station
    min_dist = float("inf")
    closest_stn = None
    for s_lat, s_lng, code in valid_stn_coords:
        dist = haversine_km(lat, lng, s_lat, s_lng)
        if dist < min_dist:
            min_dist = dist
            closest_stn = code

    if min_dist > max_tolerance_km:
        msg = (
            f"GPS position ({lat:.4f}, {lng:.4f}) is geographically inconsistent: "
            f"{min_dist:.1f} km away from nearest route station ({closest_stn}). Max tolerance is {max_tolerance_km} km."
        )
        logger.warning(msg)
        return (False, msg)

    return (True, f"GPS position consistent with route (nearest station {closest_stn} at {min_dist:.1f} km)")

def resolve_train_position(
    current_station: str,
    next_station: str,
    speed: float,
    stations: List[Dict[str, Any]]
) -> Tuple[float, float, str]:
    """
    Deterministically resolves a train's location based on verified route stations.
    
    Returns:
        (lat, lng, status_str):
        status_str is one of 'LIVE_GPS', 'STATION_POSITION', 'ROUTE_INTERPOLATED', 'UNAVAILABLE'
    """
    # 1. Check if current station has valid coordinates
    curr_coords = get_station_coords(current_station)
    next_coords = get_station_coords(next_station) if next_station else None

    # If both current and next stations have coords and speed > 10 km/h, interpolate along line
    if curr_coords and next_coords and curr_coords[:2] != next_coords[:2] and speed > 10.0:
        c_lat, c_lng = curr_coords[0], curr_coords[1]
        n_lat, n_lng = next_coords[0], next_coords[1]
        
        # Linear interpolation 25% towards next station
        interp_lat = round(c_lat + (n_lat - c_lat) * 0.25, 5)
        interp_lng = round(c_lng + (n_lng - c_lng) * 0.25, 5)
        
        # Verify sanity
        ok, _ = is_location_consistent_with_route(interp_lat, interp_lng, stations)
        if ok:
            return (interp_lat, interp_lng, "ROUTE_INTERPOLATED")

    # If current station has coords, place at current station
    if curr_coords:
        c_lat, c_lng = curr_coords[0], curr_coords[1]
        ok, _ = is_location_consistent_with_route(c_lat, c_lng, stations)
        if ok:
            return (c_lat, c_lng, "STATION_POSITION")

    # Check if any station marked 'current' in stations list has coords
    for s in (stations or []):
        if s.get("status") == "current" or s.get("code") == current_station:
            s_lat = float(s.get("lat", 0.0) or 0.0)
            s_lng = float(s.get("lng", 0.0) or 0.0)
            if is_valid_indian_coord(s_lat, s_lng):
                return (s_lat, s_lng, "STATION_POSITION")

    # No verified coordinates could be determined
    return (0.0, 0.0, "UNAVAILABLE")

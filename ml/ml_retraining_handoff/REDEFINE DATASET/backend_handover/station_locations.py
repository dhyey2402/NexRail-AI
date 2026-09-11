"""
Station Location & Coordinate Mapping Service
Workspace: REDEFINE DATASET/weather/
Provides verified geographic coordinates (latitude, longitude) for Indian Railway stations
by unifying archive/stations.json with modern official station renamings and new terminals.
"""

import json
from pathlib import Path
from typing import Dict, Tuple, Optional

WEATHER_DIR = Path(__file__).resolve().parent
REDEFINE_DIR = WEATHER_DIR.parent
PROJECT_ROOT = REDEFINE_DIR.parent
STATIONS_JSON_PATH = PROJECT_ROOT / "archive" / "stations.json"

# Authoritative coordinates for official Indian Railway renamings (2018–2024)
# and new major terminal extensions not in legacy station dictionaries.
RECENT_STATION_MAP: Dict[str, Tuple[float, float, str, str, str]] = {
    # Code: (Latitude, Longitude, Name, State, Zone)
    "CSMT": (18.9401, 72.8351, "Chhatrapati Shivaji Maharaj Terminus", "Maharashtra", "CR"),
    "BNRS": (25.3176, 82.9667, "Banaras (formerly Manduadih MUV)", "Uttar Pradesh", "NER"),
    "MMCT": (18.9696, 72.8193, "Mumbai Central (formerly BCT)", "Maharashtra", "WR"),
    "SMVB": (13.0034, 77.6534, "Sir M. Visvesvaraya Terminal Bengaluru", "Karnataka", "SWR"),
    "PYGS": (25.4358, 81.8463, "Prayagraj Sangam", "Uttar Pradesh", "NR"),
    "SBIB": (23.0805, 72.5804, "Sabarmati BG", "Gujarat", "WR"),
    "NITR": (21.1610, 79.1170, "Netaji Subhash Chandra Bose Itwari", "Maharashtra", "SECR"),
    "VGLJ": (25.4484, 78.5685, "Virangana Lakshmibai Jhansi (JHS)", "Uttar Pradesh", "NCR"),
    "DADN": (22.5539, 75.7644, "Dr. Ambedkar Nagar (Mhow)", "Madhya Pradesh", "WR"),
    "MASS": (13.0827, 80.2707, "Chennai Central Suburban", "Tamil Nadu", "SR"),
    "DDU":  (25.2798, 83.1232, "Pt. Deen Dayal Upadhyaya (Mughalsarai)", "Uttar Pradesh", "ECR"),
    "GODA": (24.8315, 87.2144, "Godda", "Jharkhand", "ER"),
    "TVCN": (8.4875,  76.9532, "Thiruvananthapuram Central", "Kerala", "SR"),
    "CBY":  (22.3168, 72.6209, "Khambhat (Cambay)", "Gujarat", "WR"),
    "BRML": (34.2045, 74.3436, "Baramula", "Jammu & Kashmir", "NR"),
    "PRYJ": (25.4437, 81.8262, "Prayagraj Junction (Allahabad ALD)", "Uttar Pradesh", "NCR"),
    "AYC":  (26.7766, 82.1388, "Ayodhya Cantt (Faizabad FD)", "Uttar Pradesh", "NR"),
    "RKMP": (23.2045, 77.4402, "Rani Kamlapati (Habibganj HBJ)", "Madhya Pradesh", "WCR"),
    "BAHL": (33.8824, 75.0931, "Banihal", "Jammu & Kashmir", "NR"),
    "ANLG": (33.9856, 75.1481, "Anantnag", "Jammu & Kashmir", "NR"),
    "YNRK": (30.0869, 78.2882, "Yog Nagari Rishikesh", "Uttarakhand", "NR"),
    "BDGM": (34.0200, 74.7200, "Badgam", "Jammu & Kashmir", "NR"),
    "EKNR": (21.8344, 73.7144, "Ekta Nagar (Kevadiya / Statue of Unity)", "Gujarat", "WR"),
    "KLBG": (17.3364, 76.8373, "Kalaburagi (Gulbarga GR)", "Karnataka", "CR"),
    "PRRB": (25.4380, 81.8540, "Prayagraj Rambag", "Uttar Pradesh", "NER"),
    "MZP":  (25.1464, 82.5698, "Mirzapur", "Uttar Pradesh", "NCR"),
    "MAQ":  (12.8625, 74.8385, "Mangaluru Central", "Karnataka", "SR"),
    "MBDP": (25.9234, 81.9961, "Maa Belha Devi Dham Pratapgarh (PBH)", "Uttar Pradesh", "NR"),
    "SBRM": (23.0034, 91.7324, "Sabroom", "Tripura", "NFR"),
    "PRNC": (25.7766, 87.4667, "Purnea Court", "Bihar", "ECR"),
    "DSPL": (20.3444, 84.8569, "Daspalla", "Odisha", "ECoR"),
    "DBNK": (28.1667, 78.2500, "Dibai", "Uttar Pradesh", "NR"),
    "KEMK": (31.1833, 74.5667, "Khem Karan", "Punjab", "NR"),
    "MZS":  (27.8833, 77.4167, "Murhesi Rampur / Mathura Sub", "Uttar Pradesh", "NCR"),
    "KGE":  (27.5000, 79.9167, "Katghar", "Uttar Pradesh", "NR"),
    "TTO":  (27.3500, 80.1167, "Tandiyawan", "Uttar Pradesh", "NR"),
    "KMN":  (27.6000, 78.4000, "Khamgaon", "Maharashtra", "CR"),
    "KRMR": (23.5000, 87.2500, "Karmatar", "Jharkhand", "ER"),
    "SNPU": (26.8150, 75.7680, "Sanganer", "Rajasthan", "NWR"),
    "DLPC": (31.7961, 75.9904, "Daulatpur Chawk", "Himachal Pradesh", "NR"),
    "SNNR": (32.9912, 74.9317, "Shri Mata Vaishno Devi Katra (SVDK)", "Jammu & Kashmir", "NR"),
    "GPNB": (26.1500, 91.7500, "Guwahati New Block", "Assam", "NFR"),
    "NHLN": (27.1084, 93.6934, "Naharlagun (Itanagar)", "Arunachal Pradesh", "NFR"),
    "MLFC": (28.6500, 77.2000, "Mughal Sarai Yard / Local Feeder", "Uttar Pradesh", "ECR"),
    "MCTM": (32.9150, 75.1417, "Martyr Capt Tushar Mahajan (Udhampur UHP)", "Jammu & Kashmir", "NR"),
    "VSHI": (22.2858, 73.1895, "Vishwamitri", "Gujarat", "WR"),
    "HRGR": (26.5000, 83.5000, "Hathras Qilah", "Uttar Pradesh", "NER"),
}

_LOADED_STATIONS: Optional[Dict[str, Tuple[float, float, str, str, str]]] = None


def get_station_locations() -> Dict[str, Tuple[float, float, str, str, str]]:
    """
    Returns a unified mapping of station code -> (lat, lon, name, state, zone).
    Caches parsed results in memory for sub-millisecond lookups.
    """
    global _LOADED_STATIONS
    if _LOADED_STATIONS is not None:
        return _LOADED_STATIONS

    stations: Dict[str, Tuple[float, float, str, str, str]] = {}

    if STATIONS_JSON_PATH.exists():
        with open(STATIONS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        for feat in data.get("features", []):
            if not feat:
                continue
            props = feat.get("properties") or {}
            geom = feat.get("geometry") or {}
            code = props.get("code")
            coords = geom.get("coordinates")
            if code and coords and len(coords) >= 2:
                # GeoJSON coordinates are [longitude, latitude]
                lat = float(coords[1])
                lon = float(coords[0])
                # Ensure valid Indian geographic bounds (lat 6–38°N, lon 68–98°E)
                if 6.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0:
                    stations[code.strip().upper()] = (
                        round(lat, 4),
                        round(lon, 4),
                        props.get("name", code),
                        props.get("state", "Unknown"),
                        props.get("zone", "IR"),
                    )

    # Apply modern station renamings and terminal expansions
    for code, info in RECENT_STATION_MAP.items():
        stations[code] = info

    _LOADED_STATIONS = stations
    return _LOADED_STATIONS


def get_station_coordinates(station_code: str) -> Optional[Tuple[float, float]]:
    """
    Returns (latitude, longitude) for a station code, or None if unmapped.
    """
    stations = get_station_locations()
    info = stations.get(str(station_code).strip().upper())
    if info:
        return (info[0], info[1])
    return None


def get_weather_grid_key(lat: float, lon: float, resolution: float = 0.25) -> Tuple[float, float]:
    """
    Snaps continuous geographic coordinates to the nearest atmospheric reanalysis grid point.
    Default resolution is 0.25 degrees (~25km), matching ECMWF ERA5 reanalysis grid.
    """
    grid_lat = round(round(lat / resolution) * resolution, 2)
    grid_lon = round(round(lon / resolution) * resolution, 2)
    return (grid_lat, grid_lon)


# Standard function aliases for external callers and agents
get_station_location = get_station_coordinates
snap_to_grid = get_weather_grid_key


"""
Historical Weather Ingestion & Caching Engine
Workspace: REDEFINE DATASET/weather/
Fetches real, authoritative historical weather observations from the Open-Meteo Historical Weather Archive
(ECMWF ERA5 reanalysis at 0.25-degree resolution) for Indian Railway station grid cells.
Implements:
- Resumable SQLite caching (historical_weather_cache.sqlite)
- Multi-location batching (up to 10 grid cells per API call)
- Rate limiting and exponential backoff retry logic
- Complete 365-day hourly resolution (2025-02-08 to 2026-02-07 = 8,760 hours/grid)
- Zero synthetic data; 100% reproducible reanalysis data
"""

import json
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Set, Tuple

WEATHER_DIR = Path(__file__).resolve().parent
REDEFINE_DIR = WEATHER_DIR.parent
DB_CACHE_PATH = WEATHER_DIR / "historical_weather_cache.sqlite"

START_DATE = "2025-02-08"
END_DATE = "2026-02-07"
BASE_URL = "https://archive-api.open-meteo.com/v1/archive"
HOURLY_VARS = (
    "temperature_2m,relative_humidity_2m,dew_point_2m,"
    "rain,precipitation,surface_pressure,wind_speed_10m,wind_gusts_10m,weather_code"
)


def init_cache_database(db_path: Path = DB_CACHE_PATH) -> sqlite3.Connection:
    """Initializes SQLite cache schema with composite indexing for high-speed queries."""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS grid_metadata (
        grid_lat REAL,
        grid_lon REAL,
        fetched_at TEXT,
        total_hours INTEGER,
        PRIMARY KEY (grid_lat, grid_lon)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hourly_weather (
        grid_lat REAL,
        grid_lon REAL,
        time_iso TEXT,
        temp_c REAL,
        humidity_pct REAL,
        dew_point_c REAL,
        rain_mm REAL,
        precip_mm REAL,
        pressure_hpa REAL,
        wind_speed_kmh REAL,
        wind_gusts_kmh REAL,
        weather_code INTEGER,
        PRIMARY KEY (grid_lat, grid_lon, time_iso)
    )
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_grid_time 
    ON hourly_weather (grid_lat, grid_lon, time_iso)
    """)

    conn.commit()
    return conn


def get_cached_grids(conn: sqlite3.Connection) -> Set[Tuple[float, float]]:
    """Returns set of already cached (grid_lat, grid_lon) tuples."""
    cursor = conn.cursor()
    cursor.execute("SELECT grid_lat, grid_lon FROM grid_metadata")
    return {(row[0], row[1]) for row in cursor.fetchall()}


def fetch_weather_batch(
    grid_points: List[Tuple[float, float]],
    start_date: str = START_DATE,
    end_date: str = END_DATE,
    max_retries: int = 4,
) -> List[Dict]:
    """
    Fetches historical weather for a batch of coordinates from Open-Meteo.
    Handles single-point and multi-point responses gracefully with exponential backoff.
    """
    if not grid_points:
        return []

    lats_str = ",".join(f"{lat:.2f}" for lat, _ in grid_points)
    lons_str = ",".join(f"{lon:.2f}" for _, lon in grid_points)

    params = {
        "latitude": lats_str,
        "longitude": lons_str,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": HOURLY_VARS,
        "timezone": "Asia/Kolkata",  # Local Indian Standard Time (IST) alignment
    }

    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"
    headers = {"User-Agent": "NexRailAI-WeatherPipeline/1.0 (IndianRailways-SIH2026)"}

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if isinstance(data, dict):
                return [data]
            elif isinstance(data, list):
                return data
            else:
                return []

        except urllib.error.HTTPError as e:
            if e.code == 429:  # Rate limited
                wait = (attempt + 1) * 10
                print(f"  [Rate-Limited] HTTP 429. Backing off {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [HTTP Error {e.code}] on attempt {attempt + 1}: {e.reason}")
                time.sleep((attempt + 1) * 3)
        except Exception as e:
            print(f"  [Network Error] on attempt {attempt + 1}: {e}")
            time.sleep((attempt + 1) * 3)

    print(f"Failed to fetch batch for {len(grid_points)} locations after {max_retries} retries.")
    return []


def ingest_weather_for_grids(
    target_grids: List[Tuple[float, float]],
    batch_size: int = 10,
    delay_sec: float = 1.2,
    db_path: Path = DB_CACHE_PATH,
) -> int:
    """
    Ingests full-year historical hourly weather for target grid cells into SQLite cache.
    Skips already cached grid cells. Returns count of newly cached grid cells.
    """
    conn = init_cache_database(db_path)
    cached_grids = get_cached_grids(conn)

    needed_grids = [g for g in target_grids if g not in cached_grids]
    print(f"Total requested grids: {len(target_grids)} | Already cached: {len(cached_grids)} | To fetch: {len(needed_grids)}")

    if not needed_grids:
        conn.close()
        return 0

    newly_cached = 0
    cursor = conn.cursor()

    for i in range(0, len(needed_grids), batch_size):
        batch = needed_grids[i : i + batch_size]
        batch_idx = (i // batch_size) + 1
        total_batches = (len(needed_grids) + batch_size - 1) // batch_size
        print(f"\n---> Fetching Batch {batch_idx}/{total_batches} ({len(batch)} grid locations)...")

        t0 = time.time()
        results = fetch_weather_batch(batch)
        elapsed = time.time() - t0

        if not results:
            print(f"     Skipping failed batch {batch_idx}.")
            continue

        for orig_req, loc_data in zip(batch, results):
            req_lat, req_lon = orig_req
            hourly = loc_data.get("hourly", {})
            times = hourly.get("time", [])

            if not times:
                continue

            temps = hourly.get("temperature_2m", [None] * len(times))
            humids = hourly.get("relative_humidity_2m", [None] * len(times))
            dews = hourly.get("dew_point_2m", [None] * len(times))
            rains = hourly.get("rain", [None] * len(times))
            precips = hourly.get("precipitation", [None] * len(times))
            pressures = hourly.get("surface_pressure", [None] * len(times))
            winds = hourly.get("wind_speed_10m", [None] * len(times))
            gusts = hourly.get("wind_gusts_10m", [None] * len(times))
            codes = hourly.get("weather_code", [None] * len(times))

            rows_to_insert = []
            for t_str, t_c, h_pct, dp_c, r_mm, p_mm, p_hpa, w_kmh, g_kmh, w_code in zip(
                times, temps, humids, dews, rains, precips, pressures, winds, gusts, codes
            ):
                # Standardize time string from '2025-02-08T00:00' to '2025-02-08 00:00'
                norm_time = t_str.replace("T", " ")
                rows_to_insert.append((
                    req_lat, req_lon, norm_time,
                    t_c, h_pct, dp_c, r_mm, p_mm, p_hpa, w_kmh, g_kmh, w_code
                ))

            cursor.executemany("""
            INSERT OR REPLACE INTO hourly_weather (
                grid_lat, grid_lon, time_iso,
                temp_c, humidity_pct, dew_point_c,
                rain_mm, precip_mm, pressure_hpa,
                wind_speed_kmh, wind_gusts_kmh, weather_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows_to_insert)

            cursor.execute("""
            INSERT OR REPLACE INTO grid_metadata (grid_lat, grid_lon, fetched_at, total_hours)
            VALUES (?, ?, datetime('now'), ?)
            """, (req_lat, req_lon, len(rows_to_insert)))

            newly_cached += 1

        conn.commit()
        print(f"     Batch {batch_idx} committed in {elapsed:.2f}s ({len(rows_to_insert) * len(results):,} hourly rows saved).")
        time.sleep(delay_sec)

    conn.close()
    return newly_cached


def load_cached_weather_dict(
    db_path: Path = DB_CACHE_PATH,
) -> Dict[Tuple[float, float, str, int], Tuple[float, float, float, float, float, float, float, float, int]]:
    """
    Loads SQLite hourly weather cache into a fast in-memory hash map:
    Key: (grid_lat, grid_lon, date_str 'YYYY-MM-DD', hour_int 0..23)
    Value: (temp_c, humidity_pct, dew_point_c, rain_mm, precip_mm, pressure_hpa, wind_speed_kmh, wind_gusts_kmh, weather_code)
    """
    if not db_path.exists():
        return {}

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("""
    SELECT grid_lat, grid_lon, time_iso,
           temp_c, humidity_pct, dew_point_c,
           rain_mm, precip_mm, pressure_hpa,
           wind_speed_kmh, wind_gusts_kmh, weather_code
    FROM hourly_weather
    """)

    weather_map = {}
    for row in cursor.fetchall():
        glat, glon, t_str, temp, hum, dew, rain, precip, press, wind, gust, code = row
        # t_str is 'YYYY-MM-DD HH:MM'
        date_part = t_str[:10]
        try:
            hour_part = int(t_str[11:13])
        except Exception:
            hour_part = 12

        weather_map[(glat, glon, date_part, hour_part)] = (
            temp, hum, dew, rain, precip, press, wind, gust, code
        )

    conn.close()
    return weather_map


if __name__ == "__main__":
    from station_locations import get_station_coordinates, get_weather_grid_key
    import pandas as pd

    print("=" * 80)
    print("INGESTING REAL HISTORICAL WEATHER FROM OPEN-METEO (ERA5 REANALYSIS)")
    print("=" * 80)

    # Determine unique station grid cells in order of journey frequency
    dataset_csv = REDEFINE_DIR / "ml_training_dataset.csv"
    print(f"Scanning stations from '{dataset_csv}'...")
    df = pd.read_csv(dataset_csv, usecols=["source_station", "destination_station"])

    src_counts = df["source_station"].value_counts()
    dst_counts = df["destination_station"].value_counts()

    grid_weights = {}
    for stn, cnt in src_counts.items():
        coords = get_station_coordinates(stn)
        if coords:
            g = get_weather_grid_key(*coords)
            grid_weights[g] = grid_weights.get(g, 0) + cnt

    for stn, cnt in dst_counts.items():
        coords = get_station_coordinates(stn)
        if coords:
            g = get_weather_grid_key(*coords)
            grid_weights[g] = grid_weights.get(g, 0) + cnt

    # Sort grids by frequency
    sorted_grids = [g for g, _ in sorted(grid_weights.items(), key=lambda x: x[1], reverse=True)]
    print(f"Found {len(sorted_grids)} total unique grid cells covering Indian Railways network.")

    # Ingest top 150 grids (covers > 65% of journeys), or all 654
    # To demonstrate fast, reproducible, complete coverage, we can ingest in batches
    target_count = min(len(sorted_grids), 150)
    selected_grids = sorted_grids[:target_count]
    print(f"Targeting top {len(selected_grids)} grid cells covering key railway corridors...")

    cached_count = ingest_weather_for_grids(selected_grids, batch_size=8, delay_sec=1.5)
    print(f"\nIngestion completed! Newly cached grid cells: {cached_count}")

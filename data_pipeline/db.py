"""
Database Layer for Indian Railways Punctuality Data Pipeline.
Manages SQLite connection, schema migrations, indexing, and high-performance batch operations.
"""
import sqlite3
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from contextlib import contextmanager

from data_pipeline.config import config

logger = logging.getLogger(__name__)


def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """
    Creates and configures an optimized SQLite connection with WAL mode.
    """
    path = db_path or config.db_path
    conn = sqlite3.connect(str(path), timeout=30.0)
    conn.row_factory = sqlite3.Row
    # High-performance pragmas for bulk data engineering
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = OFF;")
    conn.execute("PRAGMA cache_size = -256000;")  # 256MB cache
    conn.execute("PRAGMA temp_store = MEMORY;")
    return conn


@contextmanager
def get_db_cursor(db_path: Optional[Path] = None):
    """
    Context manager for database cursor with automatic transaction handling.
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction rolled back due to error: {e}")
        raise
    finally:
        conn.close()


def init_db(db_path: Optional[Path] = None) -> None:
    """
    Initializes all 4 core tables, checkpoint tables, and performance indexes.
    """
    logger.info("Initializing SQLite database tables and schema...")
    with get_db_cursor(db_path) as cur:
        # 1. Trains Master Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS trains (
            train_number TEXT PRIMARY KEY,
            train_name TEXT NOT NULL,
            train_type TEXT,
            zone TEXT,
            source_station TEXT NOT NULL,
            source_station_name TEXT,
            destination_station TEXT NOT NULL,
            destination_station_name TEXT,
            total_distance_km REAL,
            total_halts INTEGER,
            scheduled_departure TEXT,
            scheduled_arrival TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 2. Historical Journeys Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS journeys (
            journey_id TEXT PRIMARY KEY,
            train_number TEXT NOT NULL,
            train_name TEXT NOT NULL,
            date TEXT NOT NULL,
            source_station TEXT NOT NULL,
            destination_station TEXT NOT NULL,
            current_station TEXT,
            scheduled_arrival TEXT,
            actual_arrival TEXT,
            scheduled_departure TEXT,
            actual_departure TEXT,
            arrival_delay_minutes REAL,
            departure_delay_minutes REAL,
            final_delay_minutes REAL,
            on_time INTEGER NOT NULL,
            cancellation_status INTEGER NOT NULL,
            route_completion_status INTEGER NOT NULL,
            stations_crossed_count INTEGER,
            data_source TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (train_number) REFERENCES trains (train_number)
        );
        """)

        # 3. Station Delays Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS station_delays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            journey_id TEXT NOT NULL,
            train_number TEXT NOT NULL,
            date TEXT NOT NULL,
            station_sequence INTEGER NOT NULL,
            station_code TEXT NOT NULL,
            station_name TEXT,
            distance_km REAL,
            scheduled_arrival TEXT,
            actual_arrival TEXT,
            scheduled_departure TEXT,
            actual_departure TEXT,
            arrival_delay_minutes REAL,
            departure_delay_minutes REAL,
            status TEXT,
            FOREIGN KEY (journey_id) REFERENCES journeys (journey_id)
        );
        """)

        # 4. Route Statistics Table (LightGBM Engineered Features)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS route_statistics (
            train_number TEXT PRIMARY KEY,
            source_station TEXT NOT NULL,
            destination_station TEXT NOT NULL,
            zone TEXT,
            total_journeys INTEGER NOT NULL,
            route_historical_ontime_pct REAL NOT NULL,
            average_delay REAL NOT NULL,
            median_delay REAL NOT NULL,
            delay_std REAL NOT NULL,
            percentile_90_delay REAL NOT NULL,
            average_delay_by_month TEXT NOT NULL,
            average_delay_by_weekday TEXT NOT NULL,
            average_delay_by_train REAL NOT NULL,
            average_delay_by_zone REAL NOT NULL,
            computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (train_number) REFERENCES trains (train_number)
        );
        """)

        # 5. Checkpoints Table for Resumption
        cur.execute("""
        CREATE TABLE IF NOT EXISTS scrape_checkpoints (
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            status TEXT NOT NULL,
            last_date TEXT,
            records_ingested INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (entity_type, entity_id)
        );
        """)

        # Migrations for existing tables
        existing_cols = [c[1] for c in cur.execute("PRAGMA table_info(trains)").fetchall()]
        if "source_station_name" not in existing_cols:
            cur.execute("ALTER TABLE trains ADD COLUMN source_station_name TEXT;")
        if "destination_station_name" not in existing_cols:
            cur.execute("ALTER TABLE trains ADD COLUMN destination_station_name TEXT;")

    logger.info("SQLite database schema initialized successfully.")


def drop_indexes(db_path: Optional[Path] = None) -> None:
    """Drops secondary indexes to allow high-throughput bulk insertion."""
    logger.info("Dropping secondary indexes for high-speed bulk ingestion...")
    with get_db_cursor(db_path) as cur:
        cur.execute("DROP INDEX IF EXISTS idx_journeys_train_date;")
        cur.execute("DROP INDEX IF EXISTS idx_journeys_date;")
        cur.execute("DROP INDEX IF EXISTS idx_journeys_ontime;")
        cur.execute("DROP INDEX IF EXISTS idx_station_delays_journey;")
        cur.execute("DROP INDEX IF EXISTS idx_station_delays_train;")
        cur.execute("DROP INDEX IF EXISTS idx_station_delays_stcode;")


def create_indexes(db_path: Optional[Path] = None) -> None:
    """Builds performance indexes after bulk insertion completes."""
    logger.info("Building performance indexes on journeys and station_delays...")
    with get_db_cursor(db_path) as cur:
        cur.execute("CREATE INDEX IF NOT EXISTS idx_journeys_train_date ON journeys (train_number, date);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_journeys_date ON journeys (date);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_journeys_ontime ON journeys (on_time);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_station_delays_journey ON station_delays (journey_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_station_delays_train ON station_delays (train_number, date);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_station_delays_stcode ON station_delays (station_code);")
    logger.info("Performance indexes created successfully.")


def upsert_trains(trains_data: List[Dict[str, Any]], db_path: Optional[Path] = None) -> int:
    """
    Inserts or updates train records. Idempotent.
    """
    if not trains_data:
        return 0

    query = """
    INSERT INTO trains (
        train_number, train_name, train_type, zone, source_station,
        source_station_name, destination_station, destination_station_name,
        total_distance_km, total_halts, scheduled_departure, scheduled_arrival,
        updated_at
    ) VALUES (
        :train_number, :train_name, :train_type, :zone, :source_station,
        :source_station_name, :destination_station, :destination_station_name,
        :total_distance_km, :total_halts, :scheduled_departure, :scheduled_arrival,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT(train_number) DO UPDATE SET
        train_name = excluded.train_name,
        train_type = excluded.train_type,
        zone = excluded.zone,
        source_station = excluded.source_station,
        source_station_name = excluded.source_station_name,
        destination_station = excluded.destination_station,
        destination_station_name = excluded.destination_station_name,
        total_distance_km = excluded.total_distance_km,
        total_halts = excluded.total_halts,
        scheduled_departure = excluded.scheduled_departure,
        scheduled_arrival = excluded.scheduled_arrival,
        updated_at = CURRENT_TIMESTAMP;
    """
    with get_db_cursor(db_path) as cur:
        cur.executemany(query, trains_data)
    return len(trains_data)


def upsert_journeys(journeys_data: List[Dict[str, Any]], db_path: Optional[Path] = None) -> int:
    """
    Inserts or updates journey records. Idempotent.
    """
    if not journeys_data:
        return 0

    query = """
    INSERT INTO journeys (
        journey_id, train_number, train_name, date, source_station,
        destination_station, current_station, scheduled_arrival, actual_arrival,
        scheduled_departure, actual_departure, arrival_delay_minutes,
        departure_delay_minutes, final_delay_minutes, on_time,
        cancellation_status, route_completion_status, stations_crossed_count,
        data_source
    ) VALUES (
        :journey_id, :train_number, :train_name, :date, :source_station,
        :destination_station, :current_station, :scheduled_arrival, :actual_arrival,
        :scheduled_departure, :actual_departure, :arrival_delay_minutes,
        :departure_delay_minutes, :final_delay_minutes, :on_time,
        :cancellation_status, :route_completion_status, :stations_crossed_count,
        :data_source
    )
    ON CONFLICT(journey_id) DO UPDATE SET
        train_name = excluded.train_name,
        current_station = excluded.current_station,
        scheduled_arrival = excluded.scheduled_arrival,
        actual_arrival = excluded.actual_arrival,
        scheduled_departure = excluded.scheduled_departure,
        actual_departure = excluded.actual_departure,
        arrival_delay_minutes = excluded.arrival_delay_minutes,
        departure_delay_minutes = excluded.departure_delay_minutes,
        final_delay_minutes = excluded.final_delay_minutes,
        on_time = excluded.on_time,
        cancellation_status = excluded.cancellation_status,
        route_completion_status = excluded.route_completion_status,
        stations_crossed_count = excluded.stations_crossed_count,
        data_source = excluded.data_source;
    """
    with get_db_cursor(db_path) as cur:
        cur.executemany(query, journeys_data)
    return len(journeys_data)


def insert_station_delays(delays_data: List[Dict[str, Any]], db_path: Optional[Path] = None) -> int:
    """
    Inserts intermediate station halt records in batches.
    """
    if not delays_data:
        return 0

    query = """
    INSERT INTO station_delays (
        journey_id, train_number, date, station_sequence, station_code,
        station_name, distance_km, scheduled_arrival, actual_arrival,
        scheduled_departure, actual_departure, arrival_delay_minutes,
        departure_delay_minutes, status
    ) VALUES (
        :journey_id, :train_number, :date, :station_sequence, :station_code,
        :station_name, :distance_km, :scheduled_arrival, :actual_arrival,
        :scheduled_departure, :actual_departure, :arrival_delay_minutes,
        :departure_delay_minutes, :status
    );
    """
    with get_db_cursor(db_path) as cur:
        cur.executemany(query, delays_data)
    return len(delays_data)


def upsert_route_statistics(stats_data: List[Dict[str, Any]], db_path: Optional[Path] = None) -> int:
    """
    Inserts or updates route-level computed punctuality statistics.
    """
    if not stats_data:
        return 0

    query = """
    INSERT INTO route_statistics (
        train_number, source_station, destination_station, zone, total_journeys,
        route_historical_ontime_pct, average_delay, median_delay, delay_std,
        percentile_90_delay, average_delay_by_month, average_delay_by_weekday,
        average_delay_by_train, average_delay_by_zone, computed_at
    ) VALUES (
        :train_number, :source_station, :destination_station, :zone, :total_journeys,
        :route_historical_ontime_pct, :average_delay, :median_delay, :delay_std,
        :percentile_90_delay, :average_delay_by_month, :average_delay_by_weekday,
        :average_delay_by_train, :average_delay_by_zone, CURRENT_TIMESTAMP
    )
    ON CONFLICT(train_number) DO UPDATE SET
        source_station = excluded.source_station,
        destination_station = excluded.destination_station,
        zone = excluded.zone,
        total_journeys = excluded.total_journeys,
        route_historical_ontime_pct = excluded.route_historical_ontime_pct,
        average_delay = excluded.average_delay,
        median_delay = excluded.median_delay,
        delay_std = excluded.delay_std,
        percentile_90_delay = excluded.percentile_90_delay,
        average_delay_by_month = excluded.average_delay_by_month,
        average_delay_by_weekday = excluded.average_delay_by_weekday,
        average_delay_by_train = excluded.average_delay_by_train,
        average_delay_by_zone = excluded.average_delay_by_zone,
        computed_at = CURRENT_TIMESTAMP;
    """
    with get_db_cursor(db_path) as cur:
        cur.executemany(query, stats_data)
    return len(stats_data)

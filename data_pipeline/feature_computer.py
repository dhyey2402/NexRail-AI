"""
Derived Feature Engineering Engine for Production LightGBM Training.
Computes route-level, train-level, and zonal delay analytics from historical journey records.
"""
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import pandas as pd
import numpy as np

from data_pipeline.config import config
from data_pipeline.db import get_connection, upsert_route_statistics

logger = logging.getLogger(__name__)


class FeatureComputer:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or config.db_path

    def compute_all_features(self) -> int:
        """
        Computes all 9 required analytical derived features directly from SQLite journeys,
        and saves aggregated results into the route_statistics table.
        """
        logger.info("Computing derived punctuality features from historical journeys...")
        conn = get_connection(self.db_path)
        
        try:
            # Query joined journeys + trains
            query = """
            SELECT 
                j.journey_id,
                j.train_number,
                j.date,
                j.source_station,
                j.destination_station,
                j.final_delay_minutes,
                j.departure_delay_minutes,
                j.on_time,
                j.cancellation_status,
                t.zone,
                t.total_distance_km,
                t.total_halts,
                t.train_type
            FROM journeys j
            JOIN trains t ON j.train_number = t.train_number
            WHERE j.cancellation_status = 0 AND j.final_delay_minutes IS NOT NULL;
            """
            df = pd.read_sql_query(query, conn)
        finally:
            conn.close()

        if df.empty:
            logger.warning("No completed historical journey records found to compute features.")
            return 0

        logger.info(f"Loaded {len(df):,} valid historical journey records for analytics.")

        # Parse dates to month and weekday
        df["dt"] = pd.to_datetime(df["date"], errors="coerce")
        df["month"] = df["dt"].dt.month
        df["weekday"] = df["dt"].dt.weekday  # 0=Monday, 6=Sunday

        # Global Zonal Averages
        zonal_avg_delays = df.groupby("zone")["final_delay_minutes"].mean().to_dict()

        # Global Train Averages
        train_avg_delays = df.groupby("train_number")["final_delay_minutes"].mean().to_dict()

        route_stats_rows: List[Dict[str, Any]] = []

        # Group by train route
        for train_no, grp in df.groupby("train_number"):
            train_str = str(train_no)
            delays = grp["final_delay_minutes"].dropna().values
            n_journeys = len(delays)
            if n_journeys == 0:
                continue

            src = str(grp["source_station"].iloc[0])
            dst = str(grp["destination_station"].iloc[0])
            zone = str(grp["zone"].iloc[0])

            # 1. On-time punctuality percentage (<=15 min delay)
            ontime_pct = float(np.mean(delays <= config.ontime_threshold_minutes) * 100.0)

            # 2. Average delay
            avg_delay = float(np.mean(delays))

            # 3. Median delay
            med_delay = float(np.median(delays))

            # 4. Delay standard deviation
            std_delay = float(np.std(delays)) if n_journeys > 1 else 0.0

            # 5. 90th percentile delay
            p90_delay = float(np.percentile(delays, 90))

            # 6. Average delay by month
            month_grp = grp.groupby("month")["final_delay_minutes"].mean().to_dict()
            month_stats = {str(int(m)): round(float(val), 2) for m, val in month_grp.items()}

            # 7. Average delay by weekday (0=Monday, 6=Sunday)
            weekday_grp = grp.groupby("weekday")["final_delay_minutes"].mean().to_dict()
            weekday_stats = {str(int(w)): round(float(val), 2) for w, val in weekday_grp.items()}

            # 8. Average delay by train
            train_avg = float(train_avg_delays.get(train_no, avg_delay))

            # 9. Average delay by zone
            zone_avg = float(zonal_avg_delays.get(zone, avg_delay))

            route_stats_rows.append({
                "train_number": train_str,
                "source_station": src,
                "destination_station": dst,
                "zone": zone,
                "total_journeys": n_journeys,
                "route_historical_ontime_pct": round(ontime_pct, 2),
                "average_delay": round(avg_delay, 2),
                "median_delay": round(med_delay, 2),
                "delay_std": round(std_delay, 2),
                "percentile_90_delay": round(p90_delay, 2),
                "average_delay_by_month": json.dumps(month_stats),
                "average_delay_by_weekday": json.dumps(weekday_stats),
                "average_delay_by_train": round(train_avg, 2),
                "average_delay_by_zone": round(zone_avg, 2)
            })

        upsert_route_statistics(route_stats_rows, self.db_path)
        logger.info(f"Successfully computed and stored route statistics for {len(route_stats_rows)} routes.")
        return len(route_stats_rows)

    def generate_ml_training_matrix(self) -> pd.DataFrame:
        """
        Builds the complete ML feature matrix for LightGBM training.
        Merges journeys, trains, route_statistics, and derived operational indicators.
        """
        conn = get_connection(self.db_path)
        try:
            query = """
            SELECT 
                j.train_number,
                j.train_name,
                j.date,
                j.source_station,
                j.destination_station,
                j.current_station,
                j.scheduled_arrival,
                j.actual_arrival,
                j.scheduled_departure,
                j.actual_departure,
                j.departure_delay_minutes,
                j.arrival_delay_minutes,
                j.final_delay_minutes,
                j.on_time,
                j.cancellation_status,
                j.route_completion_status,
                j.stations_crossed_count,
                t.zone,
                t.train_type,
                t.total_distance_km,
                t.total_halts,
                rs.route_historical_ontime_pct,
                rs.average_delay AS route_avg_delay,
                rs.median_delay AS route_median_delay,
                rs.delay_std AS route_delay_std,
                rs.percentile_90_delay AS route_p90_delay,
                rs.average_delay_by_train,
                rs.average_delay_by_zone
            FROM journeys j
            JOIN trains t ON j.train_number = t.train_number
            LEFT JOIN route_statistics rs ON j.train_number = rs.train_number
            WHERE j.cancellation_status = 0 AND j.final_delay_minutes IS NOT NULL;
            """
            df = pd.read_sql_query(query, conn)
        finally:
            conn.close()

        if df.empty:
            return df

        # Temporal engineering
        df["dt"] = pd.to_datetime(df["date"], errors="coerce")
        df["month"] = df["dt"].dt.month
        df["day_of_week"] = df["dt"].dt.weekday
        df["day"] = df["dt"].dt.day
        df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x in [5, 6] else 0)

        # Operational features
        df["scheduled_dep_hour"] = pd.to_datetime(df["scheduled_departure"], errors="coerce").dt.hour.fillna(12).astype(int)
        df["distance_km"] = df["total_distance_km"].fillna(500.0)
        df["total_stops"] = df["total_halts"].fillna(10).astype(int)
        df["current_delay"] = df["departure_delay_minutes"].fillna(0.0)
        df["late_incoming_rake"] = df["current_delay"].apply(lambda d: 1 if d > 20 else 0)

        # Stops density
        df["stops_per_100km"] = (df["total_stops"] / (df["distance_km"] + 1e-5)) * 100.0

        # High-Density Network indicator
        hdn_zones = {"NR", "NCR", "WR", "CR", "ER", "ECR"}
        df["is_hdn_zone"] = df["zone"].apply(lambda z: 1 if str(z) in hdn_zones else 0)

        # Season
        def get_season(m: int) -> str:
            if m in [12, 1, 2]:
                return "Winter"
            elif m in [3, 4, 5]:
                return "Summer"
            elif m in [6, 7, 8, 9]:
                return "Monsoon"
            return "Post-Monsoon"

        df["season"] = df["month"].apply(get_season)

        return df

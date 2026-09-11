"""
Historical Data Ingestion & Streaming Engine.
Parses large-scale Indian Railways delay archives and schedules into relational SQLite records.
"""
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple
from datetime import datetime, timedelta
import pandas as pd
from tqdm import tqdm

from data_pipeline.config import config
from data_pipeline.db import upsert_trains, upsert_journeys, insert_station_delays
from data_pipeline.checkpoint import CheckpointManager

logger = logging.getLogger(__name__)


def normalize_train_no(val: Any) -> str:
    """Normalizes train numbers by stripping whitespace and leading zeros."""
    s = str(val).strip().lstrip("0")
    return s if s else "0"


def compute_iso_datetime(date_str: str, time_str: Optional[str], day_offset: int = 1, delay_min: float = 0.0) -> Optional[str]:
    """
    Computes an ISO 8601 datetime string from date, HH:MM schedule time, day offset, and delay.
    Optimized for high-throughput string parsing without slow strptime.
    """
    if not time_str or pd.isna(time_str):
        return None
    s_time = str(time_str).strip()
    if not s_time or s_time == "nan" or ":" not in s_time:
        return None
    try:
        s_date = str(date_str).strip()
        y, m, d = int(s_date[:4]), int(s_date[5:7]), int(s_date[8:10])
        parts = s_time.split(":")
        h, minute = int(parts[0]), int(parts[1])
        offset_days = max(0, int(day_offset) - 1) if pd.notna(day_offset) else 0
        sched_dt = datetime(y, m, d, h, minute)
        if offset_days > 0 or delay_min != 0.0:
            sched_dt += timedelta(days=offset_days, minutes=float(delay_min or 0.0))
        return sched_dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return None


class RailwayDataIngestor:
    def __init__(self, data_dir: Optional[Path] = None, db_path: Optional[Path] = None):
        self.data_dir = data_dir or config.raw_data_dir
        self.db_path = db_path or config.db_path
        self.checkpoint_mgr = CheckpointManager(self.db_path)

        # Lookup caches
        self.train_details: Dict[str, Dict[str, str]] = {}
        self.station_names: Dict[str, Dict[str, str]] = {}
        self.train_schedules: Dict[str, List[Dict[str, Any]]] = {}
        self.train_route_meta: Dict[str, Dict[str, Any]] = {}

    def load_metadata(self, limit_trains: Optional[int] = None) -> Set[str]:
        """
        Loads train details, station zones, and schedules from CSVs.
        Populates the master trains table in SQLite.
        """
        logger.info("Loading train schedules and metadata...")
        
        # 1. Load train details
        td_path = self.data_dir / "train_details.csv"
        df_td = pd.read_csv(td_path)
        for _, r in df_td.iterrows():
            t_num = normalize_train_no(r["train_no"])
            self.train_details[t_num] = {
                "name": str(r["train_name"]).strip(),
                "type": str(r["type_code"]).strip()
            }

        # 2. Load station metadata
        st_path = self.data_dir / "station_full_names.csv"
        df_st = pd.read_csv(st_path)
        for _, r in df_st.iterrows():
            code = str(r["station_name"]).strip()
            self.station_names[code] = {
                "full_name": str(r["station_full_name"]).strip(),
                "zone": str(r["station_zone"]).strip() if pd.notna(r.get("station_zone")) else "NR"
            }

        # 3. Load schedules
        sched_path = self.data_dir / "combined_schedule.csv"
        df_sched = pd.read_csv(sched_path)
        df_sched["norm_train_no"] = df_sched["train_no"].apply(normalize_train_no)
        
        # Select target trains
        unique_trains = list(df_sched["norm_train_no"].unique())
        if limit_trains:
            unique_trains = unique_trains[:limit_trains]

        target_trains_set = set(unique_trains)
        df_sched_filtered = df_sched[df_sched["norm_train_no"].isin(target_trains_set)]

        logger.info(f"Processing route schedules for {len(target_trains_set)} trains...")
        grouped = df_sched_filtered.groupby("norm_train_no")

        trains_to_db: List[Dict[str, Any]] = []

        for train_raw, group in grouped:
            train_no = str(train_raw).strip()
            sorted_stops = group.sort_values("station_no").to_dict("records")
            self.train_schedules[train_no] = sorted_stops

            origin_stop = sorted_stops[0]
            dest_stop = sorted_stops[-1]

            origin_code = str(origin_stop["station_name"]).strip()
            dest_code = str(dest_stop["station_name"]).strip()

            origin_meta = self.station_names.get(origin_code, {})
            dest_meta = self.station_names.get(dest_code, {})

            td_meta = self.train_details.get(train_no, {})
            train_name = td_meta.get("name", f"Train {train_no}")
            train_type = td_meta.get("type", "EXP-TRAINS")

            zone = origin_meta.get("zone") or dest_meta.get("zone") or "NR"
            tot_dist = float(dest_stop.get("distance_from_origin", 0.0) or 0.0)

            sched_dep = str(origin_stop.get("departure_time", "00:00")).strip()
            sched_arr = str(dest_stop.get("arrival_time", "00:00")).strip()

            meta_entry = {
                "train_number": train_no,
                "train_name": train_name,
                "train_type": train_type,
                "zone": zone,
                "source_station": origin_code,
                "source_station_name": origin_meta.get("full_name", origin_code),
                "destination_station": dest_code,
                "destination_station_name": dest_meta.get("full_name", dest_code),
                "total_distance_km": tot_dist,
                "total_halts": max(0, len(sorted_stops) - 2),
                "scheduled_departure": sched_dep,
                "scheduled_arrival": sched_arr
            }
            self.train_route_meta[train_no] = meta_entry
            trains_to_db.append(meta_entry)

        upsert_trains(trains_to_db, self.db_path)
        logger.info(f"Successfully saved {len(trains_to_db)} master train routes into SQLite.")
        return target_trains_set

    def stream_and_ingest_historical_delays(
        self,
        target_trains: Set[str],
        max_rows_scan: Optional[int] = None,
        progress_callback: Optional[Any] = None
    ) -> int:
        """
        Streams through combined_delay.csv, constructs complete historical journeys,
        computes arrival/departure delays, and batch-inserts into SQLite.
        """
        delay_path = self.data_dir / "combined_delay.csv"
        if not delay_path.exists():
            logger.error(f"Delay file not found: {delay_path}")
            return 0

        # Drop secondary indexes for maximum bulk insertion throughput
        from data_pipeline.db import drop_indexes, create_indexes
        drop_indexes(self.db_path)

        logger.info("Streaming and ingesting historical delay records...")
        
        journey_buffer: Dict[str, Dict[str, Any]] = {}
        total_rows_read = 0
        total_journeys_saved = 0
        total_halts_saved = 0

        is_all_trains = (len(target_trains) >= 8000)

        # Read CSV in 500k chunks
        chunk_iter = pd.read_csv(
            delay_path,
            chunksize=500_000,
            dtype={"train_no": str, "station_no": int, "station_name": str, "delay": float}
        )

        for chunk in chunk_iter:
            total_rows_read += len(chunk)
            
            chunk["norm_train_no"] = chunk["train_no"].apply(normalize_train_no)
            if not is_all_trains:
                chunk = chunk[chunk["norm_train_no"].isin(target_trains)]

            if not chunk.empty:
                train_col = chunk["norm_train_no"].values
                date_col = chunk["date"].values
                stno_col = chunk["station_no"].values
                stname_col = chunk["station_name"].values
                delay_col = chunk["delay"].values

                for train_no, date_val, st_no, st_code, delay in zip(train_col, date_col, stno_col, stname_col, delay_col):
                    date_str = str(date_val).strip()
                    st_code_str = str(st_code).strip()
                    journey_key = f"{train_no}_{date_str}"

                    if journey_key not in journey_buffer:
                        route_meta = self.train_route_meta.get(train_no, {})
                        journey_buffer[journey_key] = {
                            "train_number": train_no,
                            "train_name": route_meta.get("train_name", f"Train {train_no}"),
                            "date": date_str,
                            "source_station": route_meta.get("source_station", ""),
                            "destination_station": route_meta.get("destination_station", ""),
                            "delays_by_seq": {},
                            "stations_crossed": set()
                        }

                    journey_buffer[journey_key]["delays_by_seq"][int(st_no)] = {
                        "station_code": st_code_str,
                        "delay": delay
                    }
                    if pd.notna(delay):
                        journey_buffer[journey_key]["stations_crossed"].add(st_code_str)

            # Periodically flush when buffer reaches 15,000 journeys
            if len(journey_buffer) >= 15_000:
                saved_j, saved_h = self._flush_journey_buffer(journey_buffer)
                total_journeys_saved += saved_j
                total_halts_saved += saved_h
                journey_buffer.clear()
                logger.info(f"Ingested {total_journeys_saved:,} journeys, {total_halts_saved:,} halts ({total_rows_read:,} raw rows scanned)...")

            if max_rows_scan and total_rows_read >= max_rows_scan:
                logger.info(f"Reached scan limit of {max_rows_scan:,} rows.")
                break

        # Final flush
        if journey_buffer:
            saved_j, saved_h = self._flush_journey_buffer(journey_buffer)
            total_journeys_saved += saved_j
            total_halts_saved += saved_h
            journey_buffer.clear()

        logger.info(f"Bulk ingestion complete: {total_journeys_saved:,} total journeys, {total_halts_saved:,} station halts.")
        
        # Re-build indexes on completed dataset
        create_indexes(self.db_path)
        return total_journeys_saved

    def _flush_journey_buffer(
        self,
        journey_buffer: Dict[str, Dict[str, Any]]
    ) -> Tuple[int, int]:
        """
        Converts buffered delay dictionaries into relational journey and station delay rows.
        """
        journeys_out: List[Dict[str, Any]] = []
        station_delays_out: List[Dict[str, Any]] = []
        for j_key, j_data in journey_buffer.items():
            train_no = j_data["train_number"]
            date_str = j_data["date"]
            delays = j_data["delays_by_seq"]
            route_meta = self.train_route_meta.get(train_no, {})
            sched_stops = self.train_schedules.get(train_no, [])

            if not sched_stops:
                continue

            origin_stop = sched_stops[0]
            dest_stop = sched_stops[-1]
            tot_stops = len(sched_stops)

            # Determine origin departure delay
            origin_delay_info = delays.get(1, {})
            dep_delay = origin_delay_info.get("delay")
            if pd.isna(dep_delay):
                dep_delay = 0.0

            # Determine destination arrival delay
            dest_delay_info = delays.get(tot_stops, {})
            arr_delay = dest_delay_info.get("delay")

            # Route completion and cancellation checks
            recorded_stops = [s_no for s_no, d in delays.items() if pd.notna(d.get("delay"))]
            is_cancelled = 1 if len(recorded_stops) == 0 else 0
            is_completed = 1 if (tot_stops in delays and pd.notna(delays[tot_stops].get("delay"))) else 0

            # If dest delay is missing, use the last recorded station delay
            if pd.isna(arr_delay):
                if recorded_stops:
                    last_st = max(recorded_stops)
                    final_delay = float(delays[last_st].get("delay", 0.0))
                    curr_station = delays[last_st].get("station_code", dest_stop.get("station_name"))
                else:
                    final_delay = 0.0
                    curr_station = origin_stop.get("station_name")
            else:
                final_delay = float(arr_delay)
                curr_station = dest_stop.get("station_name")

            on_time = 1 if (final_delay <= config.ontime_threshold_minutes and is_cancelled == 0) else 0

            # Compute timestamps
            sched_dep_dt = compute_iso_datetime(date_str, origin_stop.get("departure_time"), 1, 0.0)
            actual_dep_dt = compute_iso_datetime(date_str, origin_stop.get("departure_time"), 1, dep_delay)

            dest_day = dest_stop.get("arrival_day", 1)
            sched_arr_dt = compute_iso_datetime(date_str, dest_stop.get("arrival_time"), dest_day, 0.0)
            actual_arr_dt = compute_iso_datetime(date_str, dest_stop.get("arrival_time"), dest_day, final_delay)

            journey_record = {
                "journey_id": j_key,
                "train_number": train_no,
                "train_name": j_data["train_name"],
                "date": date_str,
                "source_station": route_meta.get("source_station", origin_stop.get("station_name")),
                "destination_station": route_meta.get("destination_station", dest_stop.get("station_name")),
                "current_station": curr_station,
                "scheduled_arrival": sched_arr_dt or f"{date_str} {route_meta.get('scheduled_arrival', '00:00')}:00",
                "actual_arrival": actual_arr_dt or sched_arr_dt or f"{date_str} {route_meta.get('scheduled_arrival', '00:00')}:00",
                "scheduled_departure": sched_dep_dt or f"{date_str} {route_meta.get('scheduled_departure', '00:00')}:00",
                "actual_departure": actual_dep_dt or sched_dep_dt or f"{date_str} {route_meta.get('scheduled_departure', '00:00')}:00",
                "arrival_delay_minutes": round(final_delay, 1),
                "departure_delay_minutes": round(float(dep_delay), 1),
                "final_delay_minutes": round(final_delay, 1),
                "on_time": on_time,
                "cancellation_status": is_cancelled,
                "route_completion_status": is_completed,
                "stations_crossed_count": len(j_data["stations_crossed"]),
                "data_source": "CRIS_Archive_Scraped"
            }
            journeys_out.append(journey_record)

            # Generate station delay records
            for stop in sched_stops:
                seq = int(stop["station_no"])
                st_code = str(stop["station_name"]).strip()
                st_delay_info = delays.get(seq, {})
                s_delay = st_delay_info.get("delay")
                st_meta = self.station_names.get(st_code, {})

                station_delays_out.append({
                    "journey_id": j_key,
                    "train_number": train_no,
                    "date": date_str,
                    "station_sequence": seq,
                    "station_code": st_code,
                    "station_name": st_meta.get("full_name", st_code),
                    "distance_km": float(stop.get("distance_from_origin", 0.0) or 0.0),
                    "scheduled_arrival": str(stop.get("arrival_time", "")),
                    "actual_arrival": compute_iso_datetime(date_str, stop.get("arrival_time"), stop.get("arrival_day", 1), s_delay or 0.0),
                    "scheduled_departure": str(stop.get("departure_time", "")),
                    "actual_departure": compute_iso_datetime(date_str, stop.get("departure_time"), stop.get("departure_day", 1), s_delay or 0.0),
                    "arrival_delay_minutes": round(float(s_delay), 1) if pd.notna(s_delay) else None,
                    "departure_delay_minutes": round(float(s_delay), 1) if pd.notna(s_delay) else None,
                    "status": "arrived" if pd.notna(s_delay) else "untracked"
                })

        upsert_journeys(journeys_out, self.db_path)
        insert_station_delays(station_delays_out, self.db_path)
        return len(journeys_out), len(station_delays_out)

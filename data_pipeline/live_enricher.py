"""
RailRadar Live & Recent Operational Telemetry Enricher.
Fetches date-specific verified live telemetry from RailRadar REST API.
Enforces strict validation to discard static timetable templates where lastUpdatedAt is null.
"""
import logging
import time
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from data_pipeline.config import config
from data_pipeline.db import upsert_journeys, insert_station_delays

logger = logging.getLogger(__name__)


class RailRadarEnricher:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or config.railradar_api_key
        self.base_url = base_url or config.railradar_base_url
        self.headers = {"x-api-key": self.api_key}

    def fetch_historical_journey(self, train_number: str, date_str: str) -> Optional[Dict[str, Any]]:
        """
        Queries RailRadar /v1/trains/{train_number}/live?date={date_str}.
        Validates that the response contains authentic telemetry with lastUpdatedAt != None.
        """
        url = f"{self.base_url}/v1/trains/{train_number}/live"
        for attempt in range(config.max_retries):
            try:
                resp = requests.get(
                    url,
                    params={"date": date_str},
                    headers=self.headers,
                    timeout=config.request_timeout
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    # STRICT AUTHENTICITY VALIDATION:
                    # If lastUpdatedAt is None, RailRadar returns a static timetable with zero delays.
                    last_updated = data.get("lastUpdatedAt")
                    if not last_updated:
                        logger.debug(f"RailRadar has no live telemetry for train {train_number} on {date_str} (template response rejected).")
                        return None
                    return data
                elif resp.status_code in [404, 400]:
                    logger.debug(f"Train {train_number} not found or invalid on {date_str} (status {resp.status_code})")
                    return None
                elif resp.status_code == 429:
                    wait_time = config.retry_backoff_factor ** (attempt + 1)
                    logger.warning(f"Rate limited by RailRadar API. Backing off for {wait_time:.1f}s...")
                    time.sleep(wait_time)
                else:
                    logger.warning(f"RailRadar returned status {resp.status_code} for {train_number} on {date_str}")
                    time.sleep(1.0)
            except Exception as e:
                logger.warning(f"Network error querying RailRadar for {train_number} on {date_str}: {e}")
                time.sleep(1.0)

        return None

    def enrich_recent_trains(self, train_numbers: List[str], days_back: int = 3) -> int:
        """
        Fetches verified recent telemetry for specified trains across the past N days.
        """
        logger.info(f"Enriching recent journeys via RailRadar for {len(train_numbers)} trains...")
        today = datetime.now()
        dates_to_check = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, days_back + 1)]

        enriched_journeys: List[Dict[str, Any]] = []
        enriched_delays: List[Dict[str, Any]] = []

        for train_no in train_numbers:
            for date_str in dates_to_check:
                raw = self.fetch_historical_journey(train_no, date_str)
                if not raw:
                    continue

                route = raw.get("route", [])
                if not route:
                    continue

                origin = route[0]
                dest = route[-1]
                final_delay = float(dest.get("delayArrival", raw.get("delayMinutes", 0)))
                dep_delay = float(origin.get("delayDeparture", 0))

                journey_id = f"{train_no}_{date_str}"
                train_meta = raw.get("train", {})
                train_name = raw.get("trainName") or train_meta.get("name", f"Train {train_no}")

                on_time = 1 if (final_delay <= config.ontime_threshold_minutes and raw.get("status") != "cancelled") else 0
                is_cancelled = 1 if raw.get("status") == "cancelled" else 0
                is_completed = 1 if raw.get("status") == "completed" else 0

                journey_record = {
                    "journey_id": journey_id,
                    "train_number": train_no,
                    "train_name": train_name,
                    "date": date_str,
                    "source_station": origin.get("stationCode", ""),
                    "destination_station": dest.get("stationCode", ""),
                    "current_station": dest.get("stationCode", ""),
                    "scheduled_arrival": dest.get("scheduledArrival", ""),
                    "actual_arrival": dest.get("actualArrival", dest.get("scheduledArrival", "")),
                    "scheduled_departure": origin.get("scheduledDeparture", ""),
                    "actual_departure": origin.get("actualDeparture", origin.get("scheduledDeparture", "")),
                    "arrival_delay_minutes": round(final_delay, 1),
                    "departure_delay_minutes": round(dep_delay, 1),
                    "final_delay_minutes": round(final_delay, 1),
                    "on_time": on_time,
                    "cancellation_status": is_cancelled,
                    "route_completion_status": is_completed,
                    "stations_crossed_count": len([s for s in route if s.get("status") == "departed" or s.get("status") == "passed"]),
                    "data_source": "RailRadar_Live_API"
                }
                enriched_journeys.append(journey_record)

                for stop in route:
                    seq = stop.get("sequence", 1)
                    s_code = stop.get("stationCode", "")
                    s_name = stop.get("stationName", s_code)
                    enriched_delays.append({
                        "journey_id": journey_id,
                        "train_number": train_no,
                        "date": date_str,
                        "station_sequence": seq,
                        "station_code": s_code,
                        "station_name": s_name,
                        "distance_km": float(stop.get("distance", 0.0)),
                        "scheduled_arrival": stop.get("scheduledArrival"),
                        "actual_arrival": stop.get("actualArrival"),
                        "scheduled_departure": stop.get("scheduledDeparture"),
                        "actual_departure": stop.get("actualDeparture"),
                        "arrival_delay_minutes": float(stop.get("delayArrival", 0.0)) if stop.get("delayArrival") is not None else None,
                        "departure_delay_minutes": float(stop.get("delayDeparture", 0.0)) if stop.get("delayDeparture") is not None else None,
                        "status": stop.get("status", "unknown")
                    })

                # Polite API rate limit delay
                time.sleep(0.3)

        if enriched_journeys:
            upsert_journeys(enriched_journeys)
            insert_station_delays(enriched_delays)

        logger.info(f"Enriched {len(enriched_journeys)} verified recent journeys from RailRadar API.")
        return len(enriched_journeys)

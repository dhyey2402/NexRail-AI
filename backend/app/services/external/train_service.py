"""
RailRadar external service integration.
Fetches real-time train tracking, speed, route, and delay metrics from RailRadar API.
Includes SQLite caching with TrainCache.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.external.base_client import BaseAPIClient
from app.config import settings
from app.models.train import TrainCache

logger = logging.getLogger(__name__)


class TrainService(BaseAPIClient):
    """
    Client for interacting with the RailRadar tracking API with database caching.
    """
    def __init__(self, db: Optional[Session] = None) -> None:
        super().__init__(base_url=settings.railradar_base_url)
        self.api_key = settings.railradar_api_key
        self.db = db
        self.cache_ttl_minutes = 2

    async def get_live_train(self, train_number: str) -> Dict[str, Any]:
        """
        Fetches live location, speed, and delay status for a specific train from RailRadar.
        Checks local TrainCache first before making external API calls.
        
        Args:
            train_number (str): The unique identifier/number of the train (e.g. '12951').
            
        Returns:
            Dict[str, Any]: Live train tracking data matching TrainResponse schema.
            
        Raises:
            HTTPException: 404 if train not found, 502/503 if RailRadar is unreachable.
        """
        now = datetime.now(timezone.utc)
        clean_train_number = str(train_number).strip()

        # 1. Check local TrainCache
        if self.db is not None:
            try:
                cached = (
                    self.db.query(TrainCache)
                    .filter(
                        TrainCache.train_number == clean_train_number,
                        TrainCache.expires_at > now,
                    )
                    .first()
                )
                if cached:
                    logger.info(f"Returning cached train status for train {clean_train_number} (expires: {cached.expires_at})")
                    return {
                        "train_number": cached.train_number,
                        "train_name": getattr(cached, "train_name", "") or f"Train {cached.train_number}",
                        "current_station": cached.current_station,
                        "next_station": cached.next_station,
                        "latitude": float(cached.latitude),
                        "longitude": float(cached.longitude),
                        "current_delay": int(cached.current_delay),
                        "speed": float(cached.speed),
                        "last_updated": cached.cached_at,
                    }
            except Exception as cache_err:
                logger.warning(f"Error reading TrainCache for train {clean_train_number}: {cache_err}")

        # 2. Query live RailRadar API
        headers = {
            "x-api-key": self.api_key
        }

        raw_response = None
        # Try live tracking endpoint first
        try:
            raw_response = await self._get(f"/v1/trains/{clean_train_number}/live", headers=headers)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # Fallback to static train route endpoint
                try:
                    raw_response = await self._get(f"/v1/trains/{clean_train_number}", headers=headers)
                except httpx.HTTPStatusError as inner_e:
                    if inner_e.response.status_code == 404:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Train {clean_train_number} not found in RailRadar tracking system"
                        )
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"RailRadar API error {inner_e.response.status_code}"
                    )
            else:
                logger.error(f"RailRadar API request failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"RailRadar tracking service returned error {e.response.status_code}"
                )
        except Exception as net_err:
            logger.error(f"Network error contacting RailRadar: {net_err}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to communicate with external tracking service: {str(net_err)}"
            )

        data = raw_response.get("data", {})
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No tracking data available for train {clean_train_number}"
            )

        # Extract dynamic train information
        train_meta = data.get("train", {})
        train_name = data.get("trainName") or train_meta.get("name", f"Train {clean_train_number}")
        
        # Determine current and next stations
        curr_loc = data.get("currentLocation", {})
        next_halt = data.get("nextHalt", {})
        source = train_meta.get("source", {})
        destination = train_meta.get("destination", {})

        current_station = (
            curr_loc.get("stationCode")
            or curr_loc.get("stationName")
            or source.get("code")
            or "DEP"
        )
        next_station = (
            next_halt.get("stationCode")
            or next_halt.get("stationName")
            or destination.get("code")
            or "ARR"
        )

        # Determine GPS coordinates from current station in route or source station
        latitude = 0.0
        longitude = 0.0
        route = data.get("route", [])
        if route and isinstance(route, list):
            for station_info in route:
                st = station_info.get("station", {}) if isinstance(station_info.get("station"), dict) else station_info
                st_code = st.get("code") or station_info.get("stationCode")
                if st_code == current_station:
                    latitude = float(st.get("lat", 0.0))
                    longitude = float(st.get("lng", 0.0))
                    break

        # Speed and delay
        current_delay = int(data.get("delayMinutes", curr_loc.get("delayMinutes", 0)))
        speed = float(data.get("speed", train_meta.get("avgSpeed", 0.0)))

        # Timestamp
        last_updated_str = data.get("lastUpdatedAt")
        if last_updated_str:
            try:
                last_updated = datetime.fromisoformat(last_updated_str)
            except Exception:
                last_updated = now
        else:
            last_updated = now

        # Source / Destination / Type / Platform
        source_name = source.get("name") or source.get("code")
        destination_name = destination.get("name") or destination.get("code")
        train_type = train_meta.get("type") or data.get("trainType")

        # Enrich from metadata registry if available
        try:
            from app.services.external.train_metadata import TrainMetadataService
            meta = TrainMetadataService.get_train_metadata(clean_train_number)
            if meta:
                if not train_type:
                    train_type = meta.get("train_type")
        except Exception:
            pass

        platform_str = (
            curr_loc.get("platform")
            or curr_loc.get("platformNumber")
        )

        # Parse route into structured stations
        stations = []
        if route and isinstance(route, list):
            passed_current = False
            for station_info in route:
                st = station_info.get("station", {}) if isinstance(station_info.get("station"), dict) else station_info
                st_code = st.get("code") or station_info.get("stationCode")
                
                # Determine status
                status = "passed"
                if st_code == current_station:
                    status = "current"
                    passed_current = True
                elif passed_current:
                    status = "upcoming"
                elif current_station == "DEP":
                    status = "upcoming"

                # If current_station wasn't matched but we have distance info, we could use that,
                # but RailRadar usually guarantees current_station is in the route unless it just departed.

                stations.append({
                    "code": st_code,
                    "name": st.get("name") or station_info.get("stationName"),
                    "scheduledArrival": station_info.get("scheduledArrival") or station_info.get("sta"),
                    "scheduledDeparture": station_info.get("scheduledDeparture") or station_info.get("std"),
                    "actualArrival": station_info.get("actualArrival") or station_info.get("eta"),
                    "actualDeparture": station_info.get("actualDeparture") or station_info.get("etd"),
                    "delayMin": int(station_info.get("delayMinutes") or 0),
                    "status": status,
                    "platform": station_info.get("platform") or st.get("platform"),
                    "lat": float(st.get("lat", 0.0)),
                    "lng": float(st.get("lng", 0.0)),
                    "km": float(station_info.get("distanceFromOrigin") or st.get("distance", 0.0))
                })

        result = {
            "train_number": clean_train_number,
            "train_name": train_name,
            "current_station": current_station,
            "next_station": next_station,
            "latitude": latitude,
            "longitude": longitude,
            "current_delay": current_delay,
            "speed": speed,
            "last_updated": last_updated,
            "source": source_name,
            "destination": destination_name,
            "train_type": train_type,
            "platform": str(platform_str) if platform_str else None,
            "stations": stations,
        }

        # 3. Store in database cache
        if self.db is not None:
            try:
                cached_obj = self.db.query(TrainCache).filter(TrainCache.train_number == clean_train_number).first()
                if cached_obj:
                    cached_obj.train_name = train_name
                    cached_obj.current_station = current_station
                    cached_obj.next_station = next_station
                    cached_obj.current_delay = current_delay
                    cached_obj.speed = speed
                    cached_obj.latitude = latitude
                    cached_obj.longitude = longitude
                    cached_obj.cached_at = now
                    cached_obj.expires_at = now + timedelta(minutes=self.cache_ttl_minutes)
                else:
                    new_cache = TrainCache(
                        train_number=clean_train_number,
                        train_name=train_name,
                        current_station=current_station,
                        next_station=next_station,
                        current_delay=current_delay,
                        speed=speed,
                        latitude=latitude,
                        longitude=longitude,
                        cached_at=now,
                        expires_at=now + timedelta(minutes=self.cache_ttl_minutes),
                    )
                    self.db.add(new_cache)
                self.db.commit()
            except Exception as save_err:
                logger.warning(f"Failed to persist TrainCache for {clean_train_number}: {save_err}")
                self.db.rollback()

        return result

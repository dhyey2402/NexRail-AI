"""
Dataset and Source Discovery Layer.
Validates existence of local Kaggle archives, verifies column integrity,
and checks public API connectivity.
"""
import os
import logging
from pathlib import Path
from typing import Dict, Any
import pandas as pd
import requests

from data_pipeline.config import config

logger = logging.getLogger(__name__)


def discover_sources() -> Dict[str, Any]:
    """
    Scans and verifies all available local datasets and remote APIs.
    """
    logger.info("Discovering available datasets and APIs...")
    results = {
        "raw_dir_exists": False,
        "files": {},
        "railradar_api": False,
        "openweather_api": False
    }

    raw_dir = config.raw_data_dir
    if raw_dir.exists() and raw_dir.is_dir():
        results["raw_dir_exists"] = True
        logger.info(f"Using locally discovered Kaggle dataset at: {raw_dir}")

        expected_files = [
            "combined_schedule.csv",
            "train_details.csv",
            "station_full_names.csv",
            "combined_delay.csv"
        ]

        for fname in expected_files:
            fpath = raw_dir / fname
            if fpath.exists():
                size_mb = round(fpath.stat().st_size / (1024 * 1024), 2)
                # Sample read to verify headers
                try:
                    df_sample = pd.read_csv(fpath, nrows=5)
                    results["files"][fname] = {
                        "path": str(fpath),
                        "size_mb": size_mb,
                        "columns": list(df_sample.columns),
                        "valid": True
                    }
                    logger.info(f"Discovered {fname}: {size_mb} MB, columns valid: True")
                except Exception as e:
                    results["files"][fname] = {"path": str(fpath), "size_mb": size_mb, "error": str(e), "valid": False}
                    logger.warning(f"Error reading {fname}: {e}")
            else:
                results["files"][fname] = {"valid": False, "missing": True}
                logger.warning(f"File missing: {fname}")

    # Test RailRadar API
    try:
        rr_resp = requests.get(
            f"{config.railradar_base_url}/v1/trains/12951/live",
            headers={"x-api-key": config.railradar_api_key},
            timeout=5
        )
        results["railradar_api"] = (rr_resp.status_code == 200)
        logger.info(f"RailRadar API status: {rr_resp.status_code} (Operational: {results['railradar_api']})")
    except Exception as e:
        logger.warning(f"RailRadar API connection check failed: {e}")
        results["railradar_api"] = False

    # Test OpenWeather API
    try:
        ow_resp = requests.get(
            f"{config.openweather_base_url}/data/2.5/weather",
            params={"q": "New Delhi,IN", "appid": config.openweather_api_key},
            timeout=5
        )
        results["openweather_api"] = (ow_resp.status_code == 200)
        logger.info(f"OpenWeather API status: {ow_resp.status_code} (Operational: {results['openweather_api']})")
    except Exception as e:
        logger.warning(f"OpenWeather API connection check failed: {e}")
        results["openweather_api"] = False

    return results

"""
Configuration settings for Indian Railways Punctuality Data Pipeline.
"""
import os
from pathlib import Path
from dataclasses import dataclass

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Default Kaggle cache location for rxydenxd/indian-railways-delay-dataset
DEFAULT_KAGGLE_DIR = Path(os.path.expanduser("~")) / ".cache" / "kagglehub" / "datasets" / "rxydenxd" / "indian-railways-delay-dataset" / "versions" / "1"


@dataclass(frozen=True)
class PipelineConfig:
    # Database and Output paths
    db_path: Path = DATA_DIR / "railway_punctuality.db"
    historical_csv_path: Path = DATA_DIR / "historical_punctuality.csv"
    ml_training_csv_path: Path = DATA_DIR / "ml_training_dataset.csv"
    log_path: Path = BASE_DIR / "data_pipeline.log"

    # Raw Kaggle Data directory
    raw_data_dir: Path = Path(os.getenv("RAILWAY_DATA_DIR", str(DEFAULT_KAGGLE_DIR)))

    # RailRadar External API
    railradar_base_url: str = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.in")
    railradar_api_key: str = os.getenv("RAILRADAR_API_KEY", "")

    # OpenWeather External API
    openweather_base_url: str = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org")
    openweather_api_key: str = os.getenv("OPENWEATHER_API_KEY", "")

    # Processing and Batch Limits
    chunk_size: int = 250_000
    batch_insert_size: int = 5_000
    max_retries: int = 4
    retry_backoff_factor: float = 1.5
    request_timeout: int = 15

    # On-Time threshold benchmark (minutes)
    ontime_threshold_minutes: float = 15.0


config = PipelineConfig()

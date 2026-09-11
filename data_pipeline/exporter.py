"""
Dataset Export and Validation Layer.
Generates production CSV deliverables (historical_punctuality.csv and ml_training_dataset.csv)
and validates schema completeness and distribution statistics.
"""
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

from data_pipeline.config import config
from data_pipeline.db import get_connection
from data_pipeline.feature_computer import FeatureComputer

logger = logging.getLogger(__name__)


class DatasetExporter:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or config.db_path

    def export_historical_punctuality_csv(self, output_path: Optional[Path] = None) -> int:
        """
        Exports the canonical 16-column historical punctuality dataset.
        Matches the exact user requirements.
        """
        out_file = output_path or config.historical_csv_path
        logger.info(f"Exporting historical punctuality dataset to {out_file}...")

        conn = get_connection(self.db_path)
        try:
            query = """
            SELECT 
                train_number,
                train_name,
                date,
                source_station,
                destination_station,
                current_station,
                scheduled_arrival,
                actual_arrival,
                scheduled_departure,
                actual_departure,
                arrival_delay_minutes,
                departure_delay_minutes,
                final_delay_minutes,
                on_time,
                cancellation_status,
                route_completion_status
            FROM journeys
            ORDER BY date DESC, train_number ASC;
            """
            df = pd.read_sql_query(query, conn)
        finally:
            conn.close()

        df.to_csv(out_file, index=False)
        logger.info(f"Successfully exported {len(df):,} rows to {out_file}")
        return len(df)

    def export_ml_training_dataset_csv(self, output_path: Optional[Path] = None) -> int:
        """
        Exports the comprehensive ML feature matrix for model training and evaluation.
        """
        out_file = output_path or config.ml_training_csv_path
        logger.info(f"Exporting ML training feature matrix to {out_file}...")

        fc = FeatureComputer(self.db_path)
        df_ml = fc.generate_ml_training_matrix()

        if df_ml.empty:
            logger.warning("ML training dataframe is empty. Skipping export.")
            return 0

        df_ml.to_csv(out_file, index=False)
        logger.info(f"Successfully exported {len(df_ml):,} ML training records to {out_file}")
        return len(df_ml)

    def validate_dataset(self) -> Dict[str, Any]:
        """
        Validates the exported historical_punctuality.csv and computes summary metrics.
        """
        if not config.historical_csv_path.exists():
            return {"valid": False, "error": "historical_punctuality.csv does not exist"}

        df = pd.read_csv(config.historical_csv_path)

        expected_cols = [
            "train_number", "train_name", "date", "source_station",
            "destination_station", "current_station", "scheduled_arrival",
            "actual_arrival", "scheduled_departure", "actual_departure",
            "arrival_delay_minutes", "departure_delay_minutes",
            "final_delay_minutes", "on_time", "cancellation_status",
            "route_completion_status"
        ]

        missing_cols = [c for c in expected_cols if c not in df.columns]
        
        delays = df["final_delay_minutes"].dropna()
        ontime_rate = round(float((df["on_time"] == 1).mean() * 100.0), 2) if "on_time" in df else 0.0

        summary = {
            "valid": len(missing_cols) == 0,
            "total_rows": len(df),
            "unique_trains": int(df["train_number"].nunique()) if "train_number" in df else 0,
            "date_range": [str(df["date"].min()), str(df["date"].max())] if "date" in df else [],
            "missing_columns": missing_cols,
            "null_counts": df.isnull().sum().to_dict(),
            "ontime_percentage": ontime_rate,
            "delay_statistics": {
                "mean": round(float(delays.mean()), 2) if not delays.empty else 0.0,
                "median": round(float(delays.median()), 2) if not delays.empty else 0.0,
                "std": round(float(delays.std()), 2) if not delays.empty else 0.0,
                "min": round(float(delays.min()), 2) if not delays.empty else 0.0,
                "max": round(float(delays.max()), 2) if not delays.empty else 0.0,
                "p90": round(float(delays.quantile(0.90)), 2) if not delays.empty else 0.0
            }
        }
        return summary

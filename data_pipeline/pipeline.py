"""
Unified Pipeline Orchestrator for Indian Railways Punctuality ETL & Feature Engineering.
Executes end-to-end ingestion, SQLite persistence, derived feature computation, and CSV export.
NOTE: Decoupled from ML training. Model training is handled separately by the ML team.
"""
import sys
import argparse
import logging
from pathlib import Path
import json

from data_pipeline.config import config
from data_pipeline.db import init_db
from data_pipeline.discovery import discover_sources
from data_pipeline.ingestor import RailwayDataIngestor
from data_pipeline.live_enricher import RailRadarEnricher
from data_pipeline.feature_computer import FeatureComputer
from data_pipeline.exporter import DatasetExporter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(config.log_path, mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("data_pipeline.pipeline")


def run_pipeline(
    limit_trains: int = 50,
    max_rows_scan: int = 500_000,
    resume: bool = True,
    skip_live_enrich: bool = False,
    export_only: bool = False
) -> None:
    """
    Executes the automated railway data pipeline.
    """
    logger.info("=" * 70)
    logger.info("STARTING RAILWAY PUNCTUALITY DATASET ETL & FEATURE PIPELINE")
    logger.info("=" * 70)

    exporter = DatasetExporter()

    if export_only:
        logger.info("Export-only mode requested. Computing features and generating CSVs...")
        fc = FeatureComputer()
        fc.compute_all_features()
        exporter.export_historical_punctuality_csv()
        exporter.export_ml_training_dataset_csv()
        validation = exporter.validate_dataset()
        logger.info(f"Validation Report:\n{json.dumps(validation, indent=2)}")
        logger.info("Export complete.")
        return

    # STAGE 1: Discover Sources
    logger.info("\n>>> STAGE 1: Discover Datasets & Validate Schemas")
    discovery_info = discover_sources()
    if not discovery_info["raw_dir_exists"]:
        logger.error(f"Kaggle raw dataset not found at: {config.raw_data_dir}")
        sys.exit(1)
    logger.info(f"Kaggle files verified at: {config.raw_data_dir}")

    # STAGE 2: Initialize SQLite Schema
    logger.info("\n>>> STAGE 2: Initialize SQLite Database Schema")
    init_db()

    # STAGE 3: Ingest Train Schedules & Historical Delay Records
    logger.info("\n>>> STAGE 3: Ingest Train Schedules & Historical Delay Records")
    ingestor = RailwayDataIngestor()
    target_trains = ingestor.load_metadata(limit_trains=limit_trains)
    logger.info(f"Cataloged {len(target_trains)} trains with verified schedules.")

    total_journeys = ingestor.stream_and_ingest_historical_delays(
        target_trains=target_trains,
        max_rows_scan=max_rows_scan
    )
    logger.info(f"Ingested {total_journeys:,} real historical journeys into SQLite.")

    # STAGE 4: Live Telemetry Enrichment (RailRadar)
    if not skip_live_enrich and discovery_info.get("railradar_api"):
        logger.info("\n>>> STAGE 4: Merge Telemetry from RailRadar Live API")
        enricher = RailRadarEnricher()
        # Enrich recent 10 trains to respect API rate limits
        sample_trains = list(target_trains)[:10]
        enriched = enricher.enrich_recent_trains(sample_trains, days_back=2)
        logger.info(f"Merged {enriched} verified recent journeys from RailRadar rolling retention.")
    else:
        logger.info("\n>>> STAGE 4: Skipped live RailRadar enrichment.")

    # STAGE 5: Compute Derived Features
    logger.info("\n>>> STAGE 5: Compute Derived Operational & Punctuality Features")
    fc = FeatureComputer()
    routes_computed = fc.compute_all_features()
    logger.info(f"Computed derived statistics across {routes_computed} routes.")

    # STAGE 6: Export Production Datasets
    logger.info("\n>>> STAGE 6: Export Production Datasets")
    exporter.export_historical_punctuality_csv()
    exporter.export_ml_training_dataset_csv()
    logger.info(f"Saved historical punctuality dataset to: {config.historical_csv_path}")
    logger.info(f"Saved ML training matrix to: {config.ml_training_csv_path}")

    # STAGE 7: Dataset Validation & Reporting
    logger.info("\n>>> STAGE 7: Dataset Validation & Summary Statistics")
    validation = exporter.validate_dataset()
    logger.info(f"Validation Report:\n{json.dumps(validation, indent=2)}")

    logger.info("\n" + "=" * 70)
    logger.info("PIPELINE EXECUTION COMPLETED SUCCESSFULLY!")
    logger.info(f"Total Processed Journeys : {validation.get('total_rows', 0):,}")
    logger.info(f"Unique Trains Analyzed   : {validation.get('unique_trains', 0):,}")
    logger.info(f"Network On-Time Rate     : {validation.get('ontime_percentage', 0.0)}%")
    logger.info(f"SQLite Database File     : {config.db_path}")
    logger.info(f"Production CSV Output    : {config.historical_csv_path}")
    logger.info(f"ML Feature Matrix CSV    : {config.ml_training_csv_path}")
    logger.info("Ready for ML team model training, tuning, and SHAP analysis.")
    logger.info("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Indian Railways Historical Punctuality ETL Pipeline")
    parser.add_argument("--limit-trains", type=int, default=50, help="Number of trains to catalog and ingest (default: 50)")
    parser.add_argument("--max-rows", type=int, default=500_000, help="Max raw delay records to scan from archive (default: 500,000)")
    parser.add_argument("--resume", action="store_true", default=True, help="Resume from last checkpoint")
    parser.add_argument("--skip-live-enrich", action="store_true", help="Skip live RailRadar enrichment")
    parser.add_argument("--export-only", action="store_true", help="Only compute features and re-export CSVs from DB")

    args = parser.parse_args()

    run_pipeline(
        limit_trains=args.limit_trains,
        max_rows_scan=args.max_rows,
        resume=args.resume,
        skip_live_enrich=args.skip_live_enrich,
        export_only=args.export_only
    )


if __name__ == "__main__":
    main()

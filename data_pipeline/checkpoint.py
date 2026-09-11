"""
Checkpoint Manager for Indian Railways Punctuality Data Pipeline.
Tracks processed entities and ingestion state in SQLite for seamless resumption.
"""
import logging
from typing import Optional, Set
from pathlib import Path
from data_pipeline.config import config
from data_pipeline.db import get_connection, get_db_cursor

logger = logging.getLogger(__name__)


class CheckpointManager:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or config.db_path

    def is_completed(self, entity_type: str, entity_id: str) -> bool:
        """
        Checks if a train or date batch has already been fully processed.
        """
        conn = get_connection(self.db_path)
        try:
            row = conn.execute(
                "SELECT status FROM scrape_checkpoints WHERE entity_type = ? AND entity_id = ?",
                (str(entity_type), str(entity_id))
            ).fetchone()
            return bool(row and row["status"] == "COMPLETED")
        finally:
            conn.close()

    def get_completed_entities(self, entity_type: str) -> Set[str]:
        """
        Retrieves all completed entity IDs for a given type.
        """
        conn = get_connection(self.db_path)
        try:
            rows = conn.execute(
                "SELECT entity_id FROM scrape_checkpoints WHERE entity_type = ? AND status = 'COMPLETED'",
                (str(entity_type),)
            ).fetchall()
            return {str(r["entity_id"]) for r in rows}
        finally:
            conn.close()

    def record_checkpoint(
        self,
        entity_type: str,
        entity_id: str,
        status: str = "COMPLETED",
        last_date: Optional[str] = None,
        records_count: int = 0
    ) -> None:
        """
        Updates or inserts an entity checkpoint state.
        """
        query = """
        INSERT INTO scrape_checkpoints (
            entity_type, entity_id, status, last_date, records_ingested, updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(entity_type, entity_id) DO UPDATE SET
            status = excluded.status,
            last_date = excluded.last_date,
            records_ingested = excluded.records_ingested,
            updated_at = CURRENT_TIMESTAMP;
        """
        with get_db_cursor(self.db_path) as cur:
            cur.execute(query, (str(entity_type), str(entity_id), str(status), last_date, records_count))

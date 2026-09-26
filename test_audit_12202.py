import asyncio
import os
import sys
from pathlib import Path

# Add backend and project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.app.services.ai.prediction_service import PredictionService

async def main():
    service = PredictionService()
    try:
        res = await service.predict({"train_number": "12202"})
        print("\n--- PREDICTION OUTPUT ---")
        print(res)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
from app.services.ai.prediction_service import PredictionService
from app.schemas.prediction import PredictionRequest

async def run_tests():
    ps = PredictionService()
    ps.load_model()
    
    scenarios = [
        {"name": "On-time", "req": {"train_number": "12951", "departure_date": "2026-09-26", "distance_km": 500, "scheduled_travel_hours": 8, "num_scheduled_stops": 5, "departure_hour": 10, "current_delay": 0}},
        {"name": "120-minute delay", "req": {"train_number": "12952", "departure_date": "2026-09-26", "distance_km": 1500, "scheduled_travel_hours": 24, "num_scheduled_stops": 20, "departure_hour": 18, "current_delay": 120}},
    ]
    
    for sc in scenarios:
        try:
            req = PredictionRequest(**sc["req"])
            res = await ps.predict(req)
            print(f"[{sc['name']}] Success. ETA: {res['predicted_eta']}, Valid: {res.get('is_valid_for_live_journey')}")
        except Exception as e:
            print(f"[{sc['name']}] Failed: {e}")

if __name__ == '__main__':
    asyncio.run(run_tests())

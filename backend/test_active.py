import traceback
from app.database.connection import SessionLocal
from app.models.train import TrainCache

def test():
    db=SessionLocal()
    trains = db.query(TrainCache).limit(50).all()
    result = []
    for t in trains:
        try:
            delay = t.current_delay or 0
            status = "on-time"
            if delay > 60: status = "severe-delay"
            elif delay > 15: status = "delayed"
            elif delay > 0: status = "slight-delay"
            
            result.append({
                "trainNumber": t.train_number,
                "trainName": t.train_name or f"Express {t.train_number}",
                "currentStation": t.current_station,
                "nextStation": t.next_station,
                "currentDelay": delay,
                "speed": t.speed or 0.0,
                "status": status,
            })
        except Exception as e:
            print("Error parsing train:", t.train_number, e)
            traceback.print_exc()

if __name__ == "__main__":
    test()
    print("Done")

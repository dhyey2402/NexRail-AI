from fastapi import APIRouter, Depends, Query
from typing import List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import SessionLocal
from app.models.train import TrainCache
from app.models.prediction import PredictionHistory
from app.dependencies.auth import require_role
from app.schemas.dashboard import (
    DashboardStats, AnalyticsData, PaginatedPredictionHistory, 
    PredictionHistoryItem
)

router = APIRouter(
    tags=["Dashboard"],
    dependencies=[Depends(require_role(["ADMIN"]))]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Calculate some basic stats from the database
    total_trains = db.query(TrainCache).count()
    active_preds = db.query(PredictionHistory).count()
    delayed_trains = db.query(TrainCache).filter(TrainCache.current_delay > 15).count()
    on_time_trains = total_trains - delayed_trains

    avg_delay = db.query(func.avg(TrainCache.current_delay)).scalar() or 0.0

    return DashboardStats(
        totalTrains=total_trains or 0,
        activePredictions=active_preds or 0,
        delayedTrains=delayed_trains or 0,
        onTimeTrains=on_time_trains or 0,
        avgAccuracy=None,
        avgDelay=round(avg_delay, 1) if avg_delay else 0.0,
        activeBlockSections=0,
        signalingHealthPercent=0.0,
        inferenceLatencyMs=0
    )

@router.get("/live-trains")
def get_live_trains(db: Session = Depends(get_db)):
    trains = db.query(TrainCache).limit(100).all()
    result = []
    for t in trains:
        status = "on-time"
        if t.current_delay > 60:
            status = "severe-delay"
        elif t.current_delay > 15:
            status = "delayed"
        elif t.current_delay > 0:
            status = "slight-delay"
            
        result.append({
            "trainNumber": t.train_number,
            "trainName": t.train_name or f"Express {t.train_number}",
            "source": None,
            "sourceCode": None,
            "destination": None,
            "destinationCode": None,
            "currentStation": t.current_station,
            "currentStationCode": t.current_station,
            "nextStation": t.next_station,
            "nextStationCode": t.next_station,
            "scheduledDeparture": None,
            "actualDeparture": None,
            "scheduledArrival": None,
            "currentDelay": t.current_delay,
            "speed": t.speed,
            "maxPermittedSpeed": None,
            "locoType": None,
            "rakeLength": None,
            "priorityTier": None,
            "signalAspect": None,
            "blockOccupancy": f"Block {t.current_station}-{t.next_station}",
            "status": status,
            "route": None,
            "zone": None,
            "trainType": None,
            "lastUpdated": t.cached_at.isoformat() if t.cached_at else ""
        })
        
    return result

@router.get("/recent-predictions", response_model=List[PredictionHistoryItem])
def get_recent_predictions(db: Session = Depends(get_db)):
    preds = db.query(PredictionHistory).order_by(PredictionHistory.created_at.desc()).limit(5).all()
    
    result = []
    for p in preds:
        result.append(PredictionHistoryItem(
            id=str(p.id),
            trainNumber=p.train_number,
            trainName=p.train_name or f"Train {p.train_number}",
            date=p.created_at.strftime("%Y-%m-%d"),
            predictedETA=p.predicted_eta.strftime("%H:%M"),
            actualArrival=None,
            predictedDelay=p.predicted_delay,
            actualDelay=None,
            confidenceScore=p.confidence,
            accuracy=None,
            status=None
        ))
        
    return result

@router.get("/prediction/history", response_model=PaginatedPredictionHistory)
def get_prediction_history(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1),
    search: str = Query("", max_length=50),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionHistory)
    if search:
        query = query.filter(PredictionHistory.train_number.ilike(f"%{search}%"))
        
    total = query.count()
    preds = query.order_by(PredictionHistory.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    
    data = []
    for p in preds:
        data.append(PredictionHistoryItem(
            id=str(p.id),
            trainNumber=p.train_number,
            trainName=p.train_name or f"Train {p.train_number}",
            date=p.created_at.strftime("%Y-%m-%d"),
            predictedETA=p.predicted_eta.strftime("%H:%M"),
            actualArrival=None,
            predictedDelay=p.predicted_delay,
            actualDelay=None,
            confidenceScore=p.confidence,
            accuracy=None,
            status=None
        ))
        

    return PaginatedPredictionHistory(
        data=data,
        total=total,
        page=page,
        pageSize=pageSize
    )

@router.get("/analytics", response_model=AnalyticsData)
def get_analytics():
    return AnalyticsData(
        delayDistribution=[],
        predictionConfidence=[],
        topDelayedTrains=[],
        delayByZone=[],
        etaTrend=[]
    )

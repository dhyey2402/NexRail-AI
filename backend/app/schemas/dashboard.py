from typing import List, Optional
from pydantic import BaseModel

class DashboardStats(BaseModel):
    totalTrains: int
    activePredictions: int
    delayedTrains: int
    onTimeTrains: int
    avgAccuracy: Optional[float]
    avgDelay: float
    activeBlockSections: int
    signalingHealthPercent: float
    inferenceLatencyMs: int

class PredictionHistoryItem(BaseModel):
    id: str
    trainNumber: str
    trainName: str
    date: str
    predictedETA: str
    actualArrival: Optional[str]
    predictedDelay: float
    actualDelay: Optional[float]
    confidenceScore: float
    accuracy: Optional[float]
    status: Optional[str]

class PaginatedPredictionHistory(BaseModel):
    data: List[PredictionHistoryItem]
    total: int
    page: int
    pageSize: int

class DelayDistributionItem(BaseModel):
    range: str
    count: int

class PredictionConfidenceItem(BaseModel):
    date: str
    confidence: float
    accuracy: float

class TopDelayedTrainItem(BaseModel):
    train: str
    avgDelay: float
    count: int

class DelayByZoneItem(BaseModel):
    zone: str
    avgDelay: float
    totalTrains: int

class EtaTrendItem(BaseModel):
    time: str
    predicted: float
    actual: float

class AnalyticsData(BaseModel):
    delayDistribution: List[DelayDistributionItem]
    predictionConfidence: List[PredictionConfidenceItem]
    topDelayedTrains: List[TopDelayedTrainItem]
    delayByZone: List[DelayByZoneItem]
    etaTrend: List[EtaTrendItem]

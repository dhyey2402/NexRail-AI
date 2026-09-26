// ============================================================
// Railway Operations & ETA Control Center — Types
// ============================================================

export interface Train {
  trainNumber: string;
  trainName: string;
  source: string | null;
  sourceCode: string | null;
  destination: string | null;
  destinationCode: string | null;
  currentStation: string;
  currentStationCode: string;
  nextStation: string;
  nextStationCode: string;
  scheduledDeparture: string | null;
  actualDeparture: string | null;
  scheduledArrival: string | null;
  currentDelay: number; // in minutes
  speed: number; // km/h
  maxPermittedSpeed: number | null; // km/h
  locoType: string | null; // e.g. WAP-7, WAP-5, WDG-4
  rakeLength: number | null; // coaches (e.g. 24)
  priorityTier: string | null;
  signalAspect: string | null;
  blockOccupancy: string; // e.g. "Block CNB-ALD-04"
  status: TrainStatus;
  route: string | null;
  zone: string | null;
  trainType: string | null;
  lastUpdated: string;
  latitude?: number;
  longitude?: number;
  stations?: any[];
  isLiveLocationValid?: boolean;
  geoStatus?: "LIVE" | "STALE" | "DEGRADED" | "UNAVAILABLE";
}

export type TrainStatus =
  | "on-time"
  | "slight-delay"
  | "delayed"
  | "severe-delay"
  | "cancelled"
  | "arrived";

export interface ShapValue {
  featureName: string;
  category: "Infrastructure" | "Locomotive" | "Meteorological" | "Congestion" | "Temporal";
  valueContribution: number; // minutes added (+) or subtracted (-)
  displayValue: string; // e.g. "Track Density: 84%"
  baseline: number;
}

export interface Prediction {
  trainNumber: string;
  trainName: string;
  currentStation: string;
  currentStationCode: string;
  nextStation: string;
  nextStationCode: string;
  currentDelay: number;
  predictedETA: string;
  predictedDelay: number;
  confidenceScore: number; // 0-100
  operationalStatus: string;
  isValidForLiveJourney?: boolean;
  invalidReason?: string | null;
  locoTelemetry: {
    speed: number;
    maxSpeed: number;
    throttlePercent: number;
    brakePressure: number; // bar
    nextSignals: ("green" | "double-yellow" | "yellow" | "red")[];
  };
  shapBreakdown: ShapValue[];
  reasoning: ReasoningStep[];
  aiDispatchRecommendation: {
    action: string;
    expectedSavingMinutes: number;
    urgency: "CRITICAL" | "HIGH" | "ADVISORY";
    rationale: string;
  };
  timestamp: string;
}

export interface ReasoningStep {
  factor: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  weight: number; // 0-1
}

export interface WeatherData {
  station: string;
  condition: string;
  temperature: number;
  humidity: number;
  visibility: number; // in km
  windSpeed: number;
  rainfall: number; // mm
  advisory: string;
  icon: string;
  updatedAt: string;
}

export interface SimulationParams {
  trainNumber: string;
  weatherCondition: "clear" | "light-rain" | "heavy-rain" | "fog" | "storm";
  trackCongestion: number; // 0-100
  lateIncomingRake: boolean;
  rakeDelay: number; // minutes
  maintenanceBlock: boolean;
  maintenanceDuration: number; // minutes
  averageSpeed: number; // km/h
}

export interface SimulationResult {
  trainNumber: string;
  trainName: string;
  originalETA: string;
  newETA: string;
  originalDelay: number;
  additionalDelay: number;
  totalDelay: number;
  confidenceScore: number;
  factors: SimulationFactor[];
  scenarioName: string;
  smartDispatchSolution: {
    action: string;
    mitigatedDelayMinutes: number;
    reroutePlan: string;
  };
  corridorStations?: string[];
}

export interface SimulationFactor {
  name: string;
  delayImpact: number; // minutes added
  severity: "low" | "medium" | "high";
}

export interface PredictionHistoryItem {
  id: string;
  trainNumber: string;
  trainName: string;
  date: string;
  predictedETA: string;
  actualArrival: string | null;
  predictedDelay: number;
  actualDelay: number | null;
  confidenceScore: number;
  accuracy: number | null;
  status: string | null;
  station?: string | null;
  delay?: number;
  confidence?: number;
  loco?: string;
}

export interface AnalyticsData {
  delayDistribution: { range: string; count: number }[];
  predictionConfidence: { date: string; confidence: number; accuracy: number }[];
  topDelayedTrains: { train: string; avgDelay: number; count: number }[];
  delayByZone: { zone: string; avgDelay: number; totalTrains: number }[];
  etaTrend: { time: string; predicted: number; actual: number }[];
}

export interface DashboardStats {
  totalTrains: number;
  activePredictions: number;
  delayedTrains: number;
  onTimeTrains: number;
  avgAccuracy: number | null;
  avgDelay: number;
  activeBlockSections: number;
  signalingHealthPercent: number;
  inferenceLatencyMs: number;
  modelName?: string | null;
  modelVersion?: string | null;
}

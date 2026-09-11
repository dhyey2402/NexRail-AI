export const TRAIN_STATUS = {
  ON_TIME: 'ON_TIME',
  SLIGHT_DELAY: 'SLIGHT_DELAY',
  DELAYED: 'DELAYED',
  ARRIVED: 'ARRIVED',
  CANCELLED: 'CANCELLED',
} as const

export type TrainStatus = (typeof TRAIN_STATUS)[keyof typeof TRAIN_STATUS]

export type StationStop = {
  code: string
  name: string
  scheduledArrival: string | null
  scheduledDeparture: string | null
  actualArrival: string | null
  actualDeparture: string | null
  delayMin: number
  status: 'passed' | 'current' | 'upcoming'
  platform?: string
  lat: number
  lng: number
  km: number
}

export type TrainLive = {
  number: string
  name: string
  type?: string
  source?: string
  destination?: string
  currentStation: string
  currentStationCode?: string
  nextStation: string
  nextStationCode?: string
  status: TrainStatus
  delayMin: number
  speedKmph: number
  platform?: string
  lastUpdated: number
  lat: number
  lng: number
  stations?: StationStop[]
}

export type DelayPropagation = {
  station_code: string
  station_name: string
  scheduled_arrival: string | null
  predicted_arrival: string | null
  predicted_delay_minutes: number
  status: string
}

export type RecoveryAdvice = {
  action: string
  reason: string
  estimated_recovery_minutes: number | null
  confidence: number | null
  affected_station: string | null
}

export type AlternativePlan = {
  train_number: string
  train_name: string
  departure_station: string
  destination: string
  departure_time: string
  arrival_time: string
  estimated_journey_hours: number
  estimated_time_saved_minutes: number | null
  reason: string
}

export type Prediction = {
  predictedEta: string
  predictedDelayMin: number
  confidence: number
  lastUpdated: number
  reasoning: string[]
  weatherContext?: {
    condition: string
    visibility_km: number
    fog_alert: boolean
    rainfall_intensity: string
    temperature_c: number
    impact_level: string
    summary: string
  }
  delayPropagation?: DelayPropagation[]
  recoveryAdvice?: RecoveryAdvice[]
  alternativePlan?: AlternativePlan | null
}

export type WeatherInfo = {
  station: string
  temperatureC: number
  condition: string
  humidity: number
  visibilityKm: number
  windKmph: number
  rainfall: number
  advisory: string
  kind: 'rain' | 'clear' | 'cloud' | 'storm'
}

/**
 * Scenario definitions for what-if simulation.
 * These map directly to backend ML feature modifications.
 */
export type ScenarioId =
  | 'late_incoming_rake'
  | 'high_congestion'
  | 'single_track'
  | 'extra_psr'

export type Scenario = {
  id: ScenarioId
  label: string
  description: string
  /** Backend modified_features payload for this scenario */
  modifiedFeatures: Record<string, number>
}

export type SimulationResult = {
  originalEta: string | null
  newEta: string
  additionalDelayMin: number
  originalDelayMin: number | null
  newDelayMin: number | null
  confidence: number | null
  reasoning: string[]
  impact: string
}

export type RecentSearch = {
  number: string
  name: string
  route: string
  searchedAt: number
}

export type LiveTrainSummary = {
  trainNumber: string
  trainName: string
  currentStation: string
  nextStation: string
  currentDelay: number
  speed: number
  status: string
}

import type {
  LiveTrainSummary,
  Prediction,
  Scenario,
  SimulationResult,
  TrainLive,
  WeatherInfo,
} from '@/types/train'
import { TRAIN_STATUS } from '@/types/train'

// Resolve API base URL from environment variables, supporting VITE_API_URL and VITE_API_BASE_URL.
// Normalizes trailing slashes and ensures /api prefix is present.
const rawApiUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000"
).trim().replace(/\/+$/, "");

const BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

// ─── Helpers ──────────────────────────────────────────────

import { getToken, clearToken } from './tokenStorage'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    const headers = new Headers(init?.headers)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const token = getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    res = await fetch(url, {
      ...init,
      headers,
    })
  } catch {
    throw new ApiError('Network error — unable to reach server', 0)
  }
  
  if (res.status === 401) {
    clearToken()
    // Trigger re-render by dispatching event if needed, or let context handle it on reload
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(body || `HTTP ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}

export async function getCurrentUser() {
  return await fetchJson<any>(`${BASE_URL}/auth/me`)
}

export async function login(data: any) {
  const form = new URLSearchParams()
  form.append('username', data.email)
  form.append('password', data.password)
  return await fetchJson<any>(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  })
}

export async function register(data: any) {
  return await fetchJson<any>(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

function deriveStatus(delayMin: number) {
  if (delayMin <= 0) return TRAIN_STATUS.ON_TIME
  if (delayMin <= 15) return TRAIN_STATUS.SLIGHT_DELAY
  return TRAIN_STATUS.DELAYED
}

function deriveWeatherKind(condition: string): WeatherInfo['kind'] {
  const c = condition.toLowerCase()
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'rain'
  if (c.includes('storm') || c.includes('thunder')) return 'storm'
  if (c.includes('cloud') || c.includes('overcast') || c.includes('haze') || c.includes('mist')) return 'cloud'
  return 'clear'
}

// ─── Train ────────────────────────────────────────────────

interface BackendTrainResponse {
  train_number: string
  train_name: string
  current_station: string
  next_station: string
  latitude: number
  longitude: number
  current_delay: number
  speed: number
  last_updated: string
  source?: string | null
  destination?: string | null
  train_type?: string | null
  platform?: string | null
  stations?: any[]
}

export async function getTrain(id: string): Promise<TrainLive> {
  const trainNumber = id.trim()
  const data = await fetchJson<BackendTrainResponse>(`${BASE_URL}/train/${trainNumber}`)

  return {
    number: data.train_number,
    name: data.train_name,
    type: data.train_type ?? undefined,
    source: data.source ?? undefined,
    destination: data.destination ?? undefined,
    currentStation: data.current_station,
    nextStation: data.next_station,
    status: deriveStatus(data.current_delay),
    delayMin: data.current_delay,
    speedKmph: data.speed,
    platform: data.platform ?? undefined,
    lastUpdated: new Date(data.last_updated).getTime(),
    lat: data.latitude,
    lng: data.longitude,
    stations: data.stations,
  }
}

// ─── Prediction ───────────────────────────────────────────

interface BackendPredictionResponse {
  predicted_eta: string
  predicted_delay: number
  confidence: number
  reasoning: string[]
  weather_context?: Record<string, unknown>
  prediction_timestamp?: string
  is_valid_for_live_journey?: boolean
  invalid_reason?: string | null
}

export async function getPrediction(train: TrainLive): Promise<Prediction> {
  const data = await fetchJson<BackendPredictionResponse>(`${BASE_URL}/predict/`, {
    method: 'POST',
    body: JSON.stringify({
      train_number: train.number,
      departure_date: new Date().toISOString().split('T')[0],
    }),
  })

  return {
    predictedEta: data.predicted_eta,
    predictedDelayMin: data.predicted_delay,
    confidence: data.confidence,
    lastUpdated: data.prediction_timestamp ? new Date(data.prediction_timestamp).getTime() : Date.now(),
    reasoning: data.reasoning ?? [],
    weatherContext: data.weather_context
      ? {
          condition: String(data.weather_context.condition ?? 'Unknown'),
          visibility_km: Number(data.weather_context.visibility_km ?? 10),
          fog_alert: Boolean(data.weather_context.fog_alert),
          rainfall_intensity: String(data.weather_context.rainfall_intensity ?? 'None'),
          temperature_c: Number(data.weather_context.temperature_c ?? 25),
          impact_level: String(data.weather_context.impact_level ?? 'None'),
          summary: String(data.weather_context.summary ?? ''),
        }
      : undefined,
    isValidForLiveJourney: data.is_valid_for_live_journey ?? true,
    invalidReason: data.invalid_reason ?? null,
  }
}

// ─── Weather ──────────────────────────────────────────────

interface BackendWeatherResponse {
  temperature: number
  humidity: number
  visibility: number
  weather_condition: string
  wind_speed: number
  rainfall: number
  timestamp: string
}

export async function getWeather(train?: TrainLive): Promise<WeatherInfo | null> {
  if (!train || (train.lat === 0 && train.lng === 0)) return null

  try {
    const data = await fetchJson<BackendWeatherResponse>(
      `${BASE_URL}/weather/current?lat=${train.lat}&lon=${train.lng}`,
    )
    const condition = data.weather_condition || 'Unknown'
    return {
      station: train.currentStation,
      temperatureC: data.temperature,
      condition,
      humidity: data.humidity,
      visibilityKm: data.visibility,
      windKmph: data.wind_speed,
      rainfall: data.rainfall,
      advisory: data.rainfall > 5
        ? 'Heavy rainfall may affect operational conditions in this section.'
        : data.visibility < 2
          ? 'Low visibility conditions — caution orders may apply.'
          : 'No weather-related operational caution in the current section.',
      kind: deriveWeatherKind(condition),
    }
  } catch {
    return null
  }
}

// ─── Simulation ───────────────────────────────────────────

interface BackendSimulationResponse {
  original_eta?: string | null
  new_eta: string
  additional_delay: number
  original_delay?: number | null
  new_delay?: number | null
  confidence?: number | null
  reasoning?: string[]
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'late_incoming_rake',
    label: 'Late Incoming Rake',
    description: 'Primary rake arrived late at originating terminal, causing cascade departure delay.',
    modifiedFeatures: { late_incoming_rake: 1 },
  },
  {
    id: 'high_congestion',
    label: 'High Congestion',
    description: 'Elevated network congestion on this corridor section.',
    modifiedFeatures: { zone_congestion_index: 0.92 },
  },
  {
    id: 'single_track',
    label: 'Single Track Section',
    description: 'Doubled track downgraded to single-line working (e.g. maintenance block).',
    modifiedFeatures: { track_doubled: 0 },
  },
  {
    id: 'extra_psr',
    label: 'Speed Restrictions',
    description: 'Additional Permanent/Temporary Speed Restrictions in force on the section.',
    modifiedFeatures: { psr_count: 10 },
  },
]

export async function simulateScenario(
  train: TrainLive,
  scenarioId: string,
): Promise<SimulationResult> {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)
  if (!scenario) throw new ApiError('Unknown scenario')

  const data = await fetchJson<BackendSimulationResponse>(`${BASE_URL}/simulate/`, {
    method: 'POST',
    body: JSON.stringify({
      original_features: { train_number: train.number },
      modified_features: scenario.modifiedFeatures,
    }),
  })

  return {
    originalEta: data.original_eta ?? null,
    newEta: data.new_eta,
    additionalDelayMin: data.additional_delay,
    originalDelayMin: data.original_delay ?? null,
    newDelayMin: data.new_delay ?? null,
    confidence: data.confidence ?? null,
    reasoning: data.reasoning ?? [],
    impact:
      data.reasoning && data.reasoning.length > 0
        ? data.reasoning[0]
        : `Scenario adds approximately ${data.additional_delay} minutes of delay.`,
  }
}

// ─── Live Train List (for search suggestions) ─────────────

export async function getLiveTrains(): Promise<LiveTrainSummary[]> {
  try {
    const data = await fetchJson<Array<Record<string, unknown>>>(`${BASE_URL}/dashboard/live-trains`)
    return data.map((t) => ({
      trainNumber: String(t.trainNumber ?? ''),
      trainName: String(t.trainName ?? ''),
      currentStation: String(t.currentStation ?? ''),
      nextStation: String(t.nextStation ?? ''),
      currentDelay: Number(t.currentDelay ?? 0),
      speed: Number(t.speed ?? 0),
      status: String(t.status ?? 'unknown'),
    }))
  } catch {
    return []
  }
}

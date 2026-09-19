import type {
  Train,
  Prediction,
  WeatherData,
  SimulationParams,
  SimulationResult,
  PredictionHistoryItem,
  AnalyticsData,
  DashboardStats,
} from "../types";

// Resolve API base URL from environment variables, supporting VITE_API_URL and VITE_API_BASE_URL.
// Normalizes trailing slashes and ensures /api prefix is present.
const rawApiUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000"
).trim().replace(/\/+$/, "");

export const API_BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

import { getToken, clearToken } from "./tokenStorage";

/**
 * Helper to fetch data and throw properly on HTTP errors.
 */
async function fetchApi(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const headers = new Headers(options?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      clearToken();
      // Application level redirect or re-render should happen via context
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch failed for ${endpoint}:`, error);
    throw error;
  }
}

export async function getCurrentUser() {
  return await fetchApi("/auth/me");
}

export async function login(data: any) {
  const form = new URLSearchParams();
  form.append("username", data.email);
  form.append("password", data.password);
  return await fetchApi("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return await fetchApi("/dashboard/stats");
}

export async function getRecentPredictions(): Promise<PredictionHistoryItem[]> {
  return await fetchApi("/dashboard/recent-predictions");
}

export async function getLiveTrains(): Promise<Train[]> {
  return await fetchApi("/dashboard/live-trains");
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return await fetchApi("/dashboard/analytics");
}

export async function getPredictionHistory(
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
): Promise<{ data: PredictionHistoryItem[]; total: number; page: number; pageSize: number }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search,
  });
  return await fetchApi(`/dashboard/prediction/history?${queryParams.toString()}`);
}

export async function getTrainDetails(trainNumber: string): Promise<Train | null> {
  try {
    const data = await fetchApi(`/train/${trainNumber}`);
    
    // Map backend TrainResponse to frontend Train interface
    // Backend: train_number, train_name, current_station, next_station, latitude, longitude, 
    // current_delay, speed, last_updated
    const delay = data.current_delay || 0;
    
    let status: any = "on-time";
    if (delay > 60) status = "severe-delay";
    else if (delay > 15) status = "delayed";
    else if (delay > 0) status = "slight-delay";

    return {
      trainNumber: data.train_number,
      trainName: data.train_name || `Express ${data.train_number}`,
      source: data.source || null,
      sourceCode: data.sourceCode || null,
      destination: data.destination || null,
      destinationCode: data.destinationCode || null,
      currentStation: data.current_station,
      currentStationCode: data.current_station,
      nextStation: data.next_station,
      nextStationCode: data.next_station,
      scheduledDeparture: data.scheduledDeparture || null,
      actualDeparture: data.actualDeparture || null,
      scheduledArrival: data.scheduledArrival || null,
      currentDelay: delay,
      speed: data.speed,
      maxPermittedSpeed: data.maxPermittedSpeed || null,
      locoType: data.locoType || null,
      rakeLength: data.rakeLength || null,
      priorityTier: data.priorityTier || null,
      signalAspect: data.signalAspect || null,
      blockOccupancy: data.blockOccupancy || `Block ${data.current_station}-${data.next_station}`,
      status,
      route: data.route || null,
      zone: data.zone || null,
      trainType: data.train_type || null,
      lastUpdated: data.last_updated,
      latitude: data.latitude,
      longitude: data.longitude
    };
  } catch (error) {
    return null;
  }
}

export async function predictETA(trainNumber: string): Promise<Prediction | null> {
  try {
    // We send a PredictionRequest to the backend
    const payload = {
      train_number: trainNumber,
      departure_date: new Date().toISOString().split("T")[0]
    };

    const data = await fetchApi("/predict/", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // Map backend PredictionResponse to frontend Prediction interface
    // Backend: predicted_eta, predicted_delay, confidence, reasoning (List[str]), 
    // weather_context, recovery_advice, delay_propagation, alternative_plan
    
    const shapBreakdown: any[] = []; // Do not fabricate SHAP values if backend does not provide them

    const opStatus = data.predicted_delay < 15 
      ? "Slight Delay · Priority Recovery Mode" 
      : "Moderate Congestion · AI Auto-Regulation";

    return {
      trainNumber: trainNumber,
      trainName: `Train ${trainNumber}`,
      currentStation: "N/A",
      currentStationCode: "N/A",
      nextStation: "N/A",
      nextStationCode: "N/A",
      currentDelay: data.predicted_delay, // Placeholder mapping
      predictedETA: data.predicted_eta,
      predictedDelay: data.predicted_delay,
      confidenceScore: data.confidence,
      operationalStatus: opStatus,
      locoTelemetry: {
        speed: 80,
        maxSpeed: 130,
        throttlePercent: 75,
        brakePressure: 5.0,
        nextSignals: ["green"]
      },
      shapBreakdown: shapBreakdown,
      reasoning: data.reasoning && data.reasoning.length > 0 && data.reasoning[0] !== "" ? data.reasoning.map((r: string) => ({
        factor: "Reasoning",
        description: r,
        impact: "neutral",
        weight: 0.5
      })) : [],
      aiDispatchRecommendation: {
        action: data.alternative_plan?.plan_name || "Maintain Schedule",
        expectedSavingMinutes: data.alternative_plan?.recoverable_minutes || 0,
        urgency: "ADVISORY",
        rationale: data.alternative_plan?.mitigation_actions?.[0] || "No urgent action required."
      },
      timestamp: data.prediction_timestamp || new Date().toISOString()
    };
  } catch (error) {
    return null;
  }
}

export async function getWeather(lat: number, lon: number, stationCode?: string): Promise<WeatherData> {
  try {
    const data = await fetchApi(`/weather/current?lat=${lat}&lon=${lon}`);
    
    // Map WeatherResponse
    return {
      station: stationCode && stationCode !== "N/A" ? `${stationCode} Station` : `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
      condition: data.weather_condition,
      temperature: data.temperature,
      humidity: data.humidity,
      visibility: data.visibility,
      windSpeed: data.wind_speed,
      rainfall: data.rainfall,
      advisory: data.rainfall > 5 ? "Heavy Rain Alert" : "Clear Conditions",
      icon: "cloud", // fallback
      updatedAt: data.timestamp
    };
  } catch (error) {
    // Fallback if weather API fails
    return {
      station: stationCode && stationCode !== "N/A" ? `${stationCode} Station` : `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
      condition: "Unknown",
      temperature: 0,
      humidity: 0,
      visibility: 0,
      windSpeed: 0,
      rainfall: 0,
      advisory: "Weather Data Unavailable",
      icon: "cloud",
      updatedAt: new Date().toISOString()
    };
  }
}

export async function simulateScenario(params: SimulationParams): Promise<SimulationResult> {
  try {
    // Backend SimulationRequest takes: original_features, modified_features
    const payload = {
      original_features: {
        train_number: params.trainNumber
      },
      modified_features: {
        weather_condition: params.weatherCondition,
        track_congestion: params.trackCongestion,
        late_incoming_rake: params.lateIncomingRake ? 1 : 0,
        rake_delay: params.rakeDelay,
        maintenance_block: params.maintenanceBlock ? 1 : 0,
        maintenance_duration: params.maintenanceDuration,
        average_speed: params.averageSpeed
      }
    };

    const data = await fetchApi("/simulate/", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // Map SimulationResponse
    return {
      trainNumber: params.trainNumber,
      trainName: `Train ${params.trainNumber}`,
      originalETA: data.original_eta || "12:00",
      newETA: data.new_eta,
      originalDelay: data.original_delay || 0,
      additionalDelay: data.additional_delay,
      totalDelay: (data.original_delay || 0) + data.additional_delay,
      confidenceScore: data.confidence || 85,
      factors: [
        {
          name: "Simulated Modification",
          delayImpact: data.additional_delay,
          severity: data.additional_delay > 20 ? "high" : "medium"
        }
      ],
      scenarioName: "User Defined Scenario",
      smartDispatchSolution: {
        action: "AI Interlocking Dynamic Reroute",
        mitigatedDelayMinutes: Math.round(data.additional_delay * 0.4),
        reroutePlan: "Switch to alternate line."
      }
    };
  } catch (error) {
    // Return dummy data on failure to not break UI
    return {
      trainNumber: params.trainNumber,
      trainName: `Train ${params.trainNumber}`,
      originalETA: "12:00",
      newETA: "12:30",
      originalDelay: 0,
      additionalDelay: 30,
      totalDelay: 30,
      confidenceScore: 80,
      factors: [],
      scenarioName: "Failed to simulate",
      smartDispatchSolution: {
        action: "None",
        mitigatedDelayMinutes: 0,
        reroutePlan: "N/A"
      }
    };
  }
}

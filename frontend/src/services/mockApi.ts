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

import {
  dashboardStats,
  liveTrains,
  samplePrediction,
  sampleWeather,
  weatherScenarios,
  predictionHistory,
  analyticsData,
  recentPredictions,
} from "../data/mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(250);
  return { ...dashboardStats };
}

export async function getRecentPredictions() {
  await delay(200);
  return [...recentPredictions];
}

export async function getTrainDetails(trainNumber: string): Promise<Train | null> {
  await delay(300);
  const train = liveTrains.find((t) => t.trainNumber === trainNumber);
  return train ? { ...train } : null;
}

export async function predictETA(trainNumber: string): Promise<Prediction | null> {
  await delay(600);
  const train = liveTrains.find((t) => t.trainNumber === trainNumber);
  if (!train) return null;

  const currentDelay = train.currentDelay;
  const predictedDelay = Math.max(0, currentDelay + Math.floor(Math.random() * 5) - 2);

  return {
    ...samplePrediction,
    trainNumber: train.trainNumber,
    trainName: train.trainName,
    currentStation: train.currentStation,
    currentStationCode: train.currentStationCode,
    nextStation: train.nextStation,
    nextStationCode: train.nextStationCode,
    currentDelay,
    predictedDelay,
    confidenceScore: 92 + Math.random() * 6,
    operationalStatus:
      currentDelay === 0
        ? "Priority Clear Line · On Schedule"
        : currentDelay < 15
          ? "Slight Delay · Priority Recovery Mode"
          : currentDelay < 40
            ? "Moderate Congestion · AI Auto-Regulation"
            : "Heavy Delay · Automatic Priority Rescheduling",
    locoTelemetry: {
      speed: train.speed,
      maxSpeed: train.maxPermittedSpeed || 130,
      throttlePercent: Math.round((train.speed / (train.maxPermittedSpeed || 130)) * 100),
      brakePressure: 5.0,
      nextSignals: [(train.signalAspect || "double-yellow") as any, "green", "double-yellow"],
    },
    shapBreakdown: [
      {
        featureName: `Track Section Density (${train.currentStationCode}-${train.nextStationCode})`,
        category: "Congestion",
        valueContribution: currentDelay > 20 ? 8.5 : 3.2,
        displayValue: currentDelay > 20 ? "High Section Headway" : "Clear Block Section",
        baseline: 0,
      },
      {
        featureName: `Locomotive Capability (${train.locoType})`,
        category: "Locomotive",
        valueContribution: -3.8,
        displayValue: "High Power-to-Weight Traction",
        baseline: 0,
      },
      {
        featureName: `Train Priority Level (${train.priorityTier})`,
        category: "Infrastructure",
        valueContribution: -2.5,
        displayValue: "Main Line Priority Protocol",
        baseline: 0,
      },
      {
        featureName: "Station Turnaround Headroom",
        category: "Infrastructure",
        valueContribution: -1.4,
        displayValue: "Swift Platform Clearance",
        baseline: 0,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

export async function getWeather(stationCode: string): Promise<WeatherData> {
  await delay(200);
  const conditions = ["clear", "light-rain", "heavy-rain", "fog"];
  const randomCondition = conditions[Math.floor(Math.random() * 2)];
  const weather = weatherScenarios[randomCondition] || sampleWeather;
  return { ...weather, station: `${stationCode} Junction` };
}

export async function simulateScenario(params: SimulationParams): Promise<SimulationResult> {
  await delay(700);

  const train = liveTrains.find((t) => t.trainNumber === params.trainNumber);
  const trainName = train?.trainName || "Express Train";
  const baseDelay = train?.currentDelay || 0;

  let additionalDelay = 0;
  const factors: SimulationResult["factors"] = [];

  const weatherDelays: Record<string, number> = {
    clear: 0,
    "light-rain": 6,
    "heavy-rain": 24,
    fog: 38,
    storm: 52,
  };
  const weatherDelay = weatherDelays[params.weatherCondition] || 0;
  if (weatherDelay > 0) {
    additionalDelay += weatherDelay;
    factors.push({
      name: `Weather: ${params.weatherCondition.replace("-", " ").toUpperCase()}`,
      delayImpact: weatherDelay,
      severity: weatherDelay > 25 ? "high" : weatherDelay > 10 ? "medium" : "low",
    });
  }

  if (params.trackCongestion > 25) {
    const congestionDelay = Math.round(params.trackCongestion * 0.35);
    additionalDelay += congestionDelay;
    factors.push({
      name: `Track Section Density (${params.trackCongestion}%)`,
      delayImpact: congestionDelay,
      severity: params.trackCongestion > 65 ? "high" : "medium",
    });
  }

  if (params.lateIncomingRake) {
    const rakeImpact = Math.round(params.rakeDelay * 0.75);
    additionalDelay += rakeImpact;
    factors.push({
      name: `Late Turnaround Rake (+${params.rakeDelay}m)`,
      delayImpact: rakeImpact,
      severity: params.rakeDelay > 30 ? "high" : "medium",
    });
  }

  if (params.maintenanceBlock) {
    const maintenanceImpact = Math.round(params.maintenanceDuration * 0.8);
    additionalDelay += maintenanceImpact;
    factors.push({
      name: `Engineering Line Block (${params.maintenanceDuration}m)`,
      delayImpact: maintenanceImpact,
      severity: params.maintenanceDuration > 40 ? "high" : "medium",
    });
  }

  if (params.averageSpeed > 100) {
    const speedBenefit = Math.round((params.averageSpeed - 100) * 0.3);
    additionalDelay -= speedBenefit;
    factors.push({
      name: `Speed Clearance (${params.averageSpeed} km/h)`,
      delayImpact: -speedBenefit,
      severity: "low",
    });
  }

  const finalAdditional = Math.max(0, additionalDelay);
  const totalDelay = baseDelay + finalAdditional;

  const originalETADate = new Date();
  originalETADate.setHours(12, 35, 0);
  const newETADate = new Date(originalETADate.getTime() + finalAdditional * 60000);

  const formatTime = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const scenarioParts: string[] = [];
  if (params.weatherCondition !== "clear") scenarioParts.push(params.weatherCondition.replace("-", " "));
  if (params.trackCongestion > 30) scenarioParts.push("Congestion");
  if (params.lateIncomingRake) scenarioParts.push("Late Rake");
  if (params.maintenanceBlock) scenarioParts.push("Maint Block");

  const mitigatedDelay = Math.round(finalAdditional * 0.45);

  return {
    trainNumber: params.trainNumber,
    trainName,
    originalETA: "12:35",
    newETA: formatTime(newETADate),
    originalDelay: baseDelay,
    additionalDelay: finalAdditional,
    totalDelay,
    confidenceScore: Math.max(65, 96 - finalAdditional * 0.28),
    factors,
    scenarioName: scenarioParts.length > 0 ? scenarioParts.join(" + ") : "Nominal Clear Conditions",
    smartDispatchSolution: {
      action: "AI Interlocking Dynamic Reroute",
      mitigatedDelayMinutes: mitigatedDelay,
      reroutePlan: `Switch #12301 to Middle Fast Line at Km 412/18; Hold Freight #BOXN on Loop line 2 to recover ~${mitigatedDelay} min delay.`,
    },
  };
}

export async function getLiveTrains(): Promise<Train[]> {
  await delay(300);
  return [...liveTrains];
}

export async function getAnalytics(): Promise<AnalyticsData> {
  await delay(400);
  return { ...analyticsData };
}

export async function getPredictionHistory(
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
): Promise<{ data: PredictionHistoryItem[]; total: number; page: number; pageSize: number }> {
  await delay(300);

  let filtered = [...predictionHistory];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.trainNumber.includes(q) ||
        item.trainName.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

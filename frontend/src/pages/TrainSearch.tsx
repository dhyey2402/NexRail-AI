import { useState, useEffect } from "react";
import { Search, AlertCircle } from "lucide-react";
import PredictionCard from "../components/train/PredictionCard";
import WeatherCard from "../components/train/WeatherCard";
import ConfidenceMeter from "../components/train/ConfidenceMeter";
import ReasoningTimeline from "../components/train/ReasoningTimeline";
import CabTelemetryHUD from "../components/train/CabTelemetryHUD";
import ShapWaterfallChart from "../components/train/ShapWaterfallChart";
import EmptyState from "../components/common/EmptyState";
import { predictETA, getWeather } from "../services/api";
import type { Prediction, WeatherData } from "../types";

import { getStationCoord } from "../lib/geo";

const suggestedTrains = [
  { number: "12301", name: "Howrah Rajdhani", loco: "Electric" },
  { number: "22959", name: "Jamnagar Intercity", loco: "Superfast" },
  { number: "12002", name: "Bhopal Shatabdi", loco: "Shatabdi" },
  { number: "12050", name: "Gatiman Express", loco: "Superfast" },
  { number: "22926", name: "Okha Vande Bharat", loco: "Vande Bharat" },
  { number: "12202", name: "Garib Rath Express", loco: "Garib Rath" },
];

export default function TrainSearch() {
  const [trainNumber, setTrainNumber] = useState("12301");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (targetNumber?: string) => {
    const query = (targetNumber || trainNumber).trim();
    if (!query) return;

    setIsLoading(true);
    setError(null);

    try {
      const predData = await predictETA(query);
      if (!predData) {
        setError(`No active data found for Train #${query}. Verify the train number.`);
        setPrediction(null);
        setWeather(null);
        return;
      }
      setPrediction(predData);

      // Fetch dynamic telemetry for weather coordinates
      import("../services/api").then(async ({ getTrainDetails }) => {
        const trainData = await getTrainDetails(query);
        let stationCode = predData.currentStationCode || predData.currentStation;
        if (trainData) {
          stationCode = trainData.currentStationCode || trainData.currentStation || stationCode;
          setPrediction(prev => prev ? {
            ...prev,
            currentStation: trainData.currentStation || prev.currentStation,
            currentStationCode: trainData.currentStationCode || prev.currentStationCode,
            nextStation: trainData.nextStation || prev.nextStation,
            nextStationCode: trainData.nextStationCode || prev.nextStationCode,
          } : prev);
        }

        let lat = trainData?.latitude;
        let lon = trainData?.longitude;

        if (!lat || !lon || lat === 0 || lon === 0) {
          const resolved = getStationCoord(stationCode);
          if (resolved) {
            lat = resolved[0];
            lon = resolved[1];
          }
        }

        if (lat && lon && lat !== 0 && lon !== 0) {
          const weatherData = await getWeather(lat, lon, stationCode);
          setWeather(weatherData);
        } else {
          setWeather(null);
        }
      });
    } catch {
      setError("Failed to fetch prediction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch("12301");
  }, []);

  return (
    <div className="space-y-5">
      {/* Search Header */}
      <div className="nr-card p-4">
        <div className="max-w-2xl space-y-3">
          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--nr-text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="Enter train number (e.g. 12301)"
                className="w-full bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md pl-9 pr-3 py-2 text-[13px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !trainNumber.trim()}
              className="px-4 py-2 rounded-md bg-[var(--nr-accent)] hover:bg-[var(--nr-accent-hover)] disabled:opacity-50 text-white text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Predicting...</span>
                </>
              ) : (
                <span>Predict ETA</span>
              )}
            </button>
          </form>

          {/* Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--nr-text-muted)] mr-0.5">
              Quick:
            </span>
            {suggestedTrains.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => {
                  setTrainNumber(item.number);
                  handleSearch(item.number);
                }}
                className={`text-[11px] px-2 py-0.5 rounded border font-mono transition-colors ${
                  trainNumber === item.number
                    ? "bg-[var(--nr-accent-muted)] text-[var(--nr-accent)] border-[var(--nr-accent)]/30"
                    : "bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] border-[var(--nr-border)] hover:text-[var(--nr-text)] hover:border-[var(--nr-border-strong)]"
                }`}
              >
                {item.number}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-[var(--nr-danger-muted)] border border-[var(--nr-danger)]/20 flex items-center gap-2 text-[var(--nr-danger)] text-[13px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {!isLoading && prediction && (
        <div className="space-y-4">
          <CabTelemetryHUD
            speed={prediction.locoTelemetry.speed}
            maxSpeed={prediction.locoTelemetry.maxSpeed}
            throttlePercent={prediction.locoTelemetry.throttlePercent}
            brakePressure={prediction.locoTelemetry.brakePressure}
            signals={prediction.locoTelemetry.nextSignals}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <PredictionCard prediction={prediction} />
              <ShapWaterfallChart shapData={prediction.shapBreakdown} />
              <ReasoningTimeline steps={prediction.reasoning} />
            </div>

            <div className="space-y-4">
              <ConfidenceMeter score={prediction.confidenceScore} />
              {weather && <WeatherCard weather={weather} />}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !prediction && !error && (
        <EmptyState
          title="Enter a Train Number"
          description="Search for a 5-digit Indian Railways train number to generate an ETA prediction."
        />
      )}
    </div>
  );
}

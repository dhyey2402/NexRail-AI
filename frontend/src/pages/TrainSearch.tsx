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

const suggestedTrains = [
  { number: "12301", name: "Howrah Rajdhani", loco: "WAP-7" },
  { number: "12951", name: "Mumbai Rajdhani", loco: "WAP-7" },
  { number: "12002", name: "Bhopal Shatabdi", loco: "WAP-5" },
  { number: "12627", name: "Karnataka Exp", loco: "WAP-7" },
  { number: "12839", name: "Chennai Mail", loco: "WAP-4" },
  { number: "12259", name: "Sealdah Duronto", loco: "WAP-7" },
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
        if (trainData) {
          setPrediction(prev => prev ? {
            ...prev,
            currentStation: trainData.currentStation || "N/A",
            currentStationCode: trainData.currentStationCode || "N/A",
            nextStation: trainData.nextStation || "N/A",
            nextStationCode: trainData.nextStationCode || "N/A",
          } : prev);
        }
        const lat = trainData?.latitude ?? 28.6139;
        const lon = trainData?.longitude ?? 77.2090;
        const weatherData = await getWeather(lat, lon, trainData?.currentStation || predData.currentStation);
        setWeather(weatherData);
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

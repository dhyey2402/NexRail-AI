import { useState, useEffect } from "react";
import { Search, Sparkles, AlertCircle } from "lucide-react";
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
        setError(`No active telemetry found for Train #${query}. Please verify the train number.`);
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
        const lat = trainData?.latitude ?? 28.6139; // Default to Delhi if unavailable
        const lon = trainData?.longitude ?? 77.2090;
        const weatherData = await getWeather(lat, lon, trainData?.currentStation || predData.currentStation);
        setWeather(weatherData);
      });
    } catch {
      setError("Failed to fetch ML prediction inference. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch("12301");
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="app-card p-5">
        <div className="max-w-2xl space-y-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Train Telemetry & ETA Prediction
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Query real-time signaling telemetry, SHAP explainability attribution, and section arrival estimates.
            </p>
          </div>

          {/* Search Bar Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="Enter 5-digit train number (e.g. 12301)..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !trainNumber.trim()}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                  <span>Inferencing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Run Prediction</span>
                </>
              )}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-zinc-500 mr-1">
              Suggested:
            </span>
            {suggestedTrains.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => {
                  setTrainNumber(item.number);
                  handleSearch(item.number);
                }}
                className={`text-[11px] px-2 py-0.5 rounded-md border font-mono transition-colors ${
                  trainNumber === item.number
                    ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                    : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                #{item.number} · {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Results Container */}
      {!isLoading && prediction && (
        <div className="space-y-5">
          {/* Cab Telemetry HUD */}
          <CabTelemetryHUD
            speed={prediction.locoTelemetry.speed}
            maxSpeed={prediction.locoTelemetry.maxSpeed}
            throttlePercent={prediction.locoTelemetry.throttlePercent}
            brakePressure={prediction.locoTelemetry.brakePressure}
            signals={prediction.locoTelemetry.nextSignals}
          />

          {/* Core Prediction Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <PredictionCard prediction={prediction} />
              <ShapWaterfallChart shapData={prediction.shapBreakdown} />
              <ReasoningTimeline steps={prediction.reasoning} />
            </div>

            <div className="space-y-5">
              <ConfidenceMeter score={prediction.confidenceScore} />
              {weather && <WeatherCard weather={weather} />}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !prediction && !error && (
        <EmptyState
          title="Search a Train Number"
          description="Enter a 5-digit Indian Railways train number to generate real-time ETA predictions."
        />
      )}
    </div>
  );
}

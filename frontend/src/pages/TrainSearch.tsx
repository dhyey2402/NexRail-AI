import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  AlertCircle,
  Train as TrainIcon,
  SlidersHorizontal,
  Cpu,
} from "lucide-react";
import PredictionCard from "../components/train/PredictionCard";
import WeatherCard from "../components/train/WeatherCard";
import ConfidenceMeter from "../components/train/ConfidenceMeter";
import ReasoningTimeline from "../components/train/ReasoningTimeline";
import CabTelemetryHUD from "../components/train/CabTelemetryHUD";
import ShapWaterfallChart from "../components/train/ShapWaterfallChart";
import EmptyState from "../components/common/EmptyState";
import { predictETA, getWeather, getTrainDetails } from "../services/api";
import type { Prediction, WeatherData } from "../types";
import { getStationCoord } from "../lib/geo";

const suggestedTrains = [
  { number: "12301", name: "Howrah Rajdhani", loco: "Electric WAP-7" },
  { number: "22959", name: "Jamnagar Intercity", loco: "Superfast" },
  { number: "12002", name: "Bhopal Shatabdi", loco: "Shatabdi Exp" },
  { number: "12050", name: "Gatiman Express", loco: "Semi-High Speed" },
  { number: "22926", name: "Okha Vande Bharat", loco: "Vande Bharat" },
  { number: "12202", name: "Garib Rath Express", loco: "Garib Rath" },
];

export default function TrainSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTrain = searchParams.get("train") || "12301";

  const [trainNumber, setTrainNumber] = useState(initialTrain);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (targetNumber?: string) => {
    const query = (targetNumber || trainNumber).trim();
    if (!query) return;

    setIsLoading(true);
    setError(null);

    // Update URL query param quietly
    setSearchParams({ train: query });

    try {
      const predData = await predictETA(query);
      if (!predData) {
        setError(`No active operational telemetry found for Train #${query}. Verify train number or test one of the verified express corridors.`);
        setPrediction(null);
        setWeather(null);
        return;
      }
      setPrediction(predData);

      // Fetch dynamic telemetry for weather coordinates
      try {
        const trainData = await getTrainDetails(query);
        let stationCode = predData.currentStationCode || predData.currentStation;
        if (trainData) {
          stationCode = trainData.currentStationCode || trainData.currentStation || stationCode;
          setPrediction((prev) =>
            prev
              ? {
                  ...prev,
                  currentStation: trainData.currentStation || prev.currentStation,
                  currentStationCode: trainData.currentStationCode || prev.currentStationCode,
                  nextStation: trainData.nextStation || prev.nextStation,
                  nextStationCode: trainData.nextStationCode || prev.nextStationCode,
                }
              : prev
          );
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
      } catch (err) {
        console.warn("Weather fetch secondary failure:", err);
      }
    } catch {
      setError("Inference engine query failed. Please verify network connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(initialTrain);
  }, []);

  return (
    <div className="space-y-4">
      {/* ── Operational Command Bar ──────────────────────────── */}
      <div className="nr-card p-4 bg-[var(--nr-surface-glass)] backdrop-blur border border-[var(--nr-border)]">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrainIcon className="w-4 h-4 text-[var(--nr-accent)]" />
              <h2 className="text-[13px] font-semibold text-[var(--nr-text)]">
                Locomotive & Corridor ETA Inference Engine
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] border border-[var(--nr-border)]">
              LightGBM + Physics Model
            </span>
          </div>

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
                placeholder="Enter 5-digit train number (e.g. 12301, 12002, 22959)"
                className="w-full bg-[var(--nr-bg-subtle)] border border-[var(--nr-border)] rounded-md pl-9 pr-3 py-2 text-[13px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !trainNumber.trim()}
              className="px-5 py-2 rounded-md bg-[var(--nr-accent)] hover:bg-[var(--nr-accent-hover)] disabled:opacity-50 text-white text-[12px] font-semibold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Inference...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Generate ETA</span>
                </>
              )}
            </button>
          </form>

          {/* Suggested Verified Corridors */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-[var(--nr-text-muted)] mr-1 font-medium">
              Verified Corridors:
            </span>
            {suggestedTrains.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => {
                  setTrainNumber(item.number);
                  handleSearch(item.number);
                }}
                className={`text-[11px] px-2.5 py-1 rounded border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  trainNumber === item.number
                    ? "bg-[var(--nr-surface-raised)] text-[var(--nr-accent)] border-[var(--nr-accent)]/40 shadow-sm font-bold"
                    : "bg-[var(--nr-surface)] text-[var(--nr-text-muted)] border-[var(--nr-border)] hover:text-[var(--nr-text)] hover:border-[var(--nr-border-strong)]"
                }`}
              >
                <span>#{item.number}</span>
                <span className="text-[9px] text-[var(--nr-text-muted)] font-sans">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-[var(--nr-danger-muted)] border border-[var(--nr-danger)]/30 flex items-center gap-2.5 text-[var(--nr-danger)] text-[12px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Results Presentation ─────────────────────────────── */}
      {!isLoading && prediction && (
        <div className="space-y-4">
          {/* Cab Telemetry HUD */}
          <CabTelemetryHUD
            speed={prediction.locoTelemetry.speed}
            maxSpeed={prediction.locoTelemetry.maxSpeed}
            throttlePercent={prediction.locoTelemetry.throttlePercent}
            brakePressure={prediction.locoTelemetry.brakePressure}
            signals={prediction.locoTelemetry.nextSignals}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-4">
              <PredictionCard prediction={prediction} />
              <ShapWaterfallChart shapData={prediction.shapBreakdown} />
              <ReasoningTimeline steps={prediction.reasoning} />
            </div>

            {/* Side Column */}
            <div className="space-y-4">
              <ConfidenceMeter score={prediction.confidenceScore} />
              {weather && <WeatherCard weather={weather} />}

              {/* What-If Simulation Jump Link */}
              <div className="nr-card p-4 space-y-2 border border-[var(--nr-border)]">
                <div className="flex items-center gap-2 text-[var(--nr-text)] text-[12px] font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--nr-accent)]" />
                  <span>Stress Test Corridor</span>
                </div>
                <p className="text-[11px] text-[var(--nr-text-muted)] leading-relaxed">
                  Test disruption scenarios (weather storms, track maintenance blocks, or late incoming rakes) for #{prediction.trainNumber}.
                </p>
                <Link
                  to={`/simulate?train=${prediction.trainNumber}`}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-[var(--nr-surface-raised)] hover:bg-[var(--nr-border)] text-[var(--nr-accent)] text-[11px] font-semibold border border-[var(--nr-border)] transition-colors"
                >
                  Launch What-If Simulator &rarr;
                </Link>
              </div>
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

import { useState } from "react";
import {
  CloudRain,
  TrainTrack,
  Timer,
  Wrench,
  Gauge,
  Play,
  RotateCcw,
} from "lucide-react";
import type { SimulationParams } from "../../types";

interface ScenarioPanelProps {
  onSimulate: (params: SimulationParams) => void;
  onReset: () => void;
  isLoading: boolean;
  trainNumber: string;
  onTrainNumberChange: (value: string) => void;
}

export default function ScenarioPanel({
  onSimulate,
  onReset,
  isLoading,
  trainNumber,
  onTrainNumberChange,
}: ScenarioPanelProps) {
  const [weatherCondition, setWeatherCondition] = useState<SimulationParams["weatherCondition"]>("clear");
  const [trackCongestion, setTrackCongestion] = useState(20);
  const [lateIncomingRake, setLateIncomingRake] = useState(false);
  const [rakeDelay, setRakeDelay] = useState(15);
  const [maintenanceBlock, setMaintenanceBlock] = useState(false);
  const [maintenanceDuration, setMaintenanceDuration] = useState(30);
  const [averageSpeed, setAverageSpeed] = useState(90);

  const handleSimulate = () => {
    onSimulate({
      trainNumber,
      weatherCondition,
      trackCongestion,
      lateIncomingRake,
      rakeDelay,
      maintenanceBlock,
      maintenanceDuration,
      averageSpeed,
    });
  };

  const handleReset = () => {
    setWeatherCondition("clear");
    setTrackCongestion(20);
    setLateIncomingRake(false);
    setRakeDelay(15);
    setMaintenanceBlock(false);
    setMaintenanceDuration(30);
    setAverageSpeed(90);
    onReset();
  };

  const getCongestionColor = () => {
    if (trackCongestion > 70) return "text-[var(--nr-danger)]";
    if (trackCongestion > 40) return "text-[var(--nr-warning)]";
    return "text-[var(--nr-success)]";
  };

  return (
    <div className="nr-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--nr-border)]">
        <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Parameters</h3>
        <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
          Adjust conditions to evaluate impact
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Train Number */}
        <div>
          <label className="block text-[12px] font-medium text-[var(--nr-text-secondary)] mb-1">
            Train Number
          </label>
          <input
            type="text"
            value={trainNumber}
            onChange={(e) => onTrainNumberChange(e.target.value)}
            placeholder="e.g. 12301"
            className="w-full bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md px-3 py-1.5 text-[13px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] font-mono transition-colors"
          />
        </div>

        {/* Weather */}
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--nr-text-secondary)] mb-1">
            <CloudRain className="w-3.5 h-3.5" />
            Weather
          </label>
          <select
            value={weatherCondition}
            onChange={(e) =>
              setWeatherCondition(e.target.value as SimulationParams["weatherCondition"])
            }
            className="w-full bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md px-3 py-1.5 text-[13px] text-[var(--nr-text)] outline-none focus:border-[var(--nr-accent)] transition-colors appearance-none cursor-pointer"
          >
            <option value="clear">Clear Sky</option>
            <option value="light-rain">Light Rain</option>
            <option value="heavy-rain">Heavy Rain</option>
            <option value="fog">Dense Fog</option>
            <option value="storm">Thunderstorm</option>
          </select>
        </div>

        {/* Track Congestion */}
        <div>
          <div className="flex items-center justify-between text-[12px] font-medium text-[var(--nr-text-secondary)] mb-1.5">
            <span className="flex items-center gap-1.5">
              <TrainTrack className="w-3.5 h-3.5" />
              Track Congestion
            </span>
            <span className={`font-mono ${getCongestionColor()}`}>{trackCongestion}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={trackCongestion}
            onChange={(e) => setTrackCongestion(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-[var(--nr-border)] cursor-pointer accent-[var(--nr-accent)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--nr-text-muted)] font-mono mt-1">
            <span>Clear</span>
            <span>Moderate</span>
            <span>Severe</span>
          </div>
        </div>

        {/* Late Incoming Rake */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--nr-text-secondary)] cursor-pointer">
              <Timer className="w-3.5 h-3.5" />
              Late Incoming Rake
            </label>
            <button
              type="button"
              onClick={() => setLateIncomingRake(!lateIncomingRake)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                lateIncomingRake ? "bg-[var(--nr-accent)]" : "bg-[var(--nr-border)]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  lateIncomingRake ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {lateIncomingRake && (
            <div className="mt-2 pl-5">
              <label className="block text-[10px] text-[var(--nr-text-muted)] mb-1">
                Rake Delay (minutes)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={rakeDelay}
                onChange={(e) => setRakeDelay(Number(e.target.value))}
                className="w-full bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md px-2.5 py-1 text-[12px] text-[var(--nr-text)] font-mono outline-none focus:border-[var(--nr-accent)]"
              />
            </div>
          )}
        </div>

        {/* Maintenance Block */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--nr-text-secondary)] cursor-pointer">
              <Wrench className="w-3.5 h-3.5" />
              Maintenance Block
            </label>
            <button
              type="button"
              onClick={() => setMaintenanceBlock(!maintenanceBlock)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                maintenanceBlock ? "bg-[var(--nr-accent)]" : "bg-[var(--nr-border)]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  maintenanceBlock ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {maintenanceBlock && (
            <div className="mt-2 pl-5">
              <label className="block text-[10px] text-[var(--nr-text-muted)] mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                value={maintenanceDuration}
                onChange={(e) => setMaintenanceDuration(Number(e.target.value))}
                className="w-full bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md px-2.5 py-1 text-[12px] text-[var(--nr-text)] font-mono outline-none focus:border-[var(--nr-accent)]"
              />
            </div>
          )}
        </div>

        {/* Speed Override */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[12px] font-medium text-[var(--nr-text-secondary)] mb-1.5">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Speed Override
            </span>
            <span className="text-[var(--nr-text)] font-mono">{averageSpeed} km/h</span>
          </div>
          <input
            type="range"
            min={40}
            max={160}
            value={averageSpeed}
            onChange={(e) => setAverageSpeed(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-[var(--nr-border)] cursor-pointer accent-[var(--nr-accent)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--nr-text-muted)] font-mono mt-1">
            <span>40</span>
            <span>100</span>
            <span>160</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 pt-2 border-t border-[var(--nr-border)]">
        <button
          onClick={handleSimulate}
          disabled={isLoading || !trainNumber}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--nr-accent)] hover:bg-[var(--nr-accent-hover)] disabled:opacity-50 text-white text-[13px] font-medium py-2 rounded-md transition-colors"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isLoading ? "Running..." : "Simulate"}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2 rounded-md border border-[var(--nr-border)] text-[var(--nr-text-muted)] hover:text-[var(--nr-text)] hover:bg-[var(--nr-surface-raised)] transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

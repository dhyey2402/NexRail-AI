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
    if (trackCongestion > 70) return "text-rose-400";
    if (trackCongestion > 40) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <div className="app-card overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/40">
        <h3 className="text-xs font-semibold text-zinc-100">Scenario Parameters</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Adjust conditions to evaluate capacity friction
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Train Number */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Train Number
          </label>
          <input
            type="text"
            value={trainNumber}
            onChange={(e) => onTrainNumberChange(e.target.value)}
            placeholder="e.g. 12301"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-700 font-mono transition-colors"
          />
        </div>

        {/* Weather Condition */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-1">
            <CloudRain className="w-3.5 h-3.5" />
            Weather Condition
          </label>
          <select
            value={weatherCondition}
            onChange={(e) =>
              setWeatherCondition(e.target.value as SimulationParams["weatherCondition"])
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-700 transition-colors appearance-none cursor-pointer"
          >
            <option value="clear">☀️ Clear Sky</option>
            <option value="light-rain">🌧️ Light Rain</option>
            <option value="heavy-rain">⛈️ Heavy Rain</option>
            <option value="fog">🌫️ Dense Fog</option>
            <option value="storm">⚡ Thunderstorm</option>
          </select>
        </div>

        {/* Track Congestion */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-1.5">
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
            className="w-full h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
            <span>Clear</span>
            <span>Moderate</span>
            <span>Severe</span>
          </div>
        </div>

        {/* Late Incoming Rake */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 cursor-pointer">
              <Timer className="w-3.5 h-3.5" />
              Late Incoming Rake
            </label>
            <button
              type="button"
              onClick={() => setLateIncomingRake(!lateIncomingRake)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                lateIncomingRake ? "bg-sky-600" : "bg-zinc-800"
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
            <div className="mt-2 pl-4">
              <label className="block text-[10px] text-zinc-500 mb-1">
                Rake Delay (minutes)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={rakeDelay}
                onChange={(e) => setRakeDelay(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono outline-none focus:border-zinc-700"
              />
            </div>
          )}
        </div>

        {/* Maintenance Block */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 cursor-pointer">
              <Wrench className="w-3.5 h-3.5" />
              Maintenance Block
            </label>
            <button
              type="button"
              onClick={() => setMaintenanceBlock(!maintenanceBlock)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                maintenanceBlock ? "bg-sky-600" : "bg-zinc-800"
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
            <div className="mt-2 pl-4">
              <label className="block text-[10px] text-zinc-500 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                value={maintenanceDuration}
                onChange={(e) => setMaintenanceDuration(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono outline-none focus:border-zinc-700"
              />
            </div>
          )}
        </div>

        {/* Average Speed */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Speed Override
            </span>
            <span className="text-zinc-200 font-mono">{averageSpeed} km/h</span>
          </div>
          <input
            type="range"
            min={40}
            max={160}
            value={averageSpeed}
            onChange={(e) => setAverageSpeed(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
            <span>40 km/h</span>
            <span>100 km/h</span>
            <span>160 km/h</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2 pt-2 border-t border-zinc-800/60">
        <button
          onClick={handleSimulate}
          disabled={isLoading || !trainNumber}
          className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-medium py-2 rounded-lg transition-colors"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isLoading ? "Simulating..." : "Run Simulation"}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title="Reset defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

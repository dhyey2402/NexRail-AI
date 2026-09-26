import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import ScenarioPanel from "../components/simulation/ScenarioPanel";
import SimulationResult from "../components/simulation/SimulationResult";
import DifferenceChart from "../components/simulation/DifferenceChart";
import { simulateScenario } from "../services/api";
import type { SimulationParams, SimulationResult as SimulationResultType } from "../types";

const presetScenarios = [
  {
    name: "Monsoon Downpour",
    tag: "Weather",
    desc: "Heavy rain + 65% track congestion",
    params: {
      trainNumber: "12301",
      weatherCondition: "heavy-rain" as const,
      trackCongestion: 65,
      lateIncomingRake: false,
      rakeDelay: 15,
      maintenanceBlock: false,
      maintenanceDuration: 30,
      averageSpeed: 75,
    },
  },
  {
    name: "OHE Power Block",
    tag: "Maintenance",
    desc: "45-min overhead equipment work",
    params: {
      trainNumber: "12301",
      weatherCondition: "clear" as const,
      trackCongestion: 80,
      lateIncomingRake: false,
      rakeDelay: 15,
      maintenanceBlock: true,
      maintenanceDuration: 45,
      averageSpeed: 60,
    },
  },
  {
    name: "Yard Turnaround Delay",
    tag: "Rake",
    desc: "Late incoming rake (+40 min turnaround)",
    params: {
      trainNumber: "12301",
      weatherCondition: "clear" as const,
      trackCongestion: 25,
      lateIncomingRake: true,
      rakeDelay: 40,
      maintenanceBlock: false,
      maintenanceDuration: 30,
      averageSpeed: 105,
    },
  },
  {
    name: "Express Priority Run",
    tag: "Clear Track",
    desc: "Minimal congestion, 130 km/h green corridor",
    params: {
      trainNumber: "12301",
      weatherCondition: "clear" as const,
      trackCongestion: 5,
      lateIncomingRake: false,
      rakeDelay: 0,
      maintenanceBlock: false,
      maintenanceDuration: 0,
      averageSpeed: 130,
    },
  },
];

export default function WhatIfSimulation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTrain = searchParams.get("train") || "12301";

  const [trainNumber, setTrainNumber] = useState(queryTrain);
  const [result, setResult] = useState<SimulationResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>(presetScenarios[0].name);

  const handleRunSimulation = async (params: SimulationParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const simResult = await simulateScenario({ ...params, trainNumber });
      setResult(simResult);
    } catch (err: any) {
      setError(err?.message || "Simulation failed. Please verify train parameters.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const applyPreset = (preset: typeof presetScenarios[0]) => {
    setActivePreset(preset.name);
    const targetTrain = trainNumber || preset.params.trainNumber;
    handleRunSimulation({ ...preset.params, trainNumber: targetTrain });
  };

  useEffect(() => {
    if (queryTrain) {
      setTrainNumber(queryTrain);
    }
    handleRunSimulation({ ...presetScenarios[0].params, trainNumber: queryTrain });
  }, [queryTrain]);

  return (
    <div className="space-y-4">
      {/* ── Simulation Methodology Disclosure ────────────────── */}
      <div className="flex flex-wrap items-center justify-between bg-[var(--nr-surface-glass)] backdrop-blur border border-[var(--nr-border)] px-4 py-2.5 rounded-md gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nr-accent-muted)] text-[var(--nr-accent)] font-bold border border-[var(--nr-accent)]/30">
            DISPATCH SIMULATION ENGINE
          </span>
          <span className="text-[11px] text-[var(--nr-text-secondary)]">
            Counterfactual evaluation: <strong className="text-[var(--nr-text)]">LightGBM Terminal Variance</strong> + <strong className="text-[var(--nr-text)]">Kinematic Propagation Model</strong>.
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--nr-text-muted)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--nr-accent)]" />
          <span>Real-time Dispatch Advisory Active</span>
        </div>
      </div>

      {/* ── Presets Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {presetScenarios.map((preset, i) => (
          <button
            key={i}
            onClick={() => applyPreset(preset)}
            className={`text-left p-3 rounded-md border transition-all cursor-pointer ${
              activePreset === preset.name
                ? "bg-[var(--nr-surface-raised)] border-[var(--nr-accent)]/50 text-[var(--nr-text)] shadow-sm ring-1 ring-[var(--nr-accent)]/30"
                : "bg-[var(--nr-surface)] border-[var(--nr-border)] text-[var(--nr-text-secondary)] hover:text-[var(--nr-text)] hover:border-[var(--nr-border-strong)]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--nr-bg-subtle)] text-[var(--nr-text-muted)] border border-[var(--nr-border)]">
                {preset.tag}
              </span>
              <ArrowRight className="w-3 h-3 text-[var(--nr-text-faint)]" />
            </div>
            <div className="text-[12px] font-semibold text-[var(--nr-text)]">{preset.name}</div>
            <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5 line-clamp-1">{preset.desc}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-md text-[12px] text-rose-300">
          {error}
        </div>
      )}

      {/* ── Main Parameters and Results Grid ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <ScenarioPanel
            trainNumber={trainNumber}
            onTrainNumberChange={(num) => {
              setTrainNumber(num);
              setSearchParams({ train: num });
            }}
            onSimulate={handleRunSimulation}
            onReset={handleReset}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-8 space-y-4">
          <SimulationResult result={result} isLoading={isLoading} />
          <DifferenceChart result={result} />
        </div>
      </div>
    </div>
  );
}

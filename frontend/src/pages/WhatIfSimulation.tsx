import { useState, useEffect } from "react";
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
    desc: "Heavy rain + 65% track congestion on trunk line",
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
    name: "Overhead Line Block",
    tag: "Maintenance",
    desc: "45-min overhead equipment work + speed restriction",
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
    tag: "Yard",
    desc: "Late incoming rake turnaround (+40 min handover delay)",
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
    name: "Priority Clear Run",
    tag: "Clearance",
    desc: "Minimal congestion + 130 km/h speed priority",
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
  const [trainNumber, setTrainNumber] = useState("12301");
  const [result, setResult] = useState<SimulationResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(presetScenarios[0].name);

  const handleRunSimulation = async (params: SimulationParams) => {
    setIsLoading(true);
    try {
      const simResult = await simulateScenario(params);
      setResult(simResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  const applyPreset = (preset: typeof presetScenarios[0]) => {
    setActivePreset(preset.name);
    setTrainNumber(preset.params.trainNumber);
    handleRunSimulation(preset.params);
  };

  useEffect(() => {
    handleRunSimulation(presetScenarios[0].params);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="app-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Contingency Sandbox
              </span>
            </div>
            <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
              Operational What-If Simulator
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate delay ripples caused by weather disruptions, track blocks, and yard turnaround before ordering dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>AI Automated Mitigation Active</span>
          </div>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="app-card p-4">
        <div className="text-xs font-medium text-zinc-400 mb-2.5">
          Preset Operational Scenarios
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presetScenarios.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(preset)}
              className={`text-left p-3 rounded-lg border transition-all ${
                activePreset === preset.name
                  ? "bg-zinc-800 text-zinc-100 border-zinc-600"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                  {preset.tag}
                </span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </div>
              <div className="text-xs font-semibold text-zinc-200">
                {preset.name}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Controls */}
        <div className="lg:col-span-4">
          <ScenarioPanel
            trainNumber={trainNumber}
            onTrainNumberChange={setTrainNumber}
            onSimulate={handleRunSimulation}
            onReset={handleReset}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-8 space-y-5">
          <SimulationResult result={result} isLoading={isLoading} />
          <DifferenceChart result={result} />
        </div>
      </div>
    </div>
  );
}

import { cn, formatDelay } from "../../lib/utils";
import {
  Clock,
  TrendingUp,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";
import type { SimulationResult as SimulationResultType } from "../../types";

interface SimulationResultProps {
  result: SimulationResultType | null;
  isLoading: boolean;
}

export default function SimulationResult({ result, isLoading }: SimulationResultProps) {
  if (isLoading) {
    return (
      <div className="app-card p-8 flex flex-col items-center justify-center min-h-[360px] text-center">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin mb-3" />
        <h4 className="text-sm font-semibold text-zinc-200">
          Running Disruption Simulation...
        </h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Simulating track headway, block interlocking resistance, tractive effort, and weather friction.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="app-card p-8 flex flex-col items-center justify-center min-h-[360px] text-center">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
          <Layers className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-300">No Simulation Active</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          Select scenario parameters on the left and click "Run Simulation" to model the operational impact.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner Result */}
      <div className="app-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700/60">
                #{result.trainNumber}
              </span>
              <h3 className="text-sm font-semibold text-zinc-100">{result.trainName}</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Scenario: <span className="text-zinc-200 capitalize font-medium">{result.scenarioName}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500">Confidence:</span>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded border",
                result.confidenceScore >= 80
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}
            >
              {result.confidenceScore.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Before & After Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Baseline */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
              <span>Baseline Schedule</span>
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-xl font-bold font-mono text-zinc-200">{result.originalETA}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Initial: {formatDelay(result.originalDelay)}
            </div>
          </div>

          {/* Simulated Impact */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-[11px] text-amber-400 mb-1">
              <span>Simulated Impact</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">
              {result.additionalDelay > 0 ? `+${result.additionalDelay}m` : "0m"}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Delay variance delta
            </div>
          </div>

          {/* Projected Final ETA */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-[11px] text-sky-400 mb-1">
              <span>Projected ETA</span>
              <Clock className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-zinc-100">{result.newETA}</div>
            <div className="text-[11px] text-rose-400 font-mono mt-0.5">
              Total {result.totalDelay}m late
            </div>
          </div>
        </div>
      </div>

      {/* AI Automated Mitigation Plan */}
      {result.smartDispatchSolution && (
        <div className="app-card p-4 border-emerald-500/20 bg-zinc-900/40">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-100">
                Dispatch Mitigation Recommendation
              </span>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Mitigate ~{result.smartDispatchSolution.mitigatedDelayMinutes}m
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {result.smartDispatchSolution.reroutePlan}
          </p>
        </div>
      )}

      {/* Impact Breakdown */}
      <div className="app-card p-4">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
          <h4 className="text-xs font-semibold text-zinc-200">
            Active Friction Factor Breakdown
          </h4>
          <span className="text-[10px] text-zinc-500 font-mono">
            {result.factors.length} active factor{result.factors.length === 1 ? "" : "s"}
          </span>
        </div>

        {result.factors.length === 0 ? (
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs text-zinc-500 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            No adverse delay factors active in this baseline scenario.
          </div>
        ) : (
          <div className="space-y-1.5">
            {result.factors.map((factor, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      factor.severity === "high"
                        ? "bg-rose-500"
                        : factor.severity === "medium"
                          ? "bg-amber-500"
                          : "bg-sky-400"
                    )}
                  />
                  <span className="font-medium text-zinc-200">{factor.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span
                    className={cn(
                      "text-[11px] px-1.5 py-0.2 rounded font-medium",
                      factor.delayImpact > 0
                        ? "text-rose-400 bg-rose-500/10"
                        : "text-emerald-400 bg-emerald-500/10"
                    )}
                  >
                    {factor.delayImpact > 0 ? `+${factor.delayImpact}m` : `${factor.delayImpact}m`}
                  </span>
                  <span className="text-[10px] uppercase text-zinc-500">
                    {factor.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
      <div className="nr-card p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-8 h-8 border-2 border-[var(--nr-border)] border-t-[var(--nr-text-secondary)] rounded-full animate-spin mb-3" />
        <h4 className="text-[13px] font-semibold text-[var(--nr-text)]">
          Running Simulation...
        </h4>
        <p className="text-[12px] text-[var(--nr-text-muted)] mt-1 max-w-sm">
          Modeling disruption impact on schedule.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="nr-card p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-9 h-9 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center text-[var(--nr-text-muted)] mb-3">
          <Layers className="w-4 h-4" />
        </div>
        <h4 className="text-[13px] font-semibold text-[var(--nr-text)]">No Simulation Active</h4>
        <p className="text-[12px] text-[var(--nr-text-muted)] mt-1 max-w-xs">
          Adjust parameters and click "Simulate" to model operational impact.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Result Banner */}
      <div className="nr-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--nr-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono font-bold bg-[var(--nr-surface-raised)] text-[var(--nr-text)] px-2 py-0.5 rounded border border-[var(--nr-border)]">
                #{result.trainNumber}
              </span>
              <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">{result.trainName}</h3>
            </div>
            <p className="text-[12px] text-[var(--nr-text-secondary)] mt-0.5">
              Scenario: <span className="text-[var(--nr-text)] capitalize font-medium">{result.scenarioName}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[12px] font-mono">
            <span className="text-[var(--nr-text-muted)]">Confidence:</span>
            <span
              className={cn(
                "text-[12px] font-semibold px-2 py-0.5 rounded border",
                result.confidenceScore >= 80
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}
            >
              {result.confidenceScore.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md p-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--nr-text-muted)] mb-1">
              <span>Baseline</span>
              <Clock className="w-3.5 h-3.5 text-[var(--nr-text-secondary)]" />
            </div>
            <div className="text-lg font-bold font-mono text-[var(--nr-text)]">{result.originalETA}</div>
            <div className="text-[11px] text-[var(--nr-text-secondary)] mt-0.5">
              {formatDelay(result.originalDelay)}
            </div>
          </div>

          <div className="bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md p-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--nr-warning)] mb-1">
              <span>Added Delay</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold font-mono text-[var(--nr-warning)]">
              {result.additionalDelay > 0 ? `+${result.additionalDelay}m` : "0m"}
            </div>
            <div className="text-[11px] text-[var(--nr-text-secondary)] mt-0.5">
              Variance delta
            </div>
          </div>

          <div className="bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md p-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--nr-accent)] mb-1">
              <span>Projected ETA</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold font-mono text-[var(--nr-text)]">{result.newETA}</div>
            <div className="text-[11px] text-[var(--nr-danger)] font-mono mt-0.5">
              Total {result.totalDelay}m late
            </div>
          </div>
        </div>
      </div>

      {/* Mitigation */}
      {result.smartDispatchSolution && (
        <div className="nr-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--nr-success)]" />
              <span className="text-[13px] font-semibold text-[var(--nr-text)]">
                Mitigation Recommendation
              </span>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--nr-success-muted)] text-[var(--nr-success)] border border-[var(--nr-success)]/20">
              ~{result.smartDispatchSolution.mitigatedDelayMinutes}m saved
            </span>
          </div>
          <p className="text-[12px] text-[var(--nr-text-secondary)] leading-relaxed">
            {result.smartDispatchSolution.reroutePlan}
          </p>
        </div>
      )}

      {/* Factors */}
      <div className="nr-card p-4">
        <div className="flex items-center justify-between mb-3 border-b border-[var(--nr-border)] pb-2">
          <h4 className="text-[13px] font-semibold text-[var(--nr-text)]">
            Impact Factors
          </h4>
          <span className="text-[10px] text-[var(--nr-text-muted)] font-mono">
            {result.factors.length} active
          </span>
        </div>

        {result.factors.length === 0 ? (
          <div className="p-3 rounded-md bg-[var(--nr-bg)] border border-[var(--nr-border)] text-[12px] text-[var(--nr-text-muted)] text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--nr-success)]" />
            No adverse factors in this scenario.
          </div>
        ) : (
          <div className="space-y-1.5">
            {result.factors.map((factor, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-md bg-[var(--nr-bg)] border border-[var(--nr-border)] text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      factor.severity === "high"
                        ? "bg-[var(--nr-danger)]"
                        : factor.severity === "medium"
                          ? "bg-[var(--nr-warning)]"
                          : "bg-[var(--nr-accent)]"
                    )}
                  />
                  <span className="font-medium text-[var(--nr-text)]">{factor.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span
                    className={cn(
                      "text-[11px] px-1.5 py-0.5 rounded font-medium",
                      factor.delayImpact > 0
                        ? "text-[var(--nr-danger)] bg-[var(--nr-danger-muted)]"
                        : "text-[var(--nr-success)] bg-[var(--nr-success-muted)]"
                    )}
                  >
                    {factor.delayImpact > 0 ? `+${factor.delayImpact}m` : `${factor.delayImpact}m`}
                  </span>
                  <span className="text-[10px] uppercase text-[var(--nr-text-muted)]">
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

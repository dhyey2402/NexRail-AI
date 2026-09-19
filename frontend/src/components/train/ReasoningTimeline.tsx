import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReasoningStep } from "../../types";

interface ReasoningTimelineProps {
  steps: ReasoningStep[];
}

export default function ReasoningTimeline({ steps }: ReasoningTimelineProps) {
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "positive": return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      case "negative": return <TrendingDown className="w-3 h-3 text-rose-400" />;
      default: return <Minus className="w-3 h-3 text-[var(--nr-text-muted)]" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive": return "border-emerald-500/30 bg-emerald-500/10";
      case "negative": return "border-rose-500/30 bg-rose-500/10";
      default: return "border-[var(--nr-border)] bg-[var(--nr-surface-raised)]";
    }
  };

  return (
    <div className="nr-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--nr-border)]">
        <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Prediction Reasoning</h3>
        <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">Key features influencing this ETA</p>
      </div>

      <div className="p-4">
        <div className="space-y-3.5">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 border border-dashed border-[var(--nr-border)] rounded-md">
              <h4 className="text-[var(--nr-text-secondary)] font-medium text-[12px]">No reasoning data</h4>
              <p className="text-[var(--nr-text-muted)] text-[10px] max-w-[200px] text-center mt-1">
                The model did not return reasoning factors for this prediction.
              </p>
            </div>
          ) : (
            steps.map((step, i) => (
              <div key={i} className="relative flex gap-3">
                {i < steps.length - 1 && (
                  <div className="absolute left-[11px] top-6 w-px h-[calc(100%-4px)] bg-[var(--nr-border)]" />
                )}

                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                  getImpactColor(step.impact)
                )}>
                  {getImpactIcon(step.impact)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[12px] font-medium text-[var(--nr-text)]">{step.factor}</h4>
                    <span className="text-[10px] text-[var(--nr-text-muted)] font-mono shrink-0">
                      {(step.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--nr-text-secondary)] mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-[var(--nr-border)] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          step.impact === "positive" ? "bg-emerald-500" :
                          step.impact === "negative" ? "bg-rose-500" : "bg-[var(--nr-text-muted)]"
                        )}
                        style={{ width: `${step.weight * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

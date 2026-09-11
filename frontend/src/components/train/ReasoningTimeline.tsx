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
      default: return <Minus className="w-3 h-3 text-zinc-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive": return "border-emerald-500/30 bg-emerald-500/10";
      case "negative": return "border-rose-500/30 bg-rose-500/10";
      default: return "border-zinc-700 bg-zinc-800/40";
    }
  };

  return (
    <div className="app-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
        <h3 className="text-xs font-semibold text-zinc-100">Prediction Reasoning Factors</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">Key features influencing this ETA inference</p>
      </div>

      <div className="p-5">
        <div className="space-y-4">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 border border-zinc-800 border-dashed rounded-xl bg-zinc-900/30">
              <h4 className="text-zinc-300 font-medium text-xs">Explainability unavailable</h4>
              <p className="text-zinc-500 text-[10px] max-w-[200px] text-center mt-1">
                The model did not return reasoning factors for this prediction.
              </p>
            </div>
          ) : (
            steps.map((step, i) => (
              <div key={i} className="relative flex gap-3">
                {/* Timeline line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[11px] top-6 w-[1px] h-[calc(100%-4px)] bg-zinc-800" />
              )}

              {/* Icon */}
              <div className={cn(
                "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                getImpactColor(step.impact)
              )}>
                {getImpactIcon(step.impact)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-medium text-zinc-200">{step.factor}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    weight: {(step.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
                {/* Weight bar */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        step.impact === "positive" ? "bg-emerald-500" :
                        step.impact === "negative" ? "bg-rose-500" : "bg-zinc-600"
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

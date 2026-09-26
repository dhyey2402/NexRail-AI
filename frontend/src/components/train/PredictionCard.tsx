import { cn, getStatusBg, formatDelay } from "../../lib/utils";
import {
  MapPin,
  ArrowRight,
  Clock,
  Gauge,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import type { Prediction } from "../../types";

interface PredictionCardProps {
  prediction: Prediction;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  return (
    <div className="nr-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--nr-border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-mono font-bold bg-[var(--nr-surface-raised)] text-[var(--nr-text)] px-2 py-0.5 rounded border border-[var(--nr-border)]">
            #{prediction.trainNumber}
          </span>
          <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">
            {prediction.trainName}
          </h3>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border",
            prediction.currentDelay === 0
              ? getStatusBg("on-time")
              : prediction.currentDelay < 15
                ? getStatusBg("slight-delay")
                : prediction.currentDelay < 45
                  ? getStatusBg("delayed")
                  : getStatusBg("severe-delay")
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {prediction.operationalStatus}
        </span>
      </div>

      {/* Degraded State Warning for Mid-Journey Static Model Predictions */}
      {prediction.isValidForLiveJourney === false && (
        <div className="bg-amber-950/50 border-b border-amber-800/60 px-4 py-2.5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-[11px] text-amber-200/90 leading-relaxed">
            <span className="font-semibold text-amber-300">Degraded Forecast Notice: </span>
            {prediction.invalidReason || "Train is midway through its journey. Current model is trained on origin-to-destination journeys and cannot produce reliable live mid-journey forecasts without dynamic checkpoint telemetry."}
          </div>
        </div>
      )}

      {/* Station Route */}
      <div className="px-4 py-3.5 border-b border-[var(--nr-border)]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center shrink-0 text-[var(--nr-accent)]">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--nr-text-muted)] uppercase tracking-wider">Current</p>
              <p className="text-[12px] font-semibold text-[var(--nr-text)]">{prediction.currentStation}</p>
              <p className="text-[10px] font-mono text-[var(--nr-text-secondary)]">{prediction.currentStationCode}</p>
            </div>
          </div>

          <div className="hidden sm:flex flex-1 items-center justify-center px-4">
            <div className="w-full relative flex items-center">
              <div className="h-px w-full bg-[var(--nr-border)]" />
              <div className="h-px w-2/3 bg-[var(--nr-accent)]/50 absolute left-0" />
              <ArrowRight className="w-3.5 h-3.5 text-[var(--nr-accent)] ml-1 shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center shrink-0 text-[var(--nr-success)]">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--nr-text-muted)] uppercase tracking-wider">Next</p>
              <p className="text-[12px] font-semibold text-[var(--nr-text)]">{prediction.nextStation}</p>
              <p className="text-[10px] font-mono text-[var(--nr-success)]">{prediction.nextStationCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--nr-border)]/60">
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[var(--nr-text-secondary)] text-[11px] mb-1">
            <Clock className="w-3 h-3 text-[var(--nr-warning)]" />
            <span>Current Delay</span>
          </div>
          <p className={cn(
            "text-lg font-bold font-mono",
            prediction.currentDelay === 0 ? "text-emerald-400" : "text-amber-400"
          )}>
            {formatDelay(prediction.currentDelay)}
          </p>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[var(--nr-text-secondary)] text-[11px] mb-1">
            <Clock className="w-3 h-3 text-[var(--nr-accent)]" />
            <span>Predicted ETA</span>
          </div>
          <p className="text-lg font-bold text-[var(--nr-text)] font-mono">
            {prediction.predictedETA}
          </p>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[var(--nr-text-secondary)] text-[11px] mb-1">
            <AlertCircle className="w-3 h-3 text-[var(--nr-danger)]" />
            <span>Destination Delay</span>
          </div>
          <p className={cn(
            "text-lg font-bold font-mono",
            prediction.predictedDelay <= 0 ? "text-emerald-400" :
            prediction.predictedDelay < 15 ? "text-amber-400" : "text-rose-400"
          )}>
            {formatDelay(prediction.predictedDelay)}
          </p>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[var(--nr-text-secondary)] text-[11px] mb-1">
            <Gauge className="w-3 h-3 text-[var(--nr-success)]" />
            <span>Confidence</span>
          </div>
          <p className={cn(
            "text-lg font-bold font-mono",
            prediction.confidenceScore >= 90 ? "text-emerald-400" :
            prediction.confidenceScore >= 75 ? "text-amber-400" : "text-rose-400"
          )}>
            {prediction.confidenceScore.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Dispatch Advisory */}
      {prediction.aiDispatchRecommendation && (
        <div className="p-3.5 border-t border-[var(--nr-border)] flex items-start gap-2.5">
          <Lightbulb className="w-3.5 h-3.5 text-[var(--nr-accent)] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-medium text-[var(--nr-text)]">
                {prediction.aiDispatchRecommendation.action}
              </span>
              <span className="text-[10px] font-mono text-[var(--nr-success)]">
                Save ~{prediction.aiDispatchRecommendation.expectedSavingMinutes}m
              </span>
            </div>
            <p className="text-[12px] text-[var(--nr-text-secondary)] leading-relaxed">
              {prediction.aiDispatchRecommendation.rationale}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

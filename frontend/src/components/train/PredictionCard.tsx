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
    <div className="app-card overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700/60">
            #{prediction.trainNumber}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              {prediction.trainName}
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              LightGBM Inference Feed · Auto-Interlocking
            </p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border",
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

      {/* Station Corridor Timeline Route */}
      <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Current Station */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0 text-sky-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Current Station</p>
              <p className="text-xs font-semibold text-zinc-100">{prediction.currentStation}</p>
              <p className="text-[10px] font-mono text-zinc-400 font-medium">{prediction.currentStationCode}</p>
            </div>
          </div>

          {/* Clean Track Segment */}
          <div className="hidden sm:flex flex-1 items-center justify-center px-4">
            <div className="w-full relative flex items-center">
              <div className="h-0.5 w-full bg-zinc-800" />
              <div className="h-0.5 w-2/3 bg-sky-500/70" />
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 ml-1 shrink-0" />
            </div>
          </div>

          {/* Next Station Target */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0 text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Next Target Station</p>
              <p className="text-xs font-semibold text-zinc-100">{prediction.nextStation}</p>
              <p className="text-[10px] font-mono text-emerald-400 font-medium">{prediction.nextStationCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-zinc-800/60 bg-zinc-900/20">
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
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
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Predicted ETA</span>
          </div>
          <p className="text-lg font-bold text-zinc-100 font-mono">
            {prediction.predictedETA}
          </p>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Predicted Destination Delay</span>
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
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Model Confidence</span>
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

      {/* AI Dispatch Advisory Banner */}
      {prediction.aiDispatchRecommendation && (
        <div className="p-3.5 bg-zinc-900/60 border-t border-zinc-800/80 flex items-start gap-3">
          <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5 text-sky-400">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-medium">
                Dispatch Advisory
              </span>
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {prediction.aiDispatchRecommendation.action}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium ml-auto">
                Save ~{prediction.aiDispatchRecommendation.expectedSavingMinutes}m
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {prediction.aiDispatchRecommendation.rationale}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

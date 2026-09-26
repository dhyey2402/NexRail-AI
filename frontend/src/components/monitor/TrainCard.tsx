import { cn, getStatusBg, getStatusLabel, formatDelay } from "../../lib/utils";
import {
  ArrowRight,
  Train as TrainIcon,
  Gauge,
  Clock,
  Radio,
  MapPin,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { Train } from "../../types";

interface TrainCardProps {
  train: Train;
  isSelected?: boolean;
}

export default function TrainCard({ train, isSelected = false }: TrainCardProps) {
  const getSignalVisual = (aspect: Train["signalAspect"]) => {
    switch (aspect) {
      case "green":
        return (
          <span
            className="flex items-center gap-1 text-[10px] font-mono text-emerald-400"
            title="Signal Aspect: Clear (Green)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            CLEAR
          </span>
        );
      case "double-yellow":
        return (
          <span
            className="flex items-center gap-1 text-[10px] font-mono text-amber-300"
            title="Signal Aspect: Attention (Double Yellow)"
          >
            <span className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.6)]" />
            ATTN
          </span>
        );
      case "yellow":
        return (
          <span
            className="flex items-center gap-1 text-[10px] font-mono text-amber-500"
            title="Signal Aspect: Caution (Yellow)"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            CAUTION
          </span>
        );
      case "red":
        return (
          <span
            className="flex items-center gap-1 text-[10px] font-mono text-rose-500"
            title="Signal Aspect: Danger (Red)"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)] animate-pulse" />
            STOP
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            NORM
          </span>
        );
    }
  };

  const isGeoLive = train.isLiveLocationValid || train.geoStatus === "LIVE";

  return (
    <div
      className={cn(
        "nr-card-interactive p-3 flex flex-col justify-between h-full transition-all relative overflow-hidden group",
        isSelected
          ? "border-[var(--nr-accent)] ring-1 ring-[var(--nr-accent)]/40 bg-[var(--nr-surface-raised)]"
          : "hover:border-[var(--nr-border-strong)]"
      )}
    >
      {/* Top Banner: Train Number, Signal Aspect & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[var(--nr-bg-subtle)] border border-[var(--nr-border)] flex items-center justify-center shrink-0 text-[var(--nr-accent)] group-hover:border-[var(--nr-accent)]/30 transition-colors">
              <TrainIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[12px] font-bold text-[var(--nr-accent)]">
                  #{train.trainNumber}
                </span>
                {train.zone && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--nr-bg-subtle)] text-[var(--nr-text-secondary)] border border-[var(--nr-border)] font-semibold">
                    {train.zone}
                  </span>
                )}
              </div>
              <h4 className="text-[12px] font-semibold text-[var(--nr-text)] truncate max-w-[150px]">
                {train.trainName}
              </h4>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize",
                getStatusBg(train.status)
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {getStatusLabel(train.status)}
            </span>
            {getSignalVisual(train.signalAspect)}
          </div>
        </div>

        {/* Route Progression Strip */}
        <div className="bg-[var(--nr-bg-subtle)] rounded-md p-2 border border-[var(--nr-border)] mb-2 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-[var(--nr-text-muted)]" />
              <span className="text-[var(--nr-text)] font-bold">
                {train.currentStationCode || train.currentStation}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[var(--nr-text-muted)]">
              <span className="text-[9px]">EN ROUTE</span>
              <ArrowRight className="w-3 h-3 text-[var(--nr-accent)]" />
            </div>
            <span className="text-[var(--nr-text-secondary)] font-semibold">
              {train.nextStationCode || train.nextStation}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--nr-text-muted)] pt-0.5 border-t border-[var(--nr-border)]/50">
            <span className="truncate max-w-[130px]">
              {train.blockOccupancy || "SEC-MAINLINE"}
            </span>
            <span className="text-[var(--nr-text-secondary)]">
              {train.locoType?.split(" ")[0] || train.trainType || "Express"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Metrics Strip */}
      <div className="pt-2 border-t border-[var(--nr-border)]/70 space-y-1.5 font-mono text-[10px]">
        <div className="grid grid-cols-3 gap-1">
          {/* Speed */}
          <div className="bg-[var(--nr-surface)] p-1 rounded border border-[var(--nr-border)]/60">
            <div className="text-[var(--nr-text-muted)] text-[8.5px] uppercase flex items-center gap-0.5">
              <Gauge className="w-2.5 h-2.5 text-[var(--nr-accent)]" /> Speed
            </div>
            <div className="text-[var(--nr-text)] font-bold text-[11px] mt-0.5">
              {train.speed} <span className="text-[9px] text-[var(--nr-text-muted)] font-normal">km/h</span>
            </div>
          </div>

          {/* Delay */}
          <div className="bg-[var(--nr-surface)] p-1 rounded border border-[var(--nr-border)]/60">
            <div className="text-[var(--nr-text-muted)] text-[8.5px] uppercase flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 text-[var(--nr-warning)]" /> Delay
            </div>
            <div
              className={cn(
                "font-bold text-[11px] mt-0.5",
                train.currentDelay === 0
                  ? "text-emerald-400"
                  : train.currentDelay <= 15
                  ? "text-amber-400"
                  : "text-rose-400"
              )}
            >
              {formatDelay(train.currentDelay)}
            </div>
          </div>

          {/* GPS Telemetry Integrity */}
          <div className="bg-[var(--nr-surface)] p-1 rounded border border-[var(--nr-border)]/60">
            <div className="text-[var(--nr-text-muted)] text-[8.5px] uppercase flex items-center gap-0.5">
              <Radio className="w-2.5 h-2.5 text-[var(--nr-accent)]" /> Source
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {isGeoLive ? (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> LIVE GPS
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                  <ShieldAlert className="w-2.5 h-2.5" /> SECTION
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

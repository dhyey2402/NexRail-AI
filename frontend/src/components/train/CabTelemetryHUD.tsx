import { Gauge, Zap, Disc, Radio } from "lucide-react";
import { cn } from "../../lib/utils";

interface CabTelemetryHUDProps {
  speed: number;
  maxSpeed: number;
  throttlePercent: number;
  brakePressure: number;
  signals: ("green" | "double-yellow" | "yellow" | "red")[];
  locoType?: string;
}

export default function CabTelemetryHUD({
  speed,
  maxSpeed,
  throttlePercent,
  brakePressure,
  signals,
  locoType = "WAP-7 (HOG 6000HP)",
}: CabTelemetryHUDProps) {
  const speedRatio = Math.min(1, speed / maxSpeed);

  return (
    <div className="nr-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--nr-border)] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[var(--nr-accent)]" />
          <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">
            Locomotive Telemetry
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] border border-[var(--nr-border)]">
          {locoType}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        {/* Speed */}
        <div className="sm:col-span-2 bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--nr-text-muted)] uppercase tracking-wider mb-0.5">
              Speed
            </div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-[28px] font-bold tracking-tight text-[var(--nr-text)]">
                {speed}
              </span>
              <span className="text-[12px] text-[var(--nr-accent)] font-semibold">km/h</span>
            </div>
            <div className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
              MPS: <span className="text-[var(--nr-text-secondary)] font-mono font-medium">{maxSpeed} km/h</span>
            </div>
          </div>

          {/* Dial */}
          <div className="w-14 h-14 relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[var(--nr-border)]"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--nr-accent)] transition-all duration-500 ease-out"
                strokeDasharray={`${speedRatio * 100}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute font-mono text-[10px] font-semibold text-[var(--nr-text-secondary)]">
              {Math.round(speedRatio * 100)}%
            </div>
          </div>
        </div>

        {/* Throttle & Brake */}
        <div className="space-y-2.5 bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md p-3">
          <div>
            <div className="flex justify-between text-[11px] text-[var(--nr-text-secondary)] mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[var(--nr-warning)]" /> Throttle
              </span>
              <span className="text-[var(--nr-text)] font-mono font-semibold">{throttlePercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--nr-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--nr-accent)] transition-all duration-300"
                style={{ width: `${throttlePercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-[var(--nr-text-secondary)] mb-1">
              <span className="flex items-center gap-1">
                <Disc className="w-3 h-3 text-[var(--nr-success)]" /> Brake
              </span>
              <span className="text-[var(--nr-text)] font-mono font-semibold">{brakePressure.toFixed(1)} bar</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--nr-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--nr-success)]"
                style={{ width: `${(brakePressure / 5.0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Signals */}
        <div className="bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md p-3 flex flex-col justify-between h-full">
          <div className="text-[10px] text-[var(--nr-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Radio className="w-3 h-3 text-[var(--nr-accent)]" /> Signal Lookahead
          </div>

          <div className="flex items-center justify-around py-1.5 bg-[var(--nr-surface)] rounded border border-[var(--nr-border)]">
            {signals.map((aspect, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    aspect === "green"
                      ? "bg-emerald-500"
                      : aspect === "double-yellow"
                        ? "bg-amber-400"
                        : aspect === "yellow"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                  )}
                />
                <span className="text-[9px] font-mono text-[var(--nr-text-muted)]">
                  {idx === 0 ? "Next" : `+${idx}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

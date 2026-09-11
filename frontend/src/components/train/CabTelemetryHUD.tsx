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
    <div className="app-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-zinc-100">
            Cab Driver & Locomotive Telemetry HUD
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
          {locoType}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        {/* Digital Speedometer Gauge */}
        <div className="sm:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">
              Current Speed
            </div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-3xl font-bold tracking-tight text-zinc-100">
                {speed}
              </span>
              <span className="text-xs text-sky-400 font-semibold">km/h</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Section MPS: <span className="text-zinc-300 font-mono font-medium">{maxSpeed} km/h</span>
            </div>
          </div>

          {/* Speed Visual Dial */}
          <div className="w-16 h-16 relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-sky-400 transition-all duration-500 ease-out"
                strokeDasharray={`${speedRatio * 100}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute font-mono text-[10px] font-semibold text-zinc-300">
              {Math.round(speedRatio * 100)}%
            </div>
          </div>
        </div>

        {/* Throttle & Brake Pressure */}
        <div className="space-y-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3">
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Throttle Notch
              </span>
              <span className="text-zinc-100 font-mono font-semibold">{throttlePercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${throttlePercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span className="flex items-center gap-1">
                <Disc className="w-3 h-3 text-emerald-400" /> BP Pressure
              </span>
              <span className="text-zinc-100 font-mono font-semibold">{brakePressure.toFixed(1)} bar</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(brakePressure / 5.0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Signal Lookahead */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between h-full">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Radio className="w-3 h-3 text-sky-400" /> Signal Lookahead
          </div>

          <div className="flex items-center justify-around py-1 bg-zinc-950 rounded border border-zinc-800/80">
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
                <span className="text-[9px] font-mono text-zinc-500">
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

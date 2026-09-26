import { cn, getStatusBg, getStatusLabel, formatDelay } from "../../lib/utils";
import { ArrowRight, Train as TrainIcon } from "lucide-react";
import type { Train } from "../../types";

interface TrainCardProps {
  train: Train;
}

export default function TrainCard({ train }: TrainCardProps) {
  const getSignalBadge = (aspect: Train["signalAspect"]) => {
    switch (aspect) {
      case "green":
        return <span className="w-2 h-2 rounded-full bg-emerald-500" title="Clear" />;
      case "double-yellow":
        return <span className="w-2 h-2 rounded-full bg-amber-400" title="Attention" />;
      case "yellow":
        return <span className="w-2 h-2 rounded-full bg-amber-500" title="Caution" />;
      case "red":
        return <span className="w-2 h-2 rounded-full bg-rose-500" title="Danger" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-emerald-500" />;
    }
  };

  return (
    <div className="nr-card-interactive p-3 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center shrink-0 text-[var(--nr-text-secondary)]">
              <TrainIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[12px] font-bold text-[var(--nr-accent)]">#{train.trainNumber}</span>
                {getSignalBadge(train.signalAspect)}
              </div>
              <h4 className="text-[12px] font-medium text-[var(--nr-text)] truncate">
                {train.trainName}
              </h4>
            </div>
          </div>

          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0",
              getStatusBg(train.status)
            )}
          >
            {getStatusLabel(train.status)}
          </span>
        </div>

        <div className="bg-[var(--nr-bg)] rounded-md px-2.5 py-1.5 border border-[var(--nr-border)] mb-2 space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--nr-text)] font-semibold">{train.currentStationCode}</span>
            <ArrowRight className="w-3 h-3 text-[var(--nr-text-faint)]" />
            <span className="text-[var(--nr-text-secondary)]">{train.nextStationCode}</span>
          </div>
          <div className="text-[10px] font-mono text-[var(--nr-text-muted)] flex items-center justify-between truncate">
            <span>{train.blockOccupancy || "SEC-MAIN"}</span>
            <span className="text-[var(--nr-text-secondary)]">{train.locoType?.split(" ")[0] || train.trainType || "Mainline"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[var(--nr-border)] font-mono text-[10px]">
        <div>
          <div className="text-[var(--nr-text-muted)] text-[9px] uppercase">Speed</div>
          <div className="text-[var(--nr-text)] font-semibold">{train.speed} km/h</div>
        </div>
        <div>
          <div className="text-[var(--nr-text-muted)] text-[9px] uppercase">Delay</div>
          <div className={cn(
            "font-semibold",
            train.currentDelay === 0 ? "text-emerald-400" :
            train.currentDelay < 15 ? "text-amber-400" : "text-rose-400"
          )}>
            {formatDelay(train.currentDelay)}
          </div>
        </div>
        <div>
          <div className="text-[var(--nr-text-muted)] text-[9px] uppercase">Zone</div>
          <div className="text-[var(--nr-text-secondary)] font-medium">{train.zone}</div>
        </div>
      </div>
    </div>
  );
}

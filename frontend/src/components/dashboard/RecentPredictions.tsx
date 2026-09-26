import { cn, getStatusBg, getStatusLabel } from "../../lib/utils";

interface RecentPrediction {
  trainNumber: string;
  trainName: string;
  station: string;
  predictedETA: string;
  delay: number;
  confidence: number;
  status: string;
  loco?: string;
}

interface RecentPredictionsProps {
  predictions: RecentPrediction[];
}

export default function RecentPredictions({ predictions }: RecentPredictionsProps) {
  return (
    <div className="nr-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--nr-border)] flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[var(--nr-text)]">
          Recent Predictions
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] border border-[var(--nr-border)]">
          {predictions.length > 0 ? `${predictions.length} records` : "—"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--nr-border)] bg-[var(--nr-surface-raised)]/40 text-[var(--nr-text-muted)] font-medium">
              <th className="px-4 py-2.5">Train</th>
              <th className="px-4 py-2.5">Locomotive</th>
              <th className="px-4 py-2.5">Station</th>
              <th className="px-4 py-2.5">Predicted ETA</th>
              <th className="px-4 py-2.5">Delay</th>
              <th className="px-4 py-2.5">Confidence</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--nr-border)]/60">
            {predictions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--nr-text-muted)] text-[13px]">
                  No recent predictions available.
                </td>
              </tr>
            ) : (
              predictions.map((pred: any, i) => {
                const delayVal = pred.predictedDelay ?? pred.delay;
                const confVal = pred.confidenceScore ?? pred.confidence;
                const stationVal = pred.station || "En Route";
                const statusVal = pred.status || (delayVal != null ? (delayVal === 0 ? "on-time" : delayVal <= 15 ? "slight-delay" : "delayed") : null);

                return (
                  <tr key={i} className="hover:bg-[var(--nr-surface-raised)]/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-semibold text-[var(--nr-accent)]">#{pred.trainNumber}</span>
                        <span className="font-sans text-[var(--nr-text)]">{pred.trainName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-mono bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] px-1.5 py-0.5 rounded text-[var(--nr-text-secondary)]">
                        {pred.loco || "Mainline"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nr-text-secondary)] font-mono text-[11px]">
                      {stationVal}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nr-text)] font-mono font-semibold">
                      {pred.predictedETA}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      <span className={cn(
                        "font-semibold",
                        delayVal == null ? "text-[var(--nr-text-muted)]" :
                        delayVal === 0 ? "text-emerald-400" :
                        delayVal < 15 ? "text-amber-400" : "text-rose-400"
                      )}>
                        {delayVal == null ? "—" : delayVal === 0 ? "On Time" : `+${delayVal}m`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 font-mono">
                        <div className="w-12 h-1 rounded-full bg-[var(--nr-surface-raised)] overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              confVal != null && confVal >= 90 ? "bg-emerald-500" :
                              confVal != null && confVal >= 75 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${confVal ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--nr-text-muted)]">
                          {confVal != null ? `${Number(confVal).toFixed(1)}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize",
                        statusVal && statusVal !== "—" ? getStatusBg(statusVal) : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}>
                        {statusVal && statusVal !== "—" ? getStatusLabel(statusVal) : "Active"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

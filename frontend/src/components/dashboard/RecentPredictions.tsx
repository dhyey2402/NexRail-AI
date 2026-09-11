import { cn, getStatusBg, getStatusLabel } from "../../lib/utils";
import { Activity } from "lucide-react";

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
    <div className="app-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-semibold text-zinc-100">
            Active Prediction Streams
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
          {predictions.length > 0 ? `${predictions.length} active feeds` : "N/A"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-400 font-medium">
              <th className="px-4 py-2.5">Train Service</th>
              <th className="px-4 py-2.5">Locomotive</th>
              <th className="px-4 py-2.5">Current Station</th>
              <th className="px-4 py-2.5">Predicted ETA</th>
              <th className="px-4 py-2.5">Variance</th>
              <th className="px-4 py-2.5">Confidence</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {predictions.map((pred, i) => (
              <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">#{pred.trainNumber}</span>
                    <span className="font-sans font-medium text-zinc-200">{pred.trainName}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[10px] bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.2 rounded text-zinc-300">
                    {pred.loco || "WAP-7"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-zinc-300 font-sans">
                  {pred.station}
                </td>
                <td className="px-4 py-2.5 text-zinc-200 font-semibold">
                  {pred.predictedETA}
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn(
                    "font-semibold",
                    pred.delay == null ? "text-zinc-500" :
                    pred.delay === 0 ? "text-emerald-400" :
                    pred.delay < 15 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {pred.delay == null ? "N/A" : pred.delay === 0 ? "On Time" : `+${pred.delay}m`}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pred.confidence != null && pred.confidence >= 90 ? "bg-emerald-500" :
                          pred.confidence != null && pred.confidence >= 75 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${pred.confidence ?? 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {pred.confidence != null ? `${pred.confidence.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium border font-sans",
                    pred.status && pred.status !== "—" ? getStatusBg(pred.status) : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}>
                    {pred.status && pred.status !== "—" ? getStatusLabel(pred.status) : "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import DelayDistribution from "../components/analytics/DelayDistribution";
import ConfidenceChart from "../components/analytics/ConfidenceChart";
import TopDelayedTrains from "../components/analytics/TopDelayedTrains";
import DelayByZone from "../components/analytics/DelayByZone";
import ETATrendChart from "../components/analytics/ETATrendChart";
import { getAnalytics } from "../services/api";
import type { AnalyticsData } from "../types";

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const analytics = await getAnalytics(timeRange);
        setData(analytics);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [timeRange]);

  return (
    <div className="space-y-4">
      {/* Time Range */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--nr-text-muted)] font-medium">Historical Window:</span>
        </div>
        <div className="bg-[var(--nr-surface)] p-0.5 rounded-md border border-[var(--nr-border)] flex items-center gap-0.5">
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                timeRange === range
                  ? "bg-[var(--nr-accent-muted)] text-[var(--nr-accent)] font-semibold"
                  : "text-[var(--nr-text-muted)] hover:text-[var(--nr-text)]"
              }`}
            >
              {range === "24h" ? "24h" : range === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 nr-card" />
          ))}
        </div>
      ) : data.delayDistribution.length === 0 && data.predictionConfidence.length === 0 ? (
        <div className="p-10 border border-dashed border-[var(--nr-border)] rounded-md flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] rounded-md flex items-center justify-center mb-3">
            <Activity className="w-4 h-4 text-[var(--nr-text-muted)]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Analytics Unavailable</h3>
          <p className="text-[12px] text-[var(--nr-text-muted)] mt-1 max-w-sm">
            Analytics will appear after sufficient validated prediction history is collected in the selected time range ({timeRange}).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DelayDistribution data={data.delayDistribution} />
            <ConfidenceChart data={data.predictionConfidence} />
          </div>

          <ETATrendChart data={data.etaTrend} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopDelayedTrains data={data.topDelayedTrains} />
            <DelayByZone data={data.delayByZone} />
          </div>
        </div>
      )}
    </div>
  );
}

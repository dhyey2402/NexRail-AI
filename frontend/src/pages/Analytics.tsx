import { useState, useEffect } from "react";
import { BarChart3, Activity } from "lucide-react";
import DelayDistribution from "../components/analytics/DelayDistribution";
import ConfidenceChart from "../components/analytics/ConfidenceChart";
import TopDelayedTrains from "../components/analytics/TopDelayedTrains";
import DelayByZone from "../components/analytics/DelayByZone";
import ETATrendChart from "../components/analytics/ETATrendChart";
import { getAnalytics } from "../services/api";
import type { AnalyticsData } from "../types";
import { cn } from "../lib/utils";

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
      {/* ── Operational Analytics Banner & Controls ──────────── */}
      <div className="nr-card p-3.5 bg-[var(--nr-surface-glass)] backdrop-blur border border-[var(--nr-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center shrink-0 text-[var(--nr-accent)]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--nr-text)] tracking-tight">
              Network Bottlenecks & Operational Analytics
            </h2>
            <p className="text-[11px] text-[var(--nr-text-muted)]">
              Historical delay distribution, corridor punctuality, and rolling ML confidence
            </p>
          </div>
        </div>

        {/* Time Window Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--nr-text-muted)] font-mono">Window:</span>
          <div className="bg-[var(--nr-bg-subtle)] p-0.5 rounded-md border border-[var(--nr-border)] flex items-center gap-0.5">
            {[
              { key: "24h", label: "24 Hours" },
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={cn(
                  "px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                  timeRange === range.key
                    ? "bg-[var(--nr-surface-raised)] text-[var(--nr-text)] font-semibold border border-[var(--nr-border-strong)] shadow-sm"
                    : "text-[var(--nr-text-muted)] hover:text-[var(--nr-text-secondary)]"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 nr-card" />
          ))}
        </div>
      ) : data.delayDistribution.length === 0 && data.predictionConfidence.length === 0 ? (
        <div className="p-12 border border-dashed border-[var(--nr-border)] rounded-md flex flex-col items-center justify-center text-center bg-[var(--nr-surface)]">
          <div className="w-10 h-10 bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] rounded-md flex items-center justify-center mb-3 text-[var(--nr-text-muted)]">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Analytics Engine Calibrating</h3>
          <p className="text-[12px] text-[var(--nr-text-muted)] mt-1 max-w-sm leading-relaxed">
            Historical analytics aggregate once completed journey actuals are logged for the selected time window ({timeRange}).
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

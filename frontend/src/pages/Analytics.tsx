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
        const analytics = await getAnalytics();
        setData(analytics);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [timeRange]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="app-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Fleet Performance & ML Intelligence
            </span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
            Network Analytics & Model Telemetry
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Aggregated operational throughput, corridor delay distribution, and LightGBM accuracy telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 p-1 rounded-lg border border-zinc-800 flex items-center gap-1">
            <button
              onClick={() => setTimeRange("24h")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === "24h"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === "7d"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === "30d"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-zinc-900/60 rounded-xl border border-zinc-800" />
          ))}
        </div>
      ) : data.delayDistribution.length === 0 && data.predictionConfidence.length === 0 ? (
        <div className="p-10 border border-zinc-800 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-zinc-600" />
          </div>
          <h3 className="text-zinc-200 font-medium">No analytics available yet.</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm">
            Analytics require a critical mass of operational history. Telemetry data is currently insufficient for modeling.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 2-column grid for top 2 charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DelayDistribution data={data.delayDistribution} />
            <ConfidenceChart data={data.predictionConfidence} />
          </div>

          {/* Full width 24-hour network delay trend */}
          <ETATrendChart data={data.etaTrend} />

          {/* 2-column grid for bottom 2 charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TopDelayedTrains data={data.topDelayedTrains} />
            <DelayByZone data={data.delayByZone} />
          </div>
        </div>
      )}
    </div>
  );
}

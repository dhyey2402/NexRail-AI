import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Train as TrainIcon,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Percent,
  Clock,
  ArrowRight,
  Search,
  FlaskConical,
  Radio,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentPredictions from "../components/dashboard/RecentPredictions";
import { getDashboardStats, getRecentPredictions } from "../services/api";
import type { DashboardStats } from "../types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, recentData] = await Promise.all([
          getDashboardStats(),
          getRecentPredictions(),
        ]);
        setStats(statsData);
        setRecent(recentData);
      } catch (err) {
        setError("Failed to load dashboard data. The backend server might be unreachable.");
      }
    }
    loadData();
  }, []);

  if (error) {
    return (
      <div className="space-y-5">
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Operations Command Banner */}
      <div className="app-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Central Operations Control
              </span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Real-Time Train ETA & Dispatch Intelligence
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time LightGBM arrival estimations, sectional throughput telemetry, and predictive contingency simulations across high-density rail corridors.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              Predict Train ETA
            </Link>
            <Link
              to="/simulate"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              What-If Simulator
            </Link>
          </div>
        </div>
      </div>

      {/* Prioritized Operational KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Core Operational Priorities (Tier 1) */}
        <StatCard
          title="Model Accuracy"
          value={stats && stats.avgAccuracy != null ? `${stats.avgAccuracy}%` : "N/A"}
          subtitle="±5 min tolerance"
          icon={Percent}
          isPrimary={true}
        />
        <StatCard
          title="On-Time Punctuality"
          value={stats && stats.onTimeTrains != null ? `${stats.onTimeTrains}` : "N/A"}
          subtitle="76.1% on schedule"
          icon={CheckCircle2}
          trend={{ value: 2.4, label: "efficiency" }}
          isPrimary={true}
        />
        <StatCard
          title="Delayed Services"
          value={stats?.delayedTrains ?? "N/A"}
          subtitle=">15 min variance"
          icon={AlertTriangle}
          trend={{ value: -3.8, label: "reduction" }}
          isPrimary={true}
        />
        <StatCard
          title="Avg Network Delay"
          value={stats && stats.avgDelay != null ? `${stats.avgDelay}m` : "N/A"}
          subtitle="Corridor average"
          icon={Clock}
          isPrimary={true}
        />

        {/* Fleet Volume & Feeds (Tier 2) */}
        <StatCard
          title="Monitored Fleet"
          value={stats?.totalTrains ?? "N/A"}
          subtitle="Active on track lines"
          icon={TrainIcon}
          trend={{ value: 4.2, label: "volume" }}
        />
        <StatCard
          title="Active Feeds"
          value={stats?.activePredictions ?? "N/A"}
          subtitle="Live telemetry streams"
          icon={Activity}
        />
      </div>

      {/* Balanced Module Launchpads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          to="/search"
          className="app-card-interactive p-4 flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-sky-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-100 group-hover:text-sky-300 transition-colors">
                Train ETA & Cab Telemetry
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                LightGBM arrival predictions, SHAP feature attribution, and locomotive telemetry HUD.
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-2 border-t border-zinc-800/60 flex items-center text-xs text-zinc-400 group-hover:text-zinc-200">
            <span>Launch telemetry HUD</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        <Link
          to="/simulate"
          className="app-card-interactive p-4 flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-amber-400 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
                What-If Contingency Simulator
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Model weather downpours, track maintenance blocks, and evaluate AI mitigation plans.
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-2 border-t border-zinc-800/60 flex items-center text-xs text-zinc-400 group-hover:text-zinc-200">
            <span>Open simulator</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        <Link
          to="/monitor"
          className="app-card-interactive p-4 flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-emerald-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                Topological Fleet & Corridor Map
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Topological track view showing active train positions, block occupancy, and signals.
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-2 border-t border-zinc-800/60 flex items-center text-xs text-zinc-400 group-hover:text-zinc-200">
            <span>View network map</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* Active Stream Table */}
      <RecentPredictions predictions={recent} />
    </div>
  );
}

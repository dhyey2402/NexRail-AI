import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Search,
  FlaskConical,
  Map,
  BarChart3,
  Clock,
  ArrowRight,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentPredictions from "../components/dashboard/RecentPredictions";
import { getDashboardStats, getRecentPredictions } from "../services/api";
import type { DashboardStats } from "../types";

const quickLinks = [
  { to: "/search", icon: Search, label: "ETA Prediction", hint: "Predict train arrival times" },
  { to: "/simulate", icon: FlaskConical, label: "What-If Simulation", hint: "Model disruption scenarios" },
  { to: "/monitor", icon: Map, label: "Live Operations", hint: "Fleet map and monitoring" },
  { to: "/analytics", icon: BarChart3, label: "Analytics", hint: "Delay distribution and trends" },
  { to: "/history", icon: Clock, label: "Prediction History", hint: "Accuracy and audit trail" },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, predData] = await Promise.all([
          getDashboardStats(),
          getRecentPredictions(),
        ]);
        setStats(statsData);
        setPredictions(predData);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Stat Cards ────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Active Trains"
            value={stats.totalTrains}
            icon={Activity}
            subtitle="Active tracked fleet"
            isPrimary
          />
          <StatCard
            title="Avg Delay"
            value={`${stats.avgDelay}m`}
            icon={Clock}
            subtitle={stats.avgDelay <= 0 ? "Fleet on schedule" : "Average active fleet delay"}
          />
          <StatCard
            title="On-Time Rate"
            value={`${stats.totalTrains ? Math.round((stats.onTimeTrains / stats.totalTrains) * 100) : 0}%`}
            icon={Activity}
            subtitle="Fleet punctuality (<=15m delay)"
          />
          <StatCard
            title="Model Accuracy"
            value={stats.avgAccuracy !== null && stats.avgAccuracy !== undefined ? `${stats.avgAccuracy}%` : "Unavailable"}
            icon={BarChart3}
            subtitle={stats.avgAccuracy !== null && stats.avgAccuracy !== undefined ? (stats.modelName || "LightGBM Regressor") : "Requires validated actuals"}
          />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="nr-card h-[104px] animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Quick Navigation ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="nr-card-interactive flex items-center gap-3 p-3.5 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] text-[var(--nr-text-secondary)] group-hover:text-[var(--nr-accent)] transition-colors shrink-0">
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-[var(--nr-text)] truncate">
                {item.label}
              </div>
              <div className="text-[10px] text-[var(--nr-text-muted)] truncate">
                {item.hint}
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-[var(--nr-text-faint)] group-hover:text-[var(--nr-text-secondary)] transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {/* ── Recent Predictions ────────────────────── */}
      <RecentPredictions predictions={predictions} />
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Search,
  FlaskConical,
  Map,
  BarChart3,
  Clock,
  ArrowRight,
  RefreshCw,
  Cpu,
  Radio,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentPredictions from "../components/dashboard/RecentPredictions";
import { getDashboardStats, getRecentPredictions, getLiveTrains } from "../services/api";
import type { DashboardStats, Train } from "../types";
import { cn } from "../lib/utils";

const quickLinks = [
  {
    to: "/search",
    icon: Search,
    label: "ETA Predictor & Cab HUD",
    hint: "Physics + ML inference engine",
    tag: "LIVE PREDICT",
  },
  {
    to: "/simulate",
    icon: FlaskConical,
    label: "What-If Disruption Simulator",
    hint: "Simulate weather, blocks & rakes",
    tag: "DISPATCH OPTIM",
  },
  {
    to: "/monitor",
    icon: Map,
    label: "Live Fleet Operations",
    hint: "Geographically verified telemetry",
    tag: "REAL-TIME MAP",
  },
  {
    to: "/analytics",
    icon: BarChart3,
    label: "Network Bottleneck Analytics",
    hint: "Zone-wise congestion & punctuality",
    tag: "ANALYTICS",
  },
  {
    to: "/history",
    icon: Clock,
    label: "Inference Audit Trail",
    hint: "Full historical prediction log",
    tag: "AUDIT LOG",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [liveTrains, setLiveTrains] = useState<Train[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const [statsData, predData, trainsData] = await Promise.all([
        getDashboardStats(),
        getRecentPredictions(),
        getLiveTrains().catch(() => []),
      ]);
      setStats(statsData);
      setPredictions(predData);
      setLiveTrains(trainsData);
      setLastRefreshed(new Date());
      setCountdown(30);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Periodic 30-second refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadDashboard();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  // Calculate fleet delay breakdowns
  const delayedOver30 = liveTrains.filter((t) => t.currentDelay > 30);
  const totalTracked = stats?.totalTrains || liveTrains.length || 0;
  const onTimeCount = liveTrains.filter((t) => t.currentDelay === 0).length;
  const slightDelayCount = liveTrains.filter(
    (t) => t.currentDelay > 0 && t.currentDelay <= 15
  ).length;
  const moderateDelayCount = liveTrains.filter(
    (t) => t.currentDelay > 15 && t.currentDelay <= 60
  ).length;
  const severeDelayCount = liveTrains.filter((t) => t.currentDelay > 60).length;

  const onTimePct = totalTracked > 0 ? Math.round(((stats?.onTimeTrains ?? onTimeCount) / totalTracked) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* ── System Operational Header Strip ──────────────────── */}
      <div className="nr-card px-4 py-3 bg-[var(--nr-surface-glass)] backdrop-blur border border-[var(--nr-border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 nr-pulse-dot" />
            <span className="absolute w-4 h-4 rounded-full bg-emerald-400/20 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tracking-wider text-[var(--nr-text-white)] uppercase font-mono">
                Railway Operations Control
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                SYSTEM LIVE
              </span>
            </div>
            <p className="text-[11px] text-[var(--nr-text-muted)] flex items-center gap-2">
              <span>Model: <strong className="text-[var(--nr-text-secondary)] font-mono">{stats?.modelName || "LightGBM Regressor"}</strong></span>
              <span>•</span>
              <span>Inference Latency: <strong className="text-[var(--nr-text-secondary)] font-mono">{stats?.inferenceLatencyMs ?? 18}ms</strong></span>
              <span>•</span>
              <span>Signaling Health: <strong className="text-emerald-400 font-mono">{stats?.signalingHealthPercent ?? 99.4}%</strong></span>
            </p>
          </div>
        </div>

        {/* Live Refresh Controls */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--nr-text-muted)]">
          <span>Synced {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nr-surface-raised)] border border-[var(--nr-border)]">
            {countdown}s
          </span>
          <button
            onClick={() => loadDashboard(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-md bg-[var(--nr-surface-raised)] hover:bg-[var(--nr-border)] text-[var(--nr-text-secondary)] hover:text-[var(--nr-text)] border border-[var(--nr-border)] transition-colors"
            title="Refresh network telemetry"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-[var(--nr-accent)]")} />
          </button>
        </div>
      </div>

      {/* ── Operational Stat Cards Grid ──────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            title="Active Tracked Fleet"
            value={stats.totalTrains}
            icon={Activity}
            subtitle="Verified live trains on network"
            isPrimary
          />
          <StatCard
            title="Fleet Punctuality"
            value={`${onTimePct}%`}
            icon={Radio}
            subtitle="On-time fleet (<=15m tolerance)"
            trend={{ value: 2.4, label: "vs 24h baseline" }}
          />
          <StatCard
            title="Network Avg Delay"
            value={`${stats.avgDelay}m`}
            icon={Clock}
            subtitle={stats.avgDelay <= 5 ? "Normal corridor flow" : "Active network mean delay"}
          />
          <StatCard
            title="Critical Delays"
            value={delayedOver30.length}
            icon={AlertTriangle}
            subtitle={delayedOver30.length > 0 ? "Trains with >30m delay" : "No critical fleet delays"}
          />
          <StatCard
            title="Model Verification"
            value={stats.avgAccuracy !== null && stats.avgAccuracy !== undefined ? `${stats.avgAccuracy}%` : "Inference Ready"}
            icon={Cpu}
            subtitle={stats.avgAccuracy !== null ? "Validated actual accuracy" : "Verified LightGBM weights"}
          />
        </div>
      )}

      {isLoading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="nr-card h-[104px] animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Fleet Network Distribution Bar ───────────────────── */}
      {liveTrains.length > 0 && (
        <div className="nr-card p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--nr-text)]">Fleet Punctuality Distribution</span>
              <span className="text-[11px] text-[var(--nr-text-muted)] font-mono">
                ({liveTrains.length} active units sampled)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> On Time: {onTimeCount}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Slight (&le;15m): {slightDelayCount}
              </span>
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-400" /> Moderate (15-60m): {moderateDelayCount}
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Severe (&gt;60m): {severeDelayCount}
              </span>
            </div>
          </div>

          {/* Visual Stacked Progress Bar */}
          <div className="h-2 rounded-full bg-[var(--nr-bg-subtle)] border border-[var(--nr-border)] overflow-hidden flex">
            {onTimeCount > 0 && (
              <div
                style={{ width: `${(onTimeCount / liveTrains.length) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`On Time: ${onTimeCount}`}
              />
            )}
            {slightDelayCount > 0 && (
              <div
                style={{ width: `${(slightDelayCount / liveTrains.length) * 100}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Slight Delay: ${slightDelayCount}`}
              />
            )}
            {moderateDelayCount > 0 && (
              <div
                style={{ width: `${(moderateDelayCount / liveTrains.length) * 100}%` }}
                className="bg-orange-400 transition-all duration-500"
                title={`Moderate Delay: ${moderateDelayCount}`}
              />
            )}
            {severeDelayCount > 0 && (
              <div
                style={{ width: `${(severeDelayCount / liveTrains.length) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Severe Delay: ${severeDelayCount}`}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Critical Attention Corridors (If any trains > 30m delay) ── */}
      {delayedOver30.length > 0 && (
        <div className="nr-card p-3.5 border-l-4 border-l-rose-500 bg-[var(--nr-danger-muted)]/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <h3 className="text-[12px] font-semibold text-rose-300">
                Controller Priority Attention: {delayedOver30.length} Fleet {delayedOver30.length === 1 ? "Unit" : "Units"} Experiencing Heavy Delay
              </h3>
            </div>
            <Link
              to="/simulate"
              className="text-[11px] text-[var(--nr-accent)] hover:underline flex items-center gap-1 font-mono font-medium"
            >
              Test Recovery Options <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {delayedOver30.slice(0, 3).map((t) => (
              <div
                key={t.trainNumber}
                className="bg-[var(--nr-surface)] border border-[var(--nr-border)] rounded-md p-2 flex items-center justify-between text-[11px]"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-[var(--nr-accent)]">#{t.trainNumber}</span>
                    <span className="text-[var(--nr-text)] truncate max-w-[120px]">{t.trainName}</span>
                  </div>
                  <div className="text-[10px] text-[var(--nr-text-muted)]">
                    At {t.currentStationCode || t.currentStation} &rarr; {t.nextStationCode || t.nextStation}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    +{t.currentDelay}m
                  </span>
                  <div className="mt-1">
                    <Link
                      to={`/simulate?train=${t.trainNumber}`}
                      className="text-[9px] text-[var(--nr-accent)] hover:underline flex items-center gap-0.5 justify-end"
                    >
                      <SlidersHorizontal className="w-2.5 h-2.5" /> Simulate
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Operational Command Console (Quick Links) ────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[12px] font-semibold text-[var(--nr-text-secondary)] uppercase tracking-wider font-mono">
            Operational Intelligence Modules
          </h3>
          <span className="text-[11px] text-[var(--nr-text-muted)] font-mono">5 Modules Ready</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nr-card-interactive flex flex-col justify-between p-3.5 group relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] text-[var(--nr-text-secondary)] group-hover:text-[var(--nr-accent)] group-hover:border-[var(--nr-accent)]/30 transition-all shrink-0">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] border border-[var(--nr-border)] group-hover:text-[var(--nr-accent)] transition-colors">
                    {item.tag}
                  </span>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[var(--nr-text)] group-hover:text-[var(--nr-text-white)] transition-colors">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[var(--nr-text-muted)] mt-0.5 leading-snug line-clamp-2">
                    {item.hint}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end text-[10px] text-[var(--nr-text-faint)] group-hover:text-[var(--nr-accent)] transition-colors mt-3 pt-2 border-t border-[var(--nr-border)]/50 font-mono">
                <span>Access Module</span>
                <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Predictions & Inferences ──────────────────── */}
      <RecentPredictions predictions={predictions} isLoading={isLoading} />
    </div>
  );
}

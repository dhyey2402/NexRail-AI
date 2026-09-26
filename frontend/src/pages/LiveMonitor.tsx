import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  ExternalLink,
  MapPin,
  Clock,
  Layers,
} from "lucide-react";
import TrainCard from "../components/monitor/TrainCard";
import TrainMap from "../components/monitor/TrainMap";
import { getLiveTrains } from "../services/api";
import type { Train } from "../types";
import { cn, formatDelay } from "../lib/utils";

export default function LiveMonitor() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string>("12301");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadTrains = async () => {
    setIsRefreshing(true);
    try {
      const data = await getLiveTrains();
      setTrains(data);
      setLastRefreshed(new Date());
      if (data.length > 0 && !data.some((t) => t.trainNumber === selectedTrainNumber)) {
        setSelectedTrainNumber(data[0].trainNumber);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrains();
    const interval = setInterval(loadTrains, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTrains = trains.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      t.trainNumber.toLowerCase().includes(q) ||
      t.trainName.toLowerCase().includes(q) ||
      (t.source && t.source.toLowerCase().includes(q)) ||
      (t.destination && t.destination.toLowerCase().includes(q)) ||
      (t.currentStation && t.currentStation.toLowerCase().includes(q)) ||
      (t.currentStationCode && t.currentStationCode.toLowerCase().includes(q)) ||
      (t.nextStation && t.nextStation.toLowerCase().includes(q)) ||
      (t.nextStationCode && t.nextStationCode.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "on-time"
        ? t.status === "on-time"
        : statusFilter === "delayed"
        ? t.status === "delayed" || t.status === "slight-delay"
        : statusFilter === "severe"
        ? t.status === "severe-delay"
        : true;

    const matchesZone = zoneFilter === "all" ? true : t.zone === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
  });

  const zones = Array.from(new Set(trains.map((t) => t.zone).filter(Boolean)));
  const selectedTrain = trains.find((t) => t.trainNumber === selectedTrainNumber);

  return (
    <div className="space-y-4">
      {/* ── Operational Control Toolbar ────────────────────── */}
      <div className="nr-card p-3.5 bg-[var(--nr-surface-glass)] backdrop-blur border border-[var(--nr-border)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--nr-text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search train #, station, or corridor..."
            className="w-full bg-[var(--nr-bg-subtle)] border border-[var(--nr-border)] rounded-md pl-8 pr-3 py-1.5 text-[12px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] transition-colors font-mono"
          />
        </div>

        {/* Filter Controls & Sync */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Control */}
          <div className="bg-[var(--nr-bg-subtle)] p-0.5 rounded-md border border-[var(--nr-border)] flex items-center gap-0.5">
            {[
              { key: "all", label: `All (${trains.length})` },
              { key: "on-time", label: "On Time" },
              { key: "delayed", label: "Delayed" },
              { key: "severe", label: "Severe" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setStatusFilter(btn.key)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  statusFilter === btn.key
                    ? "bg-[var(--nr-surface-raised)] text-[var(--nr-accent)] font-semibold border border-[var(--nr-border-strong)] shadow-sm"
                    : "text-[var(--nr-text-muted)] hover:text-[var(--nr-text-secondary)]"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Zone Selector */}
          <div className="relative flex items-center">
            <Layers className="w-3 h-3 text-[var(--nr-text-muted)] absolute left-2.5 pointer-events-none" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-[var(--nr-bg-subtle)] border border-[var(--nr-border)] rounded-md pl-7 pr-3 py-1 text-[11px] font-mono text-[var(--nr-text-secondary)] outline-none cursor-pointer focus:border-[var(--nr-accent)] transition-colors"
            >
              <option value="all">All Zones ({zones.length})</option>
              {zones.map((z) => (
                <option key={z || "unknown"} value={z || ""}>
                  Zone: {z}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <div className="flex items-center gap-1.5 pl-1 text-[10px] font-mono text-[var(--nr-text-muted)] border-l border-[var(--nr-border)]">
            <span className="hidden sm:inline">
              Synced {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              onClick={loadTrains}
              disabled={isRefreshing}
              className="p-1.5 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] text-[var(--nr-text-muted)] hover:text-[var(--nr-text)] transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-[var(--nr-accent)]")}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Inspector Strip for Selected Train ─────────── */}
      {selectedTrain && (
        <div className="nr-card px-4 py-2.5 bg-[var(--nr-surface)] border border-[var(--nr-border-strong)] flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-[var(--nr-accent-muted)] text-[var(--nr-accent)] font-bold text-[12px] border border-[var(--nr-accent)]/30">
                ACTIVE SELECTION: #{selectedTrain.trainNumber}
              </span>
              <span className="text-[12px] font-semibold text-[var(--nr-text)]">
                {selectedTrain.trainName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--nr-text-secondary)]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[var(--nr-text-muted)]" />
                {selectedTrain.currentStationCode || selectedTrain.currentStation} &rarr; {selectedTrain.nextStationCode || selectedTrain.nextStation}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[var(--nr-warning)]" />
                Delay:{" "}
                <strong className={selectedTrain.currentDelay > 15 ? "text-rose-400" : "text-emerald-400"}>
                  {formatDelay(selectedTrain.currentDelay)}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/search`}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--nr-surface-raised)] hover:bg-[var(--nr-border)] text-[var(--nr-text)] border border-[var(--nr-border)] text-[11px] font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-[var(--nr-accent)]" /> Predict ETA
            </Link>
            <Link
              to={`/simulate?train=${selectedTrain.trainNumber}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--nr-accent)] hover:bg-[var(--nr-accent-hover)] text-white text-[11px] font-medium transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" /> Simulate What-If
            </Link>
          </div>
        </div>
      )}

      {/* ── Interactive Network Operations Map ────────────────── */}
      <TrainMap
        trains={filteredTrains}
        selectedTrainNumber={selectedTrainNumber}
        onSelectTrain={(t) => setSelectedTrainNumber(t.trainNumber)}
      />

      {/* ── Fleet Grid ────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-[var(--nr-border)] pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[var(--nr-text)] tracking-tight">
              Active Network Fleet
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[var(--nr-surface-raised)] text-[var(--nr-text-secondary)] border border-[var(--nr-border)]">
              {filteredTrains.length} Units Available
            </span>
          </div>
          <span className="text-[11px] text-[var(--nr-text-muted)] font-mono">
            Click card to focus corridor on live map
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 nr-card" />
            ))}
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="p-10 text-center nr-card text-[12px] text-[var(--nr-text-muted)] border border-dashed border-[var(--nr-border)]">
            <div className="w-10 h-10 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center text-[var(--nr-text-muted)] mx-auto mb-2">
              <Compass className="w-5 h-5" />
            </div>
            <p className="font-semibold text-[var(--nr-text)]">No trains match active filter parameters</p>
            <p className="mt-1">Try selecting "All Zones" or clear your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredTrains.map((train) => (
              <div
                key={train.trainNumber}
                onClick={() => setSelectedTrainNumber(train.trainNumber)}
                className="cursor-pointer"
              >
                <TrainCard
                  train={train}
                  isSelected={selectedTrainNumber === train.trainNumber}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

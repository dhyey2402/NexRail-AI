import { useState, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import TrainCard from "../components/monitor/TrainCard";
import TrainMap from "../components/monitor/TrainMap";
import { getLiveTrains } from "../services/api";
import type { Train } from "../types";

export default function LiveMonitor() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string>("12301");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTrains = async () => {
    setIsRefreshing(true);
    try {
      const data = await getLiveTrains();
      setTrains(data);
      if (data.length > 0 && !data.some(t => t.trainNumber === selectedTrainNumber)) {
        setSelectedTrainNumber(data[0].trainNumber);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrains();
  }, []);

  const filteredTrains = trains.filter((t) => {
    const matchesSearch =
      t.trainNumber.includes(searchQuery) ||
      t.trainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.source && t.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.destination && t.destination.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.currentStation.toLowerCase().includes(searchQuery.toLowerCase());

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

  const zones = Array.from(new Set(trains.map((t) => t.zone)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="nr-card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--nr-text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by train # or station..."
            className="w-full bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md pl-8 pr-3 py-1.5 text-[12px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="bg-[var(--nr-bg)] p-0.5 rounded-md border border-[var(--nr-border)] flex items-center gap-0.5">
            {[
              { key: "all", label: `All (${trains.length})` },
              { key: "on-time", label: "On-Time" },
              { key: "delayed", label: "Delayed" },
              { key: "severe", label: "Severe" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setStatusFilter(btn.key)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === btn.key
                    ? "bg-[var(--nr-accent-muted)] text-[var(--nr-accent)] font-semibold"
                    : "text-[var(--nr-text-muted)] hover:text-[var(--nr-text)]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md px-2.5 py-1 text-[12px] text-[var(--nr-text-secondary)] outline-none cursor-pointer"
          >
            <option value="all">All Zones</option>
            {zones.map((z) => (
              <option key={z || "unknown"} value={z || ""}>
                {z || "Unknown"}
              </option>
            ))}
          </select>

          <button
            onClick={loadTrains}
            disabled={isRefreshing}
            className="p-1.5 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] text-[var(--nr-text-muted)] hover:text-[var(--nr-text)] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[var(--nr-accent)]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Map */}
      <TrainMap
        trains={filteredTrains}
        selectedTrainNumber={selectedTrainNumber}
        onSelectTrain={(t) => setSelectedTrainNumber(t.trainNumber)}
      />

      {/* Fleet Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">
            Active Fleet ({filteredTrains.length})
          </h3>
          <span className="text-[11px] text-[var(--nr-text-muted)]">
            Click to select on map
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 nr-card" />
            ))}
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="p-6 text-center nr-card text-[12px] text-[var(--nr-text-muted)]">
            No trains match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredTrains.map((train) => (
              <div
                key={train.trainNumber}
                onClick={() => setSelectedTrainNumber(train.trainNumber)}
                className={`cursor-pointer transition-all rounded-md ${
                  selectedTrainNumber === train.trainNumber
                    ? "ring-1 ring-[var(--nr-accent)]/60"
                    : ""
                }`}
              >
                <TrainCard train={train} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

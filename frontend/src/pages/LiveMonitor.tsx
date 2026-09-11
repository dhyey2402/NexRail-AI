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
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrains();
  }, []);

  // Filter trains
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
      {/* Top Filter and Search Control Bar */}
      <div className="app-card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter train # or station..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status buttons */}
          <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center gap-0.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({trains.length})
            </button>
            <button
              onClick={() => setStatusFilter("on-time")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === "on-time"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              On-Time
            </button>
            <button
              onClick={() => setStatusFilter("delayed")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === "delayed"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Delayed
            </button>
            <button
              onClick={() => setStatusFilter("severe")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === "severe"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Severe (&gt;45m)
            </button>
          </div>

          {/* Zone Selector */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 outline-none cursor-pointer"
          >
            <option value="all">All Zones</option>
            {zones.map((z) => (
              <option key={z || "unknown"} value={z || ""}>
                Zone {z || "Unknown"}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={loadTrains}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Refresh fleet feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Network Topology Map */}
      <TrainMap
        trains={filteredTrains}
        selectedTrainNumber={selectedTrainNumber}
        onSelectTrain={(t) => setSelectedTrainNumber(t.trainNumber)}
      />

      {/* Train Cards Fleet Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-100">
            Monitored Fleet Stream ({filteredTrains.length} active)
          </h3>
          <span className="text-[11px] text-zinc-500">
            Click any service to inspect on corridor map
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-zinc-900/60 rounded-xl border border-zinc-800" />
            ))}
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-xs text-zinc-500">
            No active trains match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredTrains.map((train) => (
              <div
                key={train.trainNumber}
                onClick={() => setSelectedTrainNumber(train.trainNumber)}
                className={`cursor-pointer transition-all ${
                  selectedTrainNumber === train.trainNumber
                    ? "ring-1 ring-sky-500/80 rounded-xl bg-zinc-900/90"
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

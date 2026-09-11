import { useState } from "react";
import { cn, getStatusBg } from "../../lib/utils";
import {
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { PredictionHistoryItem } from "../../types";

interface PredictionTableProps {
  data: PredictionHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  isLoading: boolean;
}

type SortField = "trainNumber" | "date" | "predictedETA" | "actualDelay" | "confidenceScore" | "accuracy";

export default function PredictionTable({
  data,
  total,
  page,
  pageSize,
  search,
  onPageChange,
  onSearchChange,
  isLoading,
}: PredictionTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    if (sortField === "trainNumber") {
      comparison = a.trainNumber.localeCompare(b.trainNumber);
    } else if (sortField === "date") {
      comparison = a.date.localeCompare(b.date);
    } else if (sortField === "predictedETA") {
      comparison = a.predictedETA.localeCompare(b.predictedETA);
    } else if (sortField === "actualDelay") {
      comparison = (a.actualDelay ?? -1) - (b.actualDelay ?? -1);
    } else if (sortField === "confidenceScore") {
      comparison = (a.confidenceScore ?? 0) - (b.confidenceScore ?? 0);
    } else if (sortField === "accuracy") {
      comparison = (a.accuracy ?? -1) - (b.accuracy ?? -1);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(total / pageSize) || 1;

  const getStatusIcon = (status: string | null) => {
    if (!status) return <XCircle className="w-3 h-3 text-zinc-500" />;
    switch (status) {
      case "accurate":
        return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case "close":
        return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      default:
        return <XCircle className="w-3 h-3 text-rose-400" />;
    }
  };

  return (
    <div className="app-card overflow-hidden">
      {/* Table Controls */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by train name or number..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        <div className="text-[11px] text-zinc-400">
          Showing <span className="text-zinc-200 font-medium">{Math.min(total, (page - 1) * pageSize + 1)}</span> to{" "}
          <span className="text-zinc-200 font-medium">{Math.min(total, page * pageSize)}</span> of{" "}
          <span className="text-zinc-200 font-medium">{total}</span> records
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/20 text-zinc-400 font-medium">
              <th
                onClick={() => handleSort("trainNumber")}
                className="px-4 py-2.5 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  Train
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("date")}
                className="px-4 py-2.5 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("predictedETA")}
                className="px-4 py-2.5 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  Predicted ETA
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-2.5">
                Actual Arrival
              </th>
              <th
                onClick={() => handleSort("actualDelay")}
                className="px-4 py-2.5 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  Delay (Pred / Act)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("confidenceScore")}
                className="px-4 py-2.5 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  Confidence
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("accuracy")}
                className="px-4 py-2.5 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  Accuracy
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-2.5">
                Verdict
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-zinc-500 font-sans">
                  <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin mx-auto mb-2" />
                  Loading historical predictions...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-zinc-500 font-sans">
                  No prediction records match your query.
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sky-400">#{item.trainNumber}</span>
                      <span className="text-zinc-300 font-sans">{item.trainName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{item.date}</td>
                  <td className="px-4 py-3 text-zinc-300 font-semibold">{item.predictedETA}</td>
                  <td className="px-4 py-3 text-zinc-300">{item.actualArrival ?? "N/A"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">+{item.predictedDelay}m</span>
                      <span className="text-zinc-600">/</span>
                      <span
                        className={cn(
                          "font-semibold",
                          item.actualDelay === null
                            ? "text-zinc-500"
                            : item.actualDelay === 0
                              ? "text-emerald-400"
                              : item.actualDelay <= 15
                                ? "text-amber-400"
                                : "text-rose-400"
                        )}
                      >
                        {item.actualDelay !== null ? `+${item.actualDelay}m` : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-300">
                      {(item.confidenceScore ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.accuracy !== null && item.accuracy !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              item.accuracy >= 90
                                ? "bg-emerald-500"
                                : item.accuracy >= 75
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            )}
                            style={{ width: `${item.accuracy}%` }}
                          />
                        </div>
                        <span className="text-zinc-300">{(item.accuracy ?? 0).toFixed(0)}%</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 font-sans text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium border capitalize font-sans",
                        item.status ? getStatusBg(item.status) : "bg-zinc-800/50 text-zinc-400 border-zinc-700"
                      )}
                    >
                      {getStatusIcon(item.status)}
                      {item.status || "N/A"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3.5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
        <div className="text-[11px] text-zinc-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center gap-1 transition-colors"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

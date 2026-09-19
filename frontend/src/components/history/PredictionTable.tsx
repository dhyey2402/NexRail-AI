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
    if (!status) return <XCircle className="w-3 h-3 text-[var(--nr-text-muted)]" />;
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
    <div className="nr-card overflow-hidden">
      {/* Controls */}
      <div className="p-3 border-b border-[var(--nr-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--nr-text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by train name or number..."
            className="w-full bg-[var(--nr-bg)] border border-[var(--nr-border)] rounded-md pl-8 pr-3 py-1.5 text-[12px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] transition-colors"
          />
        </div>

        <div className="text-[11px] text-[var(--nr-text-muted)]">
          <span className="text-[var(--nr-text)] font-medium">{Math.min(total, (page - 1) * pageSize + 1)}</span> to{" "}
          <span className="text-[var(--nr-text)] font-medium">{Math.min(total, page * pageSize)}</span> of{" "}
          <span className="text-[var(--nr-text)] font-medium">{total}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] text-left">
          <thead>
            <tr className="border-b border-[var(--nr-border)] bg-[var(--nr-surface-raised)]/40 text-[var(--nr-text-muted)] font-medium">
              <th
                onClick={() => handleSort("trainNumber")}
                className="px-4 py-2.5 cursor-pointer hover:text-[var(--nr-text)]"
              >
                <div className="flex items-center gap-1">
                  Train
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("date")}
                className="px-4 py-2.5 cursor-pointer hover:text-[var(--nr-text)]"
              >
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("predictedETA")}
                className="px-4 py-2.5 cursor-pointer hover:text-[var(--nr-text)]"
              >
                <div className="flex items-center gap-1">
                  Predicted ETA
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-2.5">Actual Arrival</th>
              <th
                onClick={() => handleSort("actualDelay")}
                className="px-4 py-2.5 cursor-pointer hover:text-[var(--nr-text)]"
              >
                <div className="flex items-center gap-1">
                  Delay
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("confidenceScore")}
                className="px-4 py-2.5 cursor-pointer hover:text-[var(--nr-text)]"
              >
                <div className="flex items-center gap-1">
                  Confidence
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("accuracy")}
                className="px-4 py-2.5 cursor-pointer hover:text-[var(--nr-text)]"
              >
                <div className="flex items-center gap-1">
                  Accuracy
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-2.5">Verdict</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--nr-border)]/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-[var(--nr-text-muted)] font-sans">
                  <div className="w-5 h-5 border-2 border-[var(--nr-border)] border-t-[var(--nr-text-secondary)] rounded-full animate-spin mx-auto mb-2" />
                  Loading predictions...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-[var(--nr-text-muted)] font-sans">
                  No records match your query.
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--nr-surface-raised)]/40 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[var(--nr-accent)]">#{item.trainNumber}</span>
                      <span className="text-[var(--nr-text)] font-sans">{item.trainName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--nr-text-muted)]">{item.date}</td>
                  <td className="px-4 py-2.5 text-[var(--nr-text)] font-semibold">{item.predictedETA}</td>
                  <td className="px-4 py-2.5 text-[var(--nr-text-secondary)]">{item.actualArrival ?? "N/A"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--nr-text-muted)]">+{item.predictedDelay}m</span>
                      <span className="text-[var(--nr-text-faint)]">/</span>
                      <span
                        className={cn(
                          "font-semibold",
                          item.actualDelay === null
                            ? "text-[var(--nr-text-muted)]"
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
                  <td className="px-4 py-2.5">
                    <span className="text-[var(--nr-text-secondary)]">
                      {(item.confidenceScore ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {item.accuracy !== null && item.accuracy !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1 rounded-full bg-[var(--nr-border)] overflow-hidden">
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
                        <span className="text-[var(--nr-text-secondary)]">{(item.accuracy ?? 0).toFixed(0)}%</span>
                      </div>
                    ) : (
                      <span className="text-[var(--nr-text-muted)] font-sans text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize font-sans",
                        item.status ? getStatusBg(item.status) : "bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] border-[var(--nr-border)]"
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

      {/* Pagination */}
      <div className="p-3 border-t border-[var(--nr-border)] flex items-center justify-between">
        <div className="text-[11px] text-[var(--nr-text-muted)]">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-2.5 py-1 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] text-[var(--nr-text-secondary)] hover:text-[var(--nr-text)] disabled:opacity-30 disabled:pointer-events-none text-[12px] flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2.5 py-1 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] text-[var(--nr-text-secondary)] hover:text-[var(--nr-text)] disabled:opacity-30 disabled:pointer-events-none text-[12px] flex items-center gap-1 transition-colors"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import PredictionTable from "../components/history/PredictionTable";
import { getPredictionHistory } from "../services/api";
import type { PredictionHistoryItem } from "../types";
import { RefreshCw, Clock, FileSpreadsheet } from "lucide-react";
import { cn } from "../lib/utils";

export default function PredictionHistory() {
  const [data, setData] = useState<PredictionHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getPredictionHistory(page, pageSize, search);
      setData(response.data);
      setTotal(response.total);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, search]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers =
      "Train Number,Train Name,Date,Predicted ETA,Actual Arrival,Predicted Delay,Actual Delay,Confidence,Accuracy,Status\n";
    const rows = data
      .map(
        (r) =>
          `"${r.trainNumber}","${r.trainName}","${r.date}","${r.predictedETA}","${r.actualArrival}",${r.predictedDelay},${r.actualDelay},${r.confidenceScore},${r.accuracy},"${r.status}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `nexrail_prediction_audit_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* ── Operational Audit Header ─────────────────────────── */}
      <div className="nr-card p-3.5 bg-[var(--nr-surface-glass)] backdrop-blur border border-[var(--nr-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center shrink-0 text-[var(--nr-accent)]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[var(--nr-text)] tracking-tight">
                Inference Engine Audit Trail
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[var(--nr-surface-raised)] text-[var(--nr-text-secondary)] border border-[var(--nr-border)]">
                {total} Records Total
              </span>
            </div>
            <p className="text-[11px] text-[var(--nr-text-muted)]">
              Cryptographically timestamped inference records for operational verification
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nr-surface-raised)] hover:bg-[var(--nr-border)] disabled:opacity-50 text-[var(--nr-text)] border border-[var(--nr-border)] text-[11px] font-medium transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchHistory}
            className="p-1.5 rounded-md bg-[var(--nr-surface-raised)] hover:bg-[var(--nr-border)] text-[var(--nr-text-muted)] hover:text-[var(--nr-text)] border border-[var(--nr-border)] transition-colors cursor-pointer"
            title="Reload audit records"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-[var(--nr-accent)]")}
            />
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <PredictionTable
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        search={search}
        onPageChange={setPage}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        isLoading={isLoading}
      />
    </div>
  );
}

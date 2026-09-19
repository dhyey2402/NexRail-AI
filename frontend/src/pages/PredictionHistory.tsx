import { useState, useEffect } from "react";
import PredictionTable from "../components/history/PredictionTable";
import { getPredictionHistory } from "../services/api";
import type { PredictionHistoryItem } from "../types";
import { Download, RefreshCw } from "lucide-react";

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
    const headers = "Train Number,Train Name,Date,Predicted ETA,Actual Arrival,Predicted Delay,Actual Delay,Confidence,Accuracy,Status\n";
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
    link.setAttribute("download", `prediction_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nr-surface)] hover:bg-[var(--nr-surface-raised)] text-[var(--nr-text)] border border-[var(--nr-border)] text-[12px] font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[var(--nr-accent)]" />
          Export CSV
        </button>
        <button
          onClick={fetchHistory}
          className="p-1.5 rounded-md bg-[var(--nr-surface)] hover:bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] hover:text-[var(--nr-text)] border border-[var(--nr-border)] transition-colors"
          title="Reload"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--nr-accent)]" : ""}`} />
        </button>
      </div>

      {/* Table */}
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

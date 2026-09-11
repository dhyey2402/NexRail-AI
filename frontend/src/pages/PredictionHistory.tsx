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
    link.setAttribute("download", `prediction_history_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="app-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Auditable Log Stream
            </span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
            Prediction History & Post-Hoc Verification
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Historical benchmark log comparing real-time LightGBM ETA inferences with actual physical arrivals.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Export CSV
          </button>
          <button
            onClick={fetchHistory}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            title="Reload table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
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

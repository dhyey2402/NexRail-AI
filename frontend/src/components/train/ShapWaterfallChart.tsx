import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import type { ShapValue } from "../../types";
import { BrainCircuit } from "lucide-react";

interface ShapWaterfallChartProps {
  shapData: ShapValue[];
}

export default function ShapWaterfallChart({ shapData }: ShapWaterfallChartProps) {
  const chartData = shapData.map((item) => ({
    name: item.featureName.length > 28 ? item.featureName.slice(0, 26) + "..." : item.featureName,
    fullName: item.featureName,
    impact: item.valueContribution,
    category: item.category,
    displayValue: item.displayValue,
  }));

  return (
    <div className="app-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-4">
        <div>
          <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-sky-400" />
            SHAP Feature Attribution
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Marginal impact of telemetry signals on ETA variance (minutes)
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-sm bg-rose-500" /> + Delay
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> - Delay
          </span>
        </div>
      </div>

      <div className="h-[210px] w-full">
        {!shapData || shapData.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center border border-zinc-800 border-dashed rounded-xl bg-zinc-900/30">
            <BrainCircuit className="w-6 h-6 text-zinc-600 mb-2" />
            <h4 className="text-zinc-300 font-medium text-xs">Explainability unavailable</h4>
            <p className="text-zinc-500 text-[10px] max-w-[200px] text-center mt-1">
              The model did not return feature attribution data for this prediction.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#27272a" horizontal={false} />
              <XAxis
                type="number"
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#3f3f46" }}
                unit="m"
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#a1a1aa"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#3f3f46" }}
                width={160}
              />
              <ReferenceLine x={0} stroke="#52525b" strokeWidth={1} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#f4f4f5",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                }}
                formatter={(value, _, entry) => [
                  `${Number(value) > 0 ? `+${value}` : value} mins (${entry.payload.displayValue})`,
                  "Impact",
                ]}
              />
              <Bar dataKey="impact" radius={[3, 3, 3, 3]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.impact > 0 ? "#f43f5e" : "#10b981"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

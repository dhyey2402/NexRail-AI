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
    <div className="nr-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nr-border)] pb-3 mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--nr-text)] flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[var(--nr-accent)]" />
            Feature Attribution
          </h3>
          <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
            Impact of each feature on ETA variance (minutes)
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-sm bg-rose-500" /> + Delay
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> − Delay
          </span>
        </div>
      </div>

      <div className="h-[210px] w-full">
        {!shapData || shapData.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-[var(--nr-border)] rounded-md">
            <BrainCircuit className="w-5 h-5 text-[var(--nr-text-faint)] mb-2" />
            <h4 className="text-[var(--nr-text-secondary)] font-medium text-[12px]">No attribution data</h4>
            <p className="text-[var(--nr-text-muted)] text-[10px] max-w-[200px] text-center mt-1">
              Feature attribution is not available for this prediction.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#232938" horizontal={false} />
              <XAxis
                type="number"
                stroke="#5c657a"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#2f3749" }}
                unit="m"
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#8b93a5"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#2f3749" }}
                width={160}
              />
              <ReferenceLine x={0} stroke="#2f3749" strokeWidth={1} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#12151c",
                  borderColor: "#2f3749",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#e8eaf0",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
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
                    fill={entry.impact > 0 ? "#c44a3e" : "#2d9c6f"}
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

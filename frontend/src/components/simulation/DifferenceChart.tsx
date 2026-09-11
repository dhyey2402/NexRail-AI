import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import type { SimulationResult } from "../../types";

interface DifferenceChartProps {
  result: SimulationResult | null;
}

export default function DifferenceChart({ result }: DifferenceChartProps) {
  if (!result) return null;

  const stations = ["NDLS (Dep)", "CNB (Current)", "ALD", "MGS", "DHN", "HWH (Arr)"];
  const baseDelays = [0, result.originalDelay, result.originalDelay + 2, result.originalDelay + 4, result.originalDelay + 6, result.originalDelay + 8];

  const chartData = stations.map((st, index) => {
    const factorRatio = index / (stations.length - 1);
    const simDelay = Math.round(baseDelays[index] + (result.additionalDelay * factorRatio));

    return {
      station: st,
      "Baseline Delay": baseDelays[index],
      "Simulated Delay": simDelay,
    };
  });

  return (
    <div className="app-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-xs font-semibold text-zinc-100">Delay Propagation Along Corridor</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Estimated delay progression from current block to destination
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 inline-block" />
            <span className="text-zinc-400 text-[11px]">Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
            <span className="text-sky-400 text-[11px] font-medium">Simulated Scenario</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="station"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#3f3f46" }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#3f3f46" }}
              unit="m"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#3f3f46",
                borderRadius: "8px",
                fontSize: "11px",
                color: "#f4f4f5",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              }}
            />
            <Area
              type="monotone"
              dataKey="Baseline Delay"
              stroke="#71717a"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorBaseline)"
            />
            <Area
              type="monotone"
              dataKey="Simulated Delay"
              stroke="#0284c7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSimulated)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

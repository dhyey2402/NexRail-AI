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
    <div className="nr-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-[13px] font-semibold text-[var(--nr-text)]">Delay Propagation</h4>
          <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
            Estimated delay progression along corridor
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#5c657a] inline-block" />
            <span className="text-[var(--nr-text-muted)]">Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--nr-accent)] inline-block" />
            <span className="text-[var(--nr-accent)]">Simulated</span>
          </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82c4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82c4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5c657a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#5c657a" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#232938" vertical={false} />
            <XAxis
              dataKey="station"
              stroke="#5c657a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#2f3749" }}
            />
            <YAxis
              stroke="#5c657a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#2f3749" }}
              unit="m"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#12151c",
                borderColor: "#2f3749",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#e8eaf0",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
              }}
            />
            <Area
              type="monotone"
              dataKey="Baseline Delay"
              stroke="#5c657a"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorBaseline)"
            />
            <Area
              type="monotone"
              dataKey="Simulated Delay"
              stroke="#3b82c4"
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

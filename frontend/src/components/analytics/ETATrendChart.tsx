import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface ETATrendChartProps {
  data: { time: string; predicted: number; actual: number }[];
}

export default function ETATrendChart({ data }: ETATrendChartProps) {
  return (
    <div className="app-card p-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-zinc-100">24-Hour Network Delay Variance</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Predicted vs Actual aggregated delay throughout peak and off-peak hours
        </p>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="time"
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
              formatter={(value) => [`${value} mins avg delay`]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              name="Predicted Delay"
              stroke="#0284c7"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorPred)"
            />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual Delay"
              stroke="#f59e0b"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorAct)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

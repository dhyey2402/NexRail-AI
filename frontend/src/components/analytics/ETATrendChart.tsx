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
    <div className="nr-card p-4">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">24-Hour Delay Trend</h3>
        <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
          Predicted vs actual delay across peak and off-peak hours
        </p>
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82c4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82c4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c58f2a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#c58f2a" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#232938" vertical={false} />
            <XAxis
              dataKey="time"
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
              name="Predicted"
              stroke="#3b82c4"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorPred)"
            />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#c58f2a"
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

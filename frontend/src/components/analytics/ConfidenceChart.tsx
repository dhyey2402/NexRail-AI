import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface ConfidenceChartProps {
  data: { date: string; confidence: number; accuracy: number }[];
}

export default function ConfidenceChart({ data }: ConfidenceChartProps) {
  return (
    <div className="app-card p-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-zinc-100">Model Confidence vs Historical Accuracy</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          10-day rolling evaluation of LightGBM predictions
        </p>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#3f3f46" }}
            />
            <YAxis
              domain={[75, 100]}
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#3f3f46" }}
              unit="%"
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
              formatter={(value) => [`${value}%`]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              name="Confidence Score"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ fill: "#0284c7", r: 2.5 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="Empirical Accuracy"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ fill: "#10b981", r: 2.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

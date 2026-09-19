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
    <div className="nr-card p-4">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Confidence vs Accuracy</h3>
        <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
          Rolling evaluation of prediction pipeline
        </p>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#232938" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#5c657a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#2f3749" }}
            />
            <YAxis
              domain={[75, 100]}
              stroke="#5c657a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#2f3749" }}
              unit="%"
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
              name="Confidence"
              stroke="#3b82c4"
              strokeWidth={2}
              dot={{ fill: "#3b82c4", r: 2 }}
              activeDot={{ r: 3.5 }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="Accuracy"
              stroke="#2d9c6f"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ fill: "#2d9c6f", r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

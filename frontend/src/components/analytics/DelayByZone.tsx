import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface DelayByZoneProps {
  data: { zone: string; avgDelay: number; totalTrains: number }[];
}

export default function DelayByZone({ data }: DelayByZoneProps) {
  return (
    <div className="nr-card p-4">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Delay by Zone</h3>
        <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
          Comparative delay across railway zones
        </p>
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#232938" vertical={false} />
            <XAxis
              dataKey="zone"
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
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
            />
            <Bar
              dataKey="avgDelay"
              name="Avg Delay (min)"
              fill="#c58f2a"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="totalTrains"
              name="Active Trains"
              fill="#3b82c4"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

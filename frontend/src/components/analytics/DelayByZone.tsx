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
    <div className="app-card p-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-zinc-100">Zone-Wise Delay & Traffic Load</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Comparative throughput across railway operational zones
        </p>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="zone"
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
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
            />
            <Bar
              dataKey="avgDelay"
              name="Avg Delay (min)"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="totalTrains"
              name="Active Trains"
              fill="#0284c7"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

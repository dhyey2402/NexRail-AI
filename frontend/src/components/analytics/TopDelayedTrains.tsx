import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

interface TopDelayedTrainsProps {
  data: { train: string; avgDelay: number; count: number }[];
}

export default function TopDelayedTrains({ data }: TopDelayedTrainsProps) {
  const sortedData = [...data].sort((a, b) => b.avgDelay - a.avgDelay).slice(0, 8);

  return (
    <div className="app-card p-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-zinc-100">Top Delayed Services (7-Day Average)</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Priority bottlenecks requiring operational attention
        </p>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
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
              dataKey="train"
              stroke="#a1a1aa"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#3f3f46" }}
              width={110}
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
              formatter={(value, _, entry) => [
                `${value} mins avg delay (${entry.payload.count} trips)`,
                "Average Delay",
              ]}
            />
            <Bar dataKey="avgDelay" radius={[0, 3, 3, 0]}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.avgDelay >= 50
                      ? "#f43f5e"
                      : entry.avgDelay >= 30
                        ? "#f97316"
                        : "#f59e0b"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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
    <div className="nr-card p-4">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Top Delayed Services</h3>
        <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
          7-day average delay ranking
        </p>
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
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
              dataKey="train"
              stroke="#8b93a5"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#2f3749" }}
              width={110}
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
              formatter={(value, _, entry) => [
                `${value} mins avg (${entry.payload.count} trips)`,
                "Delay",
              ]}
            />
            <Bar dataKey="avgDelay" radius={[0, 3, 3, 0]}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.avgDelay >= 50
                      ? "#c44a3e"
                      : entry.avgDelay >= 30
                        ? "#d97706"
                        : "#c58f2a"
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

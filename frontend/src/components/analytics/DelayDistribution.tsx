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

interface DelayDistributionProps {
  data: { range: string; count: number }[];
}

export default function DelayDistribution({ data }: DelayDistributionProps) {
  const getBarColor = (range: string) => {
    if (range.includes("0 min") || range.includes("1-10")) return "#10b981";
    if (range.includes("11-20") || range.includes("21-30")) return "#f59e0b";
    if (range.includes("31-45") || range.includes("46-60")) return "#f97316";
    return "#f43f5e";
  };

  return (
    <div className="app-card p-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-zinc-100">Delay Distribution Buckets</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Active fleet categorized by delay thresholds
        </p>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="range"
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
              formatter={(value) => [`${value} trains`, "Count"]}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

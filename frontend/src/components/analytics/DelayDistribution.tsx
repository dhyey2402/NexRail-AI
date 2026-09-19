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
    if (range.includes("0 min") || range.includes("1-10")) return "#2d9c6f";
    if (range.includes("11-20") || range.includes("21-30")) return "#c58f2a";
    if (range.includes("31-45") || range.includes("46-60")) return "#d97706";
    return "#c44a3e";
  };

  return (
    <div className="nr-card p-4">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Delay Distribution</h3>
        <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">
          Fleet categorized by delay thresholds
        </p>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#232938" vertical={false} />
            <XAxis
              dataKey="range"
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

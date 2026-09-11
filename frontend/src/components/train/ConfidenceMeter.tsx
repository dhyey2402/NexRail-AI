import { cn } from "../../lib/utils";

interface ConfidenceMeterProps {
  score: number;
  size?: number;
}

export default function ConfidenceMeter({ score, size = 130 }: ConfidenceMeterProps) {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 90) return { stroke: "#10b981", text: "text-emerald-400", label: "High Confidence" };
    if (score >= 75) return { stroke: "#f59e0b", text: "text-amber-400", label: "Moderate" };
    return { stroke: "#f43f5e", text: "text-rose-400", label: "Low Confidence" };
  };

  const color = getColor();

  return (
    <div className="app-card p-4">
      <h3 className="text-xs font-semibold text-zinc-100 mb-3">Model Confidence</h3>

      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-zinc-800"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className={cn("text-2xl font-bold", color.text)}>
              {score.toFixed(1)}%
            </span>
            <span className="text-[10px] text-zinc-500 font-sans mt-0.5">Reliability</span>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded border", 
            score >= 90 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            score >= 75 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            {color.label}
          </span>
        </div>
      </div>
    </div>
  );
}

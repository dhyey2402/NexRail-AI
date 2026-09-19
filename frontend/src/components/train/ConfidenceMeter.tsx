import { cn } from "../../lib/utils";

interface ConfidenceMeterProps {
  score: number;
  size?: number;
}

export default function ConfidenceMeter({ score, size = 110 }: ConfidenceMeterProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 90) return { stroke: "var(--nr-success, #2d9c6f)", text: "text-emerald-400", label: "High" };
    if (score >= 75) return { stroke: "var(--nr-warning, #c58f2a)", text: "text-amber-400", label: "Moderate" };
    return { stroke: "var(--nr-danger, #c44a3e)", text: "text-rose-400", label: "Low" };
  };

  const color = getColor();

  return (
    <div className="nr-card p-4">
      <h3 className="text-[13px] font-semibold text-[var(--nr-text)] mb-3">Model Confidence</h3>

      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--nr-border, #232938)"
              strokeWidth={strokeWidth}
            />
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

          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className={cn("text-xl font-bold", color.text)}>
              {score.toFixed(1)}%
            </span>
            <span className="text-[10px] text-[var(--nr-text-muted)] font-sans mt-0.5">Reliability</span>
          </div>
        </div>

        <div className="mt-2.5 text-center">
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

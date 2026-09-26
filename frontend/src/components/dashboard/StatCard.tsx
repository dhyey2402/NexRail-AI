import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  isPrimary?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isPrimary = false,
}: StatCardProps) {
  return (
    <div className={cn(
      "p-5 flex flex-col justify-between h-full nr-animate-in",
      isPrimary ? "nr-card-elevated" : "nr-card"
    )}>
      {/* Label + Icon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--nr-text-muted)" }}>
          {title}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isPrimary ? "var(--nr-accent-muted)" : "var(--nr-bg-subtle)",
            border: "1px solid var(--nr-border)",
          }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: isPrimary ? "var(--nr-accent)" : "var(--nr-text-faint)" }} />
        </div>
      </div>

      {/* Metric */}
      <div
        className={cn(
          "font-bold font-mono tracking-[-0.03em]",
          isPrimary ? "text-[30px]" : "text-[24px]"
        )}
        style={{ color: "var(--nr-text-white)" }}
      >
        {value}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2.5 flex items-center text-[10.5px] min-h-[20px]"
        style={{ borderTop: "1px solid var(--nr-border)" }}
      >
        {trend ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono font-semibold px-2 py-0.5 rounded-full text-[10px]",
                trend.value >= 0
                  ? "nr-badge-success"
                  : "nr-badge-danger"
              )}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span style={{ color: "var(--nr-text-muted)" }}>{trend.label}</span>
          </div>
        ) : (
          <span style={{ color: "var(--nr-text-muted)" }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}

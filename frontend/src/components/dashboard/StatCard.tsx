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
    <div className="nr-card p-4 flex flex-col justify-between h-full">
      {/* Label */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-medium text-[var(--nr-text-muted)] uppercase tracking-wider">
          {title}
        </span>
        <Icon className="h-3.5 w-3.5 text-[var(--nr-text-faint)]" />
      </div>

      {/* Metric */}
      <div
        className={cn(
          "font-bold font-mono tracking-tight text-[var(--nr-text)]",
          isPrimary ? "text-[28px]" : "text-[22px]"
        )}
      >
        {value}
      </div>

      {/* Footer */}
      <div className="mt-2.5 pt-2 border-t border-[var(--nr-border)] flex items-center text-[11px] min-h-[20px]">
        {trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-mono font-semibold px-1.5 py-0.5 rounded text-[10px]",
                trend.value >= 0
                  ? "text-[var(--nr-success)] bg-[var(--nr-success-muted)]"
                  : "text-[var(--nr-danger)] bg-[var(--nr-danger-muted)]"
              )}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-[var(--nr-text-muted)]">{trend.label}</span>
          </div>
        ) : (
          <span className="text-[var(--nr-text-muted)]">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

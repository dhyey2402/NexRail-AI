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
    <div
      className={cn(
        "app-card p-4 flex flex-col justify-between h-full transition-colors",
        isPrimary ? "bg-zinc-900/70 border-zinc-800" : "bg-zinc-900/40 border-zinc-800/80"
      )}
    >
      <div>
        {/* Card Header: Title & Icon */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="w-6 h-6 rounded-md bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300">
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Primary Metric Number */}
        <div
          className={cn(
            "font-bold font-mono tracking-tight text-zinc-100",
            isPrimary ? "text-3xl" : "text-2xl"
          )}
        >
          {value}
        </div>
      </div>

      {/* Footer: Trend or Subtitle */}
      <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs min-h-[22px]">
        {trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded",
                trend.value >= 0
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-rose-400 bg-rose-500/10"
              )}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-zinc-500 text-[11px]">{trend.label}</span>
          </div>
        ) : (
          <span className="text-zinc-500 text-[11px]">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

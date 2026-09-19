import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="nr-card p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
      <div className="w-9 h-9 rounded-md bg-[var(--nr-surface-raised)] border border-[var(--nr-border)] flex items-center justify-center text-[var(--nr-text-muted)] mb-3">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <h4 className="text-[13px] font-semibold text-[var(--nr-text)]">{title}</h4>
      <p className="text-[12px] text-[var(--nr-text-muted)] mt-1 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-1.5 rounded-md bg-[var(--nr-accent)] hover:bg-[var(--nr-accent-hover)] text-white text-[12px] font-medium transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

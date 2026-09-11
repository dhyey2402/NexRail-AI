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
    <div className="app-card p-8 text-center flex flex-col items-center justify-center min-h-[240px]">
      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      <p className="text-xs text-zinc-500 mt-1 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

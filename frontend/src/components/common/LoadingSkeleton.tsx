import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-800/60 border border-zinc-800/30",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="app-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="app-card p-4 space-y-2.5">
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <Skeleton className="h-3.5 w-1/4" />
          <Skeleton className="h-3.5 w-1/6" />
          <Skeleton className="h-3.5 w-1/6" />
          <Skeleton className="h-3.5 w-1/6" />
          <Skeleton className="h-3.5 w-1/6" />
        </div>
      ))}
    </div>
  );
}

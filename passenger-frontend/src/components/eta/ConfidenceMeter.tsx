export function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted">Confidence</span>
        <span className="font-medium text-ink">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

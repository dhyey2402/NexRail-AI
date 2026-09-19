export function ConfidenceMeter({ value }: { value: number }) {
  const tone = value >= 85 ? 'bg-ok' : value >= 70 ? 'bg-accent' : 'bg-warn'

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="text-muted">Model confidence</span>
        <span className="font-mono font-semibold text-ink">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${tone} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

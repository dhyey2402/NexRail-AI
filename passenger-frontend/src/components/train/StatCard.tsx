import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: 'default' | 'ok' | 'warn' | 'danger'
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-3.5">
      <div className="mb-2 flex items-center gap-2 text-muted">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p
        className={cn(
          'text-xl font-bold tracking-tight font-mono',
          tone === 'ok' && 'text-ok',
          tone === 'warn' && 'text-warn',
          tone === 'danger' && 'text-danger',
          tone === 'default' && 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  )
}

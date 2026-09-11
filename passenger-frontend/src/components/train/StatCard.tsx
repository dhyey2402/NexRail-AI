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
    <div className="rounded-[14px] border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={cn(
          'text-2xl font-semibold tracking-tight',
          tone === 'ok' && 'text-ok',
          tone === 'warn' && 'text-warn',
          tone === 'danger' && 'text-danger',
          tone === 'default' && 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

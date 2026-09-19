import { Link } from 'react-router-dom'
import { ChevronRight, Train } from 'lucide-react'
import type { RecentSearch } from '@/types/train'

export function TrainCard({ item }: { item: RecentSearch }) {
  return (
    <Link
      to={`/train/${item.number}`}
      className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 border border-border text-muted shrink-0">
          <Train className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-ink">
            <span className="font-mono text-accent">{item.number}</span>{' '}
            <span className="font-medium text-muted">· {item.name}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-muted">{item.route}</p>
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-faint" />
    </Link>
  )
}

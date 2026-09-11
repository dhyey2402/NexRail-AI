import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { RecentSearch } from '@/types/train'

export function TrainCard({ item }: { item: RecentSearch }) {
  return (
    <Link
      to={`/train/${item.number}`}
      className="flex items-center justify-between rounded-[14px] border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div>
        <p className="text-sm font-semibold text-ink">
          {item.number} <span className="font-medium text-muted">· {item.name}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">{item.route}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-faint" />
    </Link>
  )
}

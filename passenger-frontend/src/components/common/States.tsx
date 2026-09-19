import type { ReactNode } from 'react'

export function LoadingSkeleton() {
  return (
    <div className="grid animate-pulse gap-3">
      <div className="h-20 rounded-md bg-surface" />
      <div className="grid gap-2 sm:grid-cols-4">
        <div className="h-24 rounded-md bg-surface" />
        <div className="h-24 rounded-md bg-surface" />
        <div className="h-24 rounded-md bg-surface" />
        <div className="h-24 rounded-md bg-surface" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-72 rounded-md bg-surface" />
        <div className="h-72 rounded-md bg-surface" />
      </div>
    </div>
  )
}

export function ErrorState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-6 py-10 text-center">
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[12px] text-muted">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-8 text-center">
      <p className="text-[13px] font-medium text-ink">{title}</p>
      <p className="mt-1 text-[11px] text-muted">{message}</p>
    </div>
  )
}

import type { ReactNode } from 'react'

export function LoadingSkeleton() {
  return (
    <div className="grid animate-pulse gap-4">
      <div className="h-24 rounded-[14px] bg-surface" />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="h-28 rounded-[14px] bg-surface" />
        <div className="h-28 rounded-[14px] bg-surface" />
        <div className="h-28 rounded-[14px] bg-surface" />
        <div className="h-28 rounded-[14px] bg-surface" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 rounded-[14px] bg-surface" />
        <div className="h-80 rounded-[14px] bg-surface" />
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
    <div className="rounded-[14px] border border-border bg-surface px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{message}</p>
    </div>
  )
}

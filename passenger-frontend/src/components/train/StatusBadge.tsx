import { TRAIN_STATUS, type TrainStatus } from '@/types/train'
import { cn } from '@/lib/utils'

const copy: Record<TrainStatus, { label: string; className: string; dot: string }> = {
  [TRAIN_STATUS.ON_TIME]: {
    label: 'On time',
    className: 'text-ok bg-ok-soft',
    dot: 'bg-ok',
  },
  [TRAIN_STATUS.SLIGHT_DELAY]: {
    label: 'Slight delay',
    className: 'text-warn bg-warn-soft',
    dot: 'bg-warn',
  },
  [TRAIN_STATUS.DELAYED]: {
    label: 'Delayed',
    className: 'text-danger bg-danger-soft',
    dot: 'bg-danger',
  },
  [TRAIN_STATUS.ARRIVED]: {
    label: 'Arrived',
    className: 'text-ok bg-ok-soft',
    dot: 'bg-ok',
  },
  [TRAIN_STATUS.CANCELLED]: {
    label: 'Cancelled',
    className: 'text-danger bg-danger-soft',
    dot: 'bg-danger',
  },
}

export function StatusBadge({ status }: { status: TrainStatus }) {
  const item = copy[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', item.className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} />
      {item.label}
    </span>
  )
}

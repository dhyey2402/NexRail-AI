import { Card, CardHint, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfidenceMeter } from '@/components/eta/ConfidenceMeter'
import type { Prediction, TrainLive } from '@/types/train'
import { TRAIN_STATUS } from '@/types/train'

type EtaCardProps = {
  train: TrainLive
  prediction: Prediction
  now: number
}

export function EtaCard({ train, prediction, now }: EtaCardProps) {
  const delayTone =
    train.status === TRAIN_STATUS.DELAYED
      ? 'text-danger'
      : train.status === TRAIN_STATUS.SLIGHT_DELAY
        ? 'text-warn'
        : 'text-ok'

  const lastUpdatedAgo = Math.max(0, Math.round((now - prediction.lastUpdated) / 1000))

  return (
    <Card className="border-accent/20 bg-linear-to-b from-accent-soft/40 to-surface">
      <CardHeader>
        <div>
          <CardTitle>AI predicted arrival</CardTitle>
          <CardHint>
            {train.destination ? `Destination · ${train.destination}` : `Train ${train.number}`}
          </CardHint>
        </div>
        <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-medium text-accent">
          Live
        </span>
      </CardHeader>

      <p className="text-[40px] font-semibold leading-none tracking-tight text-ink">
        {prediction.predictedEta}
      </p>
      <p className="mt-2 text-sm text-muted">
        <span className={`font-medium ${delayTone}`}>
          {prediction.predictedDelayMin <= 0 ? 'On time' : `+${prediction.predictedDelayMin} min destination delay`}
        </span>
      </p>

      <div className="mt-5">
        <ConfidenceMeter value={prediction.confidence} />
      </div>
      <p className="mt-3 text-xs text-faint">
        Last updated {lastUpdatedAgo}s ago
      </p>
    </Card>
  )
}

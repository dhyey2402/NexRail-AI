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

  if (!prediction.isValidForLiveJourney) {
    return (
      <Card className="border-accent/20 bg-surface flex flex-col justify-center items-center h-full min-h-[160px] p-4 text-center border-dashed">
        <CardTitle className="text-muted text-lg mb-2">AI FORECAST Unavailable</CardTitle>
        <CardHint className="text-sm max-w-[80%] text-center">{prediction.invalidReason}</CardHint>
      </Card>
    )
  }

  return (
    <Card className="border-accent/20 bg-linear-to-b from-accent-soft/40 to-surface">
      <CardHeader>
        <div>
          <CardTitle>AI Predicted Arrival</CardTitle>
          <CardHint>
            {train.destination ? `Destination · ${train.destination}` : `Train ${train.number}`}
          </CardHint>
        </div>
        <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Live
        </span>
      </CardHeader>

      <p className="text-[36px] font-bold leading-none tracking-tight text-ink font-mono">
        {prediction.predictedEta}
      </p>
      <p className="mt-2 text-[13px] text-muted">
        <span className={`font-medium ${delayTone}`}>
          {prediction.predictedDelayMin <= 0 ? 'On time' : `+${prediction.predictedDelayMin} min delay`}
        </span>
      </p>

      <div className="mt-4">
        <ConfidenceMeter value={prediction.confidence} />
      </div>
      <p className="mt-2.5 text-[11px] text-faint font-mono">
        Updated {lastUpdatedAgo}s ago
      </p>
    </Card>
  )
}

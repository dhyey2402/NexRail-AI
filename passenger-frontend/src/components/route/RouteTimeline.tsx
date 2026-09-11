import { CheckCircle2, CircleDashed } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardHint } from '@/components/ui/card'
import { EmptyState } from '@/components/common/States'
import { delayLabel, formatClock } from '@/lib/utils'
import type { TrainLive, Prediction } from '@/types/train'
import { TRAIN_STATUS } from '@/types/train'

export function RouteTimeline({
  train,
  prediction,
}: {
  train: TrainLive
  prediction: Prediction | null
}) {
  if (!train.stations || train.stations.length === 0) {
    return (
      <Card className="h-full bg-surface pb-6">
        <CardHeader>
          <div>
            <CardTitle>Delay Propagation Heatmap</CardTitle>
            <CardHint>Route breakdown</CardHint>
          </div>
        </CardHeader>
        <div className="mt-4 px-5 pb-5">
          <EmptyState
            title="Route not available"
            message="Detailed station stops are not available for this train at the moment."
          />
        </div>
      </Card>
    )
  }

  // Merge the propagation predictions into the train stations
  const propagationMap = new Map()
  if (prediction?.delayPropagation) {
    prediction.delayPropagation.forEach((p) => {
      propagationMap.set(p.station_code, p)
    })
  }

  return (
    <Card className="h-full bg-surface pb-6">
      <CardHeader>
        <div>
          <CardTitle>Delay Propagation Heatmap</CardTitle>
          <CardHint>
            Distance: {train.stations[train.stations.length - 1].km} km
          </CardHint>
        </div>
      </CardHeader>

      <div className="mt-4 space-y-0 px-5">
        {train.stations.map((stop, i) => {
          const isLast = i === train.stations!.length - 1
          const isPassed = stop.status === 'passed'
          const isCurrent = stop.status === 'current'
          const scheduled = stop.scheduledArrival || stop.scheduledDeparture
          
          const prop = propagationMap.get(stop.code)
          const delayMin = prop ? prop.predicted_delay_minutes : stop.delayMin
          const predictedArr = prop?.predicted_arrival

          const actual = predictedArr
            ? `2026-09-10T${predictedArr}:00` // Mocking date part for formatter
            : (stop.actualArrival || stop.actualDeparture)

          const tone =
            delayMin > 15 ? 'text-danger' : delayMin > 0 ? 'text-warn' : 'text-ok'

          // Heatmap bar color based on delay
          const barColor = isPassed
            ? 'bg-accent/40'
            : delayMin > 25
              ? 'bg-danger/80'
              : delayMin > 10
                ? 'bg-warn/80'
                : 'bg-border'

          return (
            <div key={stop.code} className="group relative flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface ${
                    isPassed
                      ? 'text-accent'
                      : isCurrent
                        ? train.status === TRAIN_STATUS.DELAYED
                          ? 'text-danger'
                          : 'text-accent'
                        : delayMin > 25 ? 'text-danger' : delayMin > 10 ? 'text-warn' : 'text-border'
                  }`}
                >
                  {isPassed || isCurrent ? (
                    <CheckCircle2 className="h-full w-full" />
                  ) : (
                    <CircleDashed className="h-full w-full" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`mt-1 w-1 flex-1 rounded-full ${barColor}`}
                  />
                )}
              </div>

              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-medium ${isPassed ? 'text-ink' : 'text-ink'}`}
                  >
                    {stop.name} <span className="text-muted">({stop.code})</span>
                  </p>
                  {isCurrent && (
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      Current
                    </span>
                  )}
                  {prop && !isPassed && !isCurrent && (
                    <span className="rounded bg-muted/10 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                      Predicted
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <div className="flex flex-col">
                    <span className="text-faint">Sch</span>
                    <span className="font-medium text-muted">
                      {scheduled ? formatClock(new Date(scheduled)) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-faint">Act/Exp</span>
                    <span className={`font-medium ${!isPassed ? tone : 'text-ink'}`}>
                      {actual ? (predictedArr ? predictedArr : formatClock(new Date(actual))) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-faint">Delay</span>
                    <span className={`font-medium ${!isPassed ? tone : 'text-ink'}`}>
                      {delayLabel(delayMin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

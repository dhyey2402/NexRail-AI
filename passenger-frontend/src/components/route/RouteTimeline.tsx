import { useState } from 'react'
import { TrainFront, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardHint } from '@/components/ui/card'
import { EmptyState } from '@/components/common/States'
import { formatClock } from '@/lib/utils'
import type { TrainLive, Prediction, StationStop } from '@/types/train'

export function RouteTimeline({
  train,
  prediction,
}: {
  train: TrainLive
  prediction: Prediction | null
}) {
  const [expanded, setExpanded] = useState(false)

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

  const propagationMap = new Map()
  if (prediction?.delayPropagation) {
    prediction.delayPropagation.forEach((p) => {
      propagationMap.set(p.station_code, p)
    })
  }

  const allStations = train.stations

  // Key stations: First, Current, Last, + 3 spaced out upcoming
  const currentIndex = allStations.findIndex((s) => s.status === 'current')
  let displayStations: StationStop[] = []

  if (expanded) {
    displayStations = allStations
  } else {
    const origin = allStations[0]
    const destination = allStations[allStations.length - 1]
    const current = currentIndex !== -1 ? allStations[currentIndex] : null

    displayStations.push(origin)
    if (current && current.code !== origin.code && current.code !== destination.code) {
      displayStations.push(current)
    }

    const startIdx = currentIndex !== -1 ? currentIndex + 1 : 1
    const endIdx = allStations.length - 1
    const remainingCount = endIdx - startIdx

    if (remainingCount > 0) {
      if (remainingCount <= 3) {
        for (let i = startIdx; i < endIdx; i++) displayStations.push(allStations[i])
      } else {
        const step = remainingCount / 4
        displayStations.push(allStations[Math.floor(startIdx + step)])
        displayStations.push(allStations[Math.floor(startIdx + step * 2)])
        displayStations.push(allStations[Math.floor(startIdx + step * 3)])
      }
    }
    
    // Sort and deduplicate
    displayStations = Array.from(new Set(displayStations.map((s) => s.code)))
      .map((code) => allStations.find((s) => s.code === code)!)
      .sort((a, b) => a.km - b.km)

    if (!displayStations.find((s) => s.code === destination.code)) {
      displayStations.push(destination)
    }
  }

  return (
    <Card className="h-full bg-surface pb-4 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Delay Propagation Heatmap</CardTitle>
          <CardHint>
            Distance: {allStations[allStations.length - 1].km} km
          </CardHint>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-accent flex items-center gap-1 hover:underline"
        >
          {expanded ? (
            <>View Compact <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>View All Stations <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      </CardHeader>

      <div className="flex-1 mt-2 px-5 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex items-start min-w-max py-4 px-2">
          {displayStations.map((stop, i) => {
            const isLast = i === displayStations.length - 1
            const isPassed = stop.status === 'passed'
            const isCurrent = stop.status === 'current'
            
            const prop = propagationMap.get(stop.code)
            const delayMin = prop ? prop.predicted_delay_minutes : stop.delayMin
            const scheduled = stop.scheduledArrival || stop.scheduledDeparture
            const actual = prop?.predicted_arrival ? `2026-09-10T${prop.predicted_arrival}:00` : (stop.actualArrival || stop.actualDeparture)
            
            // Heatmap styling based on delay
            const severityColor = isPassed
              ? 'bg-accent/30'
              : delayMin > 25
                ? 'bg-danger'
                : delayMin > 10
                  ? 'bg-warn'
                  : 'bg-border'

            const textColor = isPassed
              ? 'text-muted'
              : delayMin > 25
                ? 'text-danger'
                : delayMin > 10
                  ? 'text-warn'
                  : 'text-ok'

            return (
              <div key={stop.code} className="relative flex flex-col items-center w-28 shrink-0 group cursor-default">
                {/* Connector Line */}
                {!isLast && (
                  <div className={`absolute top-2 left-1/2 w-full h-1 ${severityColor} z-0`} />
                )}

                {/* Node */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-surface border-2 ${isPassed ? 'border-accent/40' : (isCurrent ? 'border-accent scale-125' : severityColor.replace('bg-', 'border-'))}`}>
                    {isCurrent && <TrainFront className="w-3 h-3 text-accent" />}
                  </div>
                </div>

                {/* Station Info */}
                <div className="mt-3 flex flex-col items-center text-center">
                  <p className={`text-xs font-semibold ${isCurrent ? 'text-accent' : 'text-ink'}`}>
                    {stop.code}
                  </p>
                  <p className={`mt-0.5 text-[10px] font-medium ${textColor}`}>
                    {delayMin > 0 ? `+${delayMin}m` : 'On time'}
                  </p>
                  {expanded && (
                    <div className="mt-1 flex flex-col items-center opacity-70">
                      <span className="text-[9px] font-mono">{scheduled ? formatClock(new Date(scheduled)) : '—'}</span>
                    </div>
                  )}
                </div>

                {/* Hover Tooltip (Native Title) */}
                <div 
                  className="absolute inset-0 z-20" 
                  title={`${stop.name} (${stop.code})\nDelay: ${delayMin} min\nSch: ${scheduled ? formatClock(new Date(scheduled)) : '—'}\nAct: ${actual ? formatClock(new Date(actual)) : '—'}`} 
                />
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

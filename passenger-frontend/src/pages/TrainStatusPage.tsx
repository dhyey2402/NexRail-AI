import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock3, Gauge, MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import { EtaCard } from '@/components/eta/EtaCard'
import { RouteTimeline } from '@/components/route/RouteTimeline'
import { WeatherCard } from '@/components/weather/WeatherCard'
import { WhatIfPanel } from '@/components/simulate/WhatIfPanel'
import { ReasoningPanel } from '@/components/explain/ReasoningPanel'
import { StatCard } from '@/components/train/StatCard'
import { StatusBadge } from '@/components/train/StatusBadge'
import { LoadingSkeleton, ErrorState } from '@/components/common/States'
import { RecoveryAdvisorPanel } from '@/components/explain/RecoveryAdvisorPanel'
import { AlternativePlannerPanel } from '@/components/explain/AlternativePlannerPanel'
import { Button } from '@/components/ui/button'
import { getPrediction, getTrain, getWeather } from '@/services/api'
import { saveRecentSearch } from '@/lib/recentSearches'
import { delayLabel, formatClock } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import { TRAIN_STATUS, type Prediction, type TrainLive, type WeatherInfo } from '@/types/train'

const RouteMap = lazy(() => import('@/components/route/RouteMap'))


const POLL_INTERVAL_MS = 30_000

export function TrainStatusPage() {
  const { id = '' } = useParams()
  const now = useNow(1000)
  const [train, setTrain] = useState<TrainLive | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const live = await getTrain(id)
      const [pred, wx] = await Promise.all([getPrediction(live), getWeather(live)])
      setTrain(live)
      setPrediction(pred)
      setWeather(wx)
      saveRecentSearch({
        number: live.number,
        name: live.name,
        route: `${live.source ?? live.currentStation} → ${live.destination ?? live.nextStation}`,
        searchedAt: Date.now(),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load train'
      setError(message)
      if (showLoading) toast.error(message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [id])

  // Initial load
  useEffect(() => {
    void load(true)
  }, [load])

  // Periodic refresh from backend (no fake physics)
  useEffect(() => {
    const interval = setInterval(() => void load(false), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <LoadingSkeleton />
      </div>
    )
  }

  if (error || !train || !prediction) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          title="Train not found"
          message={error ?? 'No live running data for this number.'}
          action={
            <Button asChild variant="secondary">
              <Link to="/search">Try another number</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const delayTone =
    train.status === TRAIN_STATUS.DELAYED ? 'danger' : train.status === TRAIN_STATUS.SLIGHT_DELAY ? 'warn' : 'ok'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{train.name}</h1>
            <StatusBadge status={train.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {train.number}
            {train.type ? ` · ${train.type}` : ''}
            {train.source && train.destination ? ` · ${train.source} → ${train.destination}` : ''}
          </p>
        </div>
        <p className="font-mono text-xs text-faint">Live clock {formatClock(new Date(now))}</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock3}
          label="Current Delay"
          value={delayLabel(train.delayMin)}
          hint="Against scheduled running"
          tone={delayTone}
        />
        <StatCard
          icon={MapPin}
          label="Platform"
          value={train.platform ?? '—'}
          hint={train.currentStation}
        />
        <StatCard
          icon={Navigation}
          label="Next station"
          value={train.nextStation}
        />
        <StatCard
          icon={Gauge}
          label="Speed"
          value={`${Math.round(train.speedKmph)} km/h`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="grid gap-4 lg:col-span-2">
          <EtaCard train={train} prediction={prediction} now={now} />
          {weather ? (
            <WeatherCard weather={weather} />
          ) : (
            <div className="rounded-[14px] border border-border bg-surface p-5 text-sm text-muted flex items-center justify-center h-24">
              Weather unavailable
            </div>
          )}
          <AlternativePlannerPanel plan={prediction?.alternativePlan} />
        </div>
        <div className="lg:col-span-3">
          <RouteTimeline train={train} prediction={prediction} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Suspense fallback={<div className="h-[380px] rounded-[14px] border border-border bg-surface" />}>
            <RouteMap train={train} />
          </Suspense>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <RecoveryAdvisorPanel advice={prediction?.recoveryAdvice} />
          <ReasoningPanel prediction={prediction} />
        </div>
      </div>

      <div className="mt-4">
        <WhatIfPanel train={train} prediction={prediction} />
      </div>
    </div>
  )
}

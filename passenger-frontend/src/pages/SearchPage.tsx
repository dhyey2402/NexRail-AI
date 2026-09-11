import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from '@/components/search/SearchBar'
import { TrainCard } from '@/components/train/TrainCard'
import { EmptyState } from '@/components/common/States'
import { readRecentSearches } from '@/lib/recentSearches'
import { getLiveTrains } from '@/services/api'
import type { LiveTrainSummary, RecentSearch } from '@/types/train'

export function SearchPage() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [liveTrains, setLiveTrains] = useState<LiveTrainSummary[]>([])

  useEffect(() => {
    setRecent(readRecentSearches())
    getLiveTrains().then(setLiveTrains)
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Track a train</h1>
      <p className="mt-2 text-sm text-muted">
        Enter a 5-digit train number to open live status and predicted arrival.
      </p>
      <div className="mt-6">
        <SearchBar size="large" onSubmit={(id) => navigate(`/train/${id}`)} />
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold">Recent searches</h2>
      {recent.length === 0 ? (
        <EmptyState title="Nothing saved yet" message="Tracked trains will appear here on this device." />
      ) : (
        <div className="grid gap-2">
          {recent.map((item) => (
            <TrainCard key={item.number} item={item} />
          ))}
        </div>
      )}

      {liveTrains.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-sm font-semibold">Active trains</h2>
          <div className="grid gap-2">
            {liveTrains.slice(0, 10).map((t) => (
              <TrainCard
                key={t.trainNumber}
                item={{
                  number: t.trainNumber,
                  name: t.trainName,
                  route: `${t.currentStation} → ${t.nextStation}`,
                  searchedAt: 0,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-lg font-semibold tracking-tight text-ink">Track a Train</h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Enter a 5-digit train number for live status and AI predictions.
      </p>
      <div className="mt-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-700 border border-amber-200/50">
        <strong>MVP Notice:</strong> For the Hackathon evaluation, only specific curated trains are available in the search suggestions below.
      </div>
      <div className="mt-5">
        <SearchBar size="large" onSubmit={(id) => navigate(`/train/${id}`)} />
      </div>

      <h2 className="mb-2.5 mt-8 text-[12px] font-semibold text-muted uppercase tracking-wider">Recent Searches</h2>
      {recent.length === 0 ? (
        <EmptyState title="No recent searches" message="Tracked trains will appear here." />
      ) : (
        <div className="grid gap-1.5">
          {recent.map((item) => (
            <TrainCard key={item.number} item={item} />
          ))}
        </div>
      )}

      {liveTrains.length > 0 && (
        <>
          <h2 className="mb-2.5 mt-8 text-[12px] font-semibold text-muted uppercase tracking-wider">Active Trains</h2>
          <div className="grid gap-1.5">
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

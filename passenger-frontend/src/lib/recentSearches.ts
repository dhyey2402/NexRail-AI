import type { RecentSearch } from '@/types/train'

const KEY = 'nexrail.recentSearches'

export function readRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentSearch[]
    return parsed.slice(0, 6)
  } catch {
    return []
  }
}

export function saveRecentSearch(entry: RecentSearch) {
  const current = readRecentSearches().filter((item) => item.number !== entry.number)
  const next = [entry, ...current].slice(0, 6)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

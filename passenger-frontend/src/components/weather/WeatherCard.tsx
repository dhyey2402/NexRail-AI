import { Cloud, CloudRain, Eye, Waves, Wind } from 'lucide-react'
import { Card, CardHint, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeatherInfo } from '@/types/train'

const icons = {
  rain: CloudRain,
  storm: CloudRain,
  cloud: Cloud,
  clear: Cloud,
}

export function WeatherCard({ weather }: { weather: WeatherInfo }) {
  const Icon = icons[weather.kind] ?? Cloud

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Weather at {weather.station}</CardTitle>
          <CardHint>Contextual only — not a direct ML input claim</CardHint>
        </div>
        <Icon className="h-4 w-4 text-muted" />
      </CardHeader>

      <p className="text-2xl font-semibold tracking-tight">
        {weather.temperatureC}°C
        <span className="ml-2 text-sm font-medium text-muted">{weather.condition}</span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Waves className="h-3.5 w-3.5" /> Humidity {weather.humidity}%
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Visibility {weather.visibilityKm} km
        </span>
        <span className="flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5" /> Wind {weather.windKmph} km/h
        </span>
      </div>

      <p className="mt-4 rounded-[10px] border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
        {weather.advisory}
      </p>
    </Card>
  )
}

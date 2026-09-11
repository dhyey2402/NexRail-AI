import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Card, CardHint, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/States'
import type { TrainLive } from '@/types/train'

export default function RouteMap({ train }: { train: TrainLive }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (!train.lat || !train.lng) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([train.lat, train.lng], 10)

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 20,
        }
      ).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current
    map.setView([train.lat, train.lng], 10)

    // Clear existing markers/lines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    // Current location marker
    const el = document.createElement('div')
    el.className = 'flex h-5 w-5 items-center justify-center rounded-full bg-accent/20'
    const dot = document.createElement('div')
    dot.className = 'h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(0,102,255,0.6)]'
    el.appendChild(dot)

    const icon = L.divIcon({
      html: el,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    L.marker([train.lat, train.lng], { icon }).addTo(map)

    // Draw route if stations have coords
    if (train.stations && train.stations.length > 0) {
      const coords = train.stations
        .filter((s) => s.lat !== 0 && s.lng !== 0)
        .map((s) => [s.lat, s.lng] as [number, number])

      if (coords.length > 1) {
        L.polyline(coords, {
          color: '#0066FF',
          weight: 3,
          opacity: 0.3,
          dashArray: '5, 8',
        }).addTo(map)

        // Fit bounds to route
        const bounds = L.latLngBounds(coords)
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }
  }, [train])

  if (!train.lat || !train.lng) {
    return (
      <Card className="flex h-full flex-col bg-surface">
        <CardHeader>
          <div>
            <CardTitle>Live Map</CardTitle>
            <CardHint>GPS Location Tracker</CardHint>
          </div>
        </CardHeader>
        <div className="flex-1 px-5 pb-5">
          <EmptyState
            title="GPS Not Available"
            message="Live location is currently not available for this train."
          />
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden bg-surface p-0 pb-0">
      <CardHeader className="absolute z-10 w-full bg-gradient-to-b from-surface/90 to-surface/0 p-4">
        <div>
          <CardTitle>Live Map</CardTitle>
          <CardHint>
            {train.speedKmph} km/h · {train.currentStation} → {train.nextStation}
          </CardHint>
        </div>
      </CardHeader>
      <div ref={mapRef} className="h-full min-h-[380px] w-full" />
    </Card>
  )
}

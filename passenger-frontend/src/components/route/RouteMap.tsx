import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Card, CardHint, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/States'
import type { TrainLive } from '@/types/train'

export default function RouteMap({ train }: { train: TrainLive }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const hasGps = Boolean(train.lat && train.lng && (train.lat !== 0 || train.lng !== 0))
  const hasRoute = Boolean(train.stations && train.stations.length > 0 && train.stations.some(s => s.lat !== 0 && s.lng !== 0))

  useEffect(() => {
    if (!mapRef.current) return
    if (!hasGps && !hasRoute) return

    if (!mapInstanceRef.current) {
      // initial center
      const initialCenter: [number, number] = hasGps 
        ? [train.lat, train.lng] 
        : (hasRoute ? [train.stations!.find(s => s.lat !== 0)!.lat, train.stations!.find(s => s.lng !== 0)!.lng] : [20.5937, 78.9629])

      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(initialCenter, hasGps ? 10 : 5)

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 20,
        }
      ).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    // Clear existing markers/lines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    // Draw route if stations have coords
    let bounds = null
    if (hasRoute && train.stations) {
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

        bounds = L.latLngBounds(coords)
      }
    }

    // Current location marker
    if (hasGps) {
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
      
      // If we have GPS, we focus on GPS over route bounds, or include it in bounds
      if (bounds) {
          bounds.extend([train.lat, train.lng])
          map.fitBounds(bounds, { padding: [40, 40] })
      } else {
          map.setView([train.lat, train.lng], 10)
      }
    } else if (bounds) {
        map.fitBounds(bounds, { padding: [40, 40] })
    }

  }, [train, hasGps, hasRoute])

  if (!hasGps && !hasRoute) {
    return (
      <Card className="flex h-full flex-col bg-surface">
        <CardHeader>
          <div>
            <CardTitle>Live Map</CardTitle>
            <CardHint>Location and Route Unavailable</CardHint>
          </div>
        </CardHeader>
        <div className="flex-1 px-5 pb-5">
          <EmptyState
            title="Data Not Available"
            message="Both live GPS and route data are currently unavailable for this train."
          />
        </div>
      </Card>
    )
  }

  const lastUpdatedFormatted = train.lastUpdated ? new Date(train.lastUpdated).toLocaleTimeString('en-US', { hour12: false }) : 'Unknown'

  return (
    <Card className="flex h-full flex-col overflow-hidden bg-surface p-0 pb-0 relative">
      <CardHeader className="absolute z-10 w-full bg-gradient-to-b from-surface/90 to-surface/0 p-4 pointer-events-none">
        <div>
          <CardTitle>Live Map</CardTitle>
          <CardHint>
            {hasGps ? (
              <span className="text-ok">{train.speedKmph} km/h · GPS Active</span>
            ) : (
              <span className="text-warn">GPS Unavailable</span>
            )}
            {' · '}
            {hasRoute ? 'Route Active' : 'Route Unavailable'}
          </CardHint>
        </div>
      </CardHeader>
      
      {!hasGps && hasRoute && (
        <div className="absolute top-16 left-4 z-10 bg-surface/90 border border-border px-3 py-1.5 rounded-md text-xs shadow-sm">
          <span className="font-semibold text-warn">GPS Unavailable</span> — Showing static route
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10 bg-surface/90 border border-border px-2 py-1 rounded-sm text-[10px] text-muted shadow-sm">
        Updated: {lastUpdatedFormatted}
      </div>

      <div ref={mapRef} className="h-full min-h-[380px] w-full z-0" />
    </Card>
  )
}

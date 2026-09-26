import { useState, useEffect, useRef } from "react";
import type { Train as TrainType } from "../../types";
import { cn, formatDelay, getStatusBg, getStatusLabel } from "../../lib/utils";
import { Radio, Navigation2, MapPin, Gauge, Clock, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from "../../contexts/ThemeContext";
import { createRoot } from "react-dom/client";
import { getStationCoord, isGeoConsistent } from "../../lib/geo";

interface TrainMapProps {
  trains: TrainType[];
  selectedTrainNumber?: string;
  onSelectTrain?: (train: TrainType) => void;
}

export default function TrainMap({
  trains,
  selectedTrainNumber,
  onSelectTrain,
}: TrainMapProps) {
  const [activeInspectTrain, setActiveInspectTrain] = useState<TrainType | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { theme } = useTheme();

  // Selected train takes precedence for inspection card if nothing is hovered
  const displayedTrain = activeInspectTrain || trains.find((t) => t.trainNumber === selectedTrainNumber) || trains[0];

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([22.5, 79.0], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing dynamic layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Track active React roots to unmount on layer removal
    const activeRoots: Array<{ unmount: () => void }> = [];

    // Process each train
    trains.forEach((train) => {
      const isSelected = selectedTrainNumber === train.trainNumber;

      // 1. Extract verified route coordinates from train stations
      const routeCoords: [number, number][] = [];
      const stationNodes: Array<{ name: string; code: string; lat: number; lng: number }> = [];

      if (train.stations && Array.isArray(train.stations)) {
        train.stations.forEach((st: any) => {
          let sLat = typeof st.lat === "number" ? st.lat : 0;
          let sLng = typeof st.lng === "number" ? st.lng : 0;
          const code = st.code || st.stationCode;

          if (sLat === 0 && sLng === 0 && code) {
            const resolved = getStationCoord(code);
            if (resolved) {
              sLat = resolved[0];
              sLng = resolved[1];
            }
          }

          if (sLat >= 6.0 && sLat <= 38.0 && sLng >= 68.0 && sLng <= 98.0) {
            routeCoords.push([sLat, sLng]);
            if (st.isHalt !== false && stationNodes.length < 25) {
              stationNodes.push({ name: st.name || code, code, lat: sLat, lng: sLng });
            }
          }
        });
      }

      // If stations list is empty, fallback to source/destination resolution
      if (routeCoords.length === 0) {
        const srcCoord = getStationCoord(train.sourceCode || train.source);
        const dstCoord = getStationCoord(train.destinationCode || train.destination);
        if (srcCoord && dstCoord) {
          routeCoords.push([srcCoord[0], srcCoord[1]]);
          routeCoords.push([dstCoord[0], dstCoord[1]]);
        }
      }

      // 2. Validate GPS coordinates
      const hasGps = Boolean(
        train.latitude &&
        train.longitude &&
        train.latitude !== 0 &&
        train.longitude !== 0 &&
        train.latitude >= 6.0 &&
        train.latitude <= 38.0 &&
        train.longitude >= 68.0 &&
        train.longitude <= 98.0
      );

      let isGeoValid = false;
      let isGpsInconsistent = false;

      if (hasGps) {
        const check = isGeoConsistent(train.latitude!, train.longitude!, routeCoords, 150);
        if (check.ok) {
          isGeoValid = true;
        } else {
          isGpsInconsistent = true;
        }
      }

      // Determine Case:
      // Case A: Valid GPS + Valid Route
      // Case B: Valid GPS + No Route
      // Case C: No GPS + Valid Route
      // Case D: No GPS + No Route
      // Case E: GPS exists but inconsistent with route

      // Draw Route Polyline if route exists (Cases A, C, E)
      if (routeCoords.length >= 2) {
        // Base route glow
        if (isSelected) {
          L.polyline(routeCoords, {
            color: '#3b82c4',
            weight: 5,
            opacity: 0.85,
          }).addTo(map);
        }

        // Regular route line
        L.polyline(routeCoords, {
          color: isSelected ? '#60a5fa' : (theme === 'dark' ? '#334155' : '#cbd5e1'),
          weight: isSelected ? 3 : 2,
          dashArray: isSelected ? undefined : '4 4',
          opacity: isSelected ? 1.0 : 0.6,
        }).addTo(map);

        // Draw station nodes along route if selected
        if (isSelected) {
          stationNodes.forEach((node) => {
            L.circleMarker([node.lat, node.lng], {
              radius: 3,
              color: '#3b82c4',
              fillColor: theme === 'dark' ? '#0f172a' : '#ffffff',
              fillOpacity: 1,
              weight: 1.5,
            })
              .bindTooltip(`${node.name} (${node.code})`, { permanent: false, direction: 'top' })
              .addTo(map);
          });
        }
      }

      // Draw Live Train Marker strictly when GPS is valid and geographically consistent (Cases A, B)
      if (hasGps && isGeoValid && !isGpsInconsistent) {
        const markerLat = train.latitude!;
        const markerLng = train.longitude!;

        const isDelayed = train.currentDelay > 30;
        const isSlight = train.currentDelay > 0 && train.currentDelay <= 30;

        const el = document.createElement('div');
        const root = createRoot(el);
        activeRoots.push(root);

        root.render(
          <div 
            className={cn(
              "relative w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-md",
              isDelayed
                ? "bg-rose-950 border-rose-500 text-rose-300"
                : isSlight
                  ? "bg-amber-950 border-amber-500 text-amber-300"
                  : "bg-blue-950 border-blue-500 text-blue-300",
              isSelected && "scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900 z-50",
              !isSelected && selectedTrainNumber && "opacity-60"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTrain?.(train);
            }}
            onMouseEnter={() => setActiveInspectTrain(train)}
            onMouseLeave={() => setActiveInspectTrain(null)}
          >
            <Navigation2 className="w-3 h-3 rotate-45" />

            {/* Pulse beacon for live GPS */}
            <span className={cn(
              "absolute -inset-1 rounded-full animate-ping opacity-25 pointer-events-none",
              isDelayed ? "bg-rose-500" : isSlight ? "bg-amber-500" : "bg-blue-500"
            )} />
            
            {/* Always show badge if selected */}
            {isSelected && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 text-zinc-100 text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-700 whitespace-nowrap shadow-sm pointer-events-none">
                #{train.trainNumber}
              </div>
            )}
          </div>
        );

        L.marker([markerLat, markerLng], {
          icon: L.divIcon({
            html: el,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
          zIndexOffset: isSelected ? 1000 : 100
        }).addTo(map);
      }

      // If selected train, auto-center view
      if (isSelected) {
        if (hasGps && isGeoValid && !isGpsInconsistent) {
          map.panTo([train.latitude!, train.longitude!], { animate: true });
        } else if (routeCoords.length > 0) {
          const bounds = L.latLngBounds(routeCoords);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
        }
      }
    });

    return () => {
      activeRoots.forEach((r) => {
        try {
          r.unmount();
        } catch {}
      });
    };
  }, [trains, selectedTrainNumber, theme, onSelectTrain]);

  // Determine current inspection train status banner
  const getTelemetryStatus = (train: TrainType | null) => {
    if (!train) return { label: "No Train Selected", color: "text-zinc-400 bg-zinc-800 border-zinc-700", icon: HelpCircle };

    const hasGps = Boolean(
      train.latitude &&
      train.longitude &&
      train.latitude !== 0 &&
      train.longitude !== 0 &&
      train.latitude >= 6.0 &&
      train.latitude <= 38.0 &&
      train.longitude >= 68.0 &&
      train.longitude <= 98.0
    );

    const hasRoute = Boolean(train.stations && train.stations.length > 0) || Boolean(train.source && train.destination);

    if (hasGps && train.isLiveLocationValid !== false) {
      return {
        label: "LIVE GPS · VERIFIED POSITION",
        color: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
        icon: ShieldCheck,
      };
    }

    if (hasGps && train.isLiveLocationValid === false) {
      return {
        label: "GPS INCONSISTENT · SHOWING ROUTE ONLY",
        color: "text-rose-400 bg-rose-950/60 border-rose-800",
        icon: AlertTriangle,
      };
    }

    if (hasRoute) {
      return {
        label: "GPS UNAVAILABLE · SHOWING STATIC ROUTE",
        color: "text-amber-400 bg-amber-950/60 border-amber-800",
        icon: Clock,
      };
    }

    return {
      label: "TELEMETRY & ROUTE UNAVAILABLE",
      color: "text-zinc-400 bg-zinc-800 border-zinc-700",
      icon: HelpCircle,
    };
  };

  const teleStatus = getTelemetryStatus(displayedTrain);

  return (
    <div className="nr-card p-4">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[var(--nr-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[var(--nr-accent)]" />
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">
              Network Operations Map
            </h3>
            <p className="text-[11px] text-[var(--nr-text-muted)]">
              Verified train coordinates and corridor paths (Geographically validated)
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[var(--nr-text-muted)]">Live Position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[var(--nr-text-muted)]">Route Static</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[var(--nr-text-muted)]">Delayed</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[460px] bg-[var(--nr-bg)] rounded-md border border-[var(--nr-border)] overflow-hidden select-none">
        <div ref={mapRef} className="w-full h-full" />

        {/* Docked Inspection Tooltip (Bottom Left) */}
        {displayedTrain && (
          <div className="absolute bottom-3 left-3 nr-card p-3 z-[1000] max-w-sm shadow-xl bg-[var(--nr-surface)]/95 backdrop-blur border border-[var(--nr-border)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--nr-border)] pb-1.5">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-[12px] font-bold text-[var(--nr-accent)]">
                    #{displayedTrain.trainNumber}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] border border-[var(--nr-border)]">
                    {displayedTrain.trainType || "Express"}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium border",
                    getStatusBg(displayedTrain.status)
                  )}
                >
                  {getStatusLabel(displayedTrain.status)}
                </span>
              </div>

              {/* Status Banner */}
              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold border", teleStatus.color)}>
                <teleStatus.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{teleStatus.label}</span>
              </div>

              <div className="text-[12px] font-medium text-[var(--nr-text)] truncate">
                {displayedTrain.trainName}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono text-[var(--nr-text-secondary)]">
                <div className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-[var(--nr-text-muted)]" />
                  <span>{displayedTrain.speed || 0} km/h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--nr-text-muted)]" />
                  <span>{formatDelay(displayedTrain.currentDelay)}</span>
                </div>
                <div className="flex items-center gap-1 col-span-2 text-[var(--nr-text-muted)] truncate">
                  <MapPin className="w-3 h-3 text-[var(--nr-text-muted)] shrink-0" />
                  <span>
                    {displayedTrain.currentStationCode} → {displayedTrain.nextStationCode} 
                    {displayedTrain.route ? ` (${displayedTrain.route})` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

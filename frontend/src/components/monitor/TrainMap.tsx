import { useState, useEffect, useRef } from "react";
import type { Train as TrainType } from "../../types";
import { cn, formatDelay, getStatusBg, getStatusLabel } from "../../lib/utils";
import { Radio, Navigation2, MapPin, Gauge, Clock } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from "../../contexts/ThemeContext";
import { createRoot } from "react-dom/client";

interface TrainMapProps {
  trains: TrainType[];
  selectedTrainNumber?: string;
  onSelectTrain?: (train: TrainType) => void;
}

interface StationNode {
  code: string;
  name: string;
  lat: number;
  lng: number;
  isHub?: boolean;
}

const keyStations: StationNode[] = [
  { code: "NDLS", name: "New Delhi", lat: 28.6433, lng: 77.2197, isHub: true },
  { code: "AGC", name: "Agra Cantt", lat: 27.1583, lng: 77.9892 },
  { code: "CNB", name: "Kanpur Central", lat: 26.4385, lng: 80.3255, isHub: true },
  { code: "ALD", name: "Prayagraj Jn", lat: 25.4411, lng: 81.8282 },
  { code: "DDU", name: "Pt. Deen Dayal Upadhyay", lat: 25.2818, lng: 83.1228 },
  { code: "PNBE", name: "Patna Jn", lat: 25.6022, lng: 85.1376 },
  { code: "DHN", name: "Dhanbad Jn", lat: 23.7885, lng: 86.4253 },
  { code: "HWH", name: "Howrah Jn", lat: 22.5833, lng: 88.3417, isHub: true },
  { code: "BPL", name: "Bhopal Jn", lat: 23.2642, lng: 77.4133, isHub: true },
  { code: "JHS", name: "Jhansi Jn", lat: 25.4415, lng: 78.5583 },
  { code: "BRC", name: "Vadodara Jn", lat: 22.3117, lng: 73.1812 },
  { code: "MMCT", name: "Mumbai Central", lat: 18.9696, lng: 72.8193, isHub: true },
  { code: "NGP", name: "Nagpur Jn", lat: 21.1478, lng: 79.0833, isHub: true },
  { code: "HYB", name: "Hyderabad", lat: 17.3917, lng: 78.4682 },
  { code: "BZA", name: "Vijayawada Jn", lat: 16.5186, lng: 80.6200 },
  { code: "SBC", name: "Bangalore City", lat: 12.9779, lng: 77.5667, isHub: true },
  { code: "MAS", name: "Chennai Central", lat: 13.0827, lng: 80.2707, isHub: true },
  { code: "TVC", name: "Trivandrum Central", lat: 8.4875, lng: 76.9525, isHub: true },
];

const railwayLines = [
  ["NDLS", "CNB", "ALD", "DDU", "PNBE", "DHN", "HWH"],
  ["NDLS", "AGC", "BRC", "MMCT"],
  ["NDLS", "AGC", "JHS", "BPL", "NGP", "BZA", "MAS"],
  ["MAS", "BZA", "HWH"],
  ["MAS", "SBC", "TVC"],
  ["NGP", "HYB", "BZA"],
];

const getStationCoords = (code: string) => {
  return keyStations.find((s) => s.code === code) || { lat: 21.1458, lng: 79.0882 };
};

export default function TrainMap({
  trains,
  selectedTrainNumber,
  onSelectTrain,
}: TrainMapProps) {
  const [activeInspectTrain, setActiveInspectTrain] = useState<TrainType | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { theme } = useTheme();

  // Selected train takes precedence for tooltip if nothing is hovered
  const displayedTrain = activeInspectTrain || trains.find((t) => t.trainNumber === selectedTrainNumber);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([22.5, 79.0], 5);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 20,
        }
      ).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing dynamic layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Draw static railway lines
    railwayLines.forEach((line) => {
      const coords = line.map(code => {
        const s = getStationCoords(code);
        return [s.lat, s.lng] as [number, number];
      });
      L.polyline(coords, {
        color: theme === 'dark' ? '#232938' : '#dfe2ea',
        weight: 3,
      }).addTo(map);
      
      L.polyline(coords, {
        color: theme === 'dark' ? '#2f3749' : '#c8cdd8',
        weight: 1,
        dashArray: '3 3',
      }).addTo(map);
    });

    // Draw key stations
    keyStations.forEach((st) => {
      const iconHtml = document.createElement('div');
      iconHtml.className = 'flex flex-col items-center justify-center -translate-y-2';
      
      const dot = document.createElement('div');
      dot.className = cn(
        'rounded-full border-2 transition-colors duration-150',
        st.isHub ? 'w-3 h-3' : 'w-2 h-2',
        theme === 'dark' ? 'bg-[#0a0c10] border-[#5c657a]' : 'bg-white border-[#8b93a5]'
      );
      
      const label = document.createElement('div');
      label.className = cn(
        'mt-1 font-mono text-[9px] font-semibold whitespace-nowrap',
        theme === 'dark' ? 'text-[#8b93a5]' : 'text-[#5c657a]'
      );
      label.innerText = st.code;
      
      iconHtml.appendChild(dot);
      if (st.isHub) iconHtml.appendChild(label);

      L.marker([st.lat, st.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })
      }).addTo(map);
    });

    // Draw live trains
    trains.forEach((train) => {
      const curr = getStationCoords(train.currentStationCode);
      const next = getStationCoords(train.nextStationCode);
      
      // Interpolate roughly
      const trainLat = curr.lat + (next.lat - curr.lat) * 0.45;
      const trainLng = curr.lng + (next.lng - curr.lng) * 0.45;

      const isSelected = selectedTrainNumber === train.trainNumber;
      const isDelayed = train.currentDelay > 30;
      const isSlight = train.currentDelay > 0 && train.currentDelay <= 30;

      const el = document.createElement('div');
      
      // We will render a React component inside the marker using createRoot
      const root = createRoot(el);
      
      root.render(
        <div 
          className={cn(
            "relative w-5 h-5 rounded-full border flex items-center justify-center transition-all shadow-xs cursor-pointer",
            isDelayed
              ? "bg-rose-950 border-[#c44a3e]/80 text-rose-300"
              : isSlight
                ? "bg-amber-950 border-[#c58f2a]/80 text-amber-300"
                : "bg-[#12151c] border-[#3b82c4] text-[#3b82c4]",
            isSelected && "scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#0a0c10] z-50",
            !isSelected && selectedTrainNumber && "opacity-45"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTrain?.(train);
          }}
          onMouseEnter={() => setActiveInspectTrain(train)}
          onMouseLeave={() => setActiveInspectTrain(null)}
        >
          <Navigation2 className="w-2.5 h-2.5 rotate-45" />
          
          {/* Always show badge if selected */}
          {isSelected && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-[#12151c]/95 text-[#e8eaf0] text-[9px] font-mono px-1.5 py-0.2 rounded border border-[#2f3749] whitespace-nowrap shadow-sm pointer-events-none">
              #{train.trainNumber}
            </div>
          )}
        </div>
      );

      const marker = L.marker([trainLat, trainLng], {
        icon: L.divIcon({
          html: el,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        zIndexOffset: isSelected ? 1000 : 0
      }).addTo(map);

      // Clean up React root on unmount of layer
      marker.on('remove', () => {
        setTimeout(() => root.unmount(), 0);
      });
    });

  }, [trains, selectedTrainNumber, theme, onSelectTrain]);

  return (
    <div className="nr-card p-4">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[var(--nr-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[var(--nr-accent)]" />
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">
              Network Map
            </h3>
            <p className="text-[11px] text-[var(--nr-text-muted)]">
              Live fleet position on trunk corridors
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[var(--nr-text-muted)]">On Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[var(--nr-text-muted)]">Delayed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[var(--nr-text-muted)]">Severe</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[440px] bg-[var(--nr-bg)] rounded-md border border-[var(--nr-border)] overflow-hidden select-none">
        <div ref={mapRef} className="w-full h-full" />

        {/* Docked Inspection Tooltip (Bottom Left) */}
        {displayedTrain && (
          <div className="absolute bottom-3 left-3 nr-card p-3 z-[1000] max-w-xs shadow-md pointer-events-none bg-[var(--nr-surface)]/95 backdrop-blur">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--nr-border)] pb-1.5">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-[12px] font-bold text-[var(--nr-accent)]">
                    #{displayedTrain.trainNumber}
                  </span>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)]">
                    {displayedTrain.locoType?.split(" ")[0] || "WAP-7"}
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

              <div className="text-[12px] font-medium text-[var(--nr-text)] truncate">
                {displayedTrain.trainName}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono text-[var(--nr-text-secondary)]">
                <div className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-[var(--nr-text-muted)]" />
                  <span>{displayedTrain.speed} km/h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--nr-text-muted)]" />
                  <span>{formatDelay(displayedTrain.currentDelay)}</span>
                </div>
                <div className="flex items-center gap-1 col-span-2 text-[var(--nr-text-muted)] truncate">
                  <MapPin className="w-3 h-3 text-[var(--nr-text-muted)] shrink-0" />
                  <span>{displayedTrain.currentStationCode} → {displayedTrain.nextStationCode} ({displayedTrain.blockOccupancy || "Main"})</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import {
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Sun,
  Thermometer,
  Droplets,
  Eye,
  Wind,
  AlertTriangle,
} from "lucide-react";
import type { WeatherData } from "../../types";

interface WeatherCardProps {
  weather: WeatherData;
}

const weatherIcons: Record<string, typeof Sun> = {
  sun: Sun,
  "cloud-sun": Cloud,
  "cloud-rain": CloudRain,
  "cloud-rain-wind": CloudRain,
  "cloud-fog": CloudFog,
  "cloud-lightning": CloudLightning,
};

export default function WeatherCard({ weather }: WeatherCardProps) {
  const WeatherIcon = weatherIcons[weather.icon] || Cloud;

  const isAdverse =
    weather.condition.toLowerCase().includes("heavy") ||
    weather.condition.toLowerCase().includes("storm") ||
    weather.condition.toLowerCase().includes("fog");

  return (
    <div className="nr-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--nr-border)] flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--nr-text)]">Weather</h3>
          <p className="text-[11px] text-[var(--nr-text-muted)] mt-0.5">{weather.station}</p>
        </div>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
          isAdverse ? "bg-[var(--nr-warning-muted)] text-[var(--nr-warning)]" : "bg-[var(--nr-accent-muted)] text-[var(--nr-accent)]"
        }`}>
          <WeatherIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Condition */}
      <div className="px-4 py-2.5 border-b border-[var(--nr-border)]/60">
        <p className="text-[13px] font-medium text-[var(--nr-text)]">{weather.condition}</p>
        <p className="text-[10px] text-[var(--nr-text-muted)] font-mono">
          {new Date(weather.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-[var(--nr-border)]/60">
        <div className="px-3 py-2.5 flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <div>
            <p className="text-[10px] text-[var(--nr-text-muted)]">Temp</p>
            <p className="text-[12px] font-semibold text-[var(--nr-text)] font-mono">{weather.temperature}°C</p>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-[var(--nr-accent)] shrink-0" />
          <div>
            <p className="text-[10px] text-[var(--nr-text-muted)]">Humidity</p>
            <p className="text-[12px] font-semibold text-[var(--nr-text)] font-mono">{weather.humidity}%</p>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-[var(--nr-text-secondary)] shrink-0" />
          <div>
            <p className="text-[10px] text-[var(--nr-text-muted)]">Visibility</p>
            <p className="text-[12px] font-semibold text-[var(--nr-text)] font-mono">{weather.visibility} km</p>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <div>
            <p className="text-[10px] text-[var(--nr-text-muted)]">Wind</p>
            <p className="text-[12px] font-semibold text-[var(--nr-text)] font-mono">{weather.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      {/* Advisory */}
      {weather.advisory && (
        <div className={`px-4 py-2.5 border-t border-[var(--nr-border)]/60 flex items-start gap-2 ${
          isAdverse ? "bg-[var(--nr-warning-muted)] text-[var(--nr-warning)]" : "text-[var(--nr-text-secondary)]"
        }`}>
          <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
            isAdverse ? "text-[var(--nr-warning)]" : "text-[var(--nr-text-muted)]"
          }`} />
          <p className="text-[12px] leading-relaxed">
            {weather.advisory}
          </p>
        </div>
      )}
    </div>
  );
}

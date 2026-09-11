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
  Info,
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
    <div className="app-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-100">Weather Context</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{weather.station}</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-800/60 rounded px-1.5 py-0.5 font-mono">
            <Info className="w-3 h-3" />
            Contextual
          </div>
        </div>
      </div>

      {/* Weather Main */}
      <div className="px-4 py-3.5 flex items-center gap-3.5 border-b border-zinc-800/60">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isAdverse ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"
        }`}>
          <WeatherIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">{weather.condition}</p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Updated {new Date(weather.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-zinc-800/60 bg-zinc-900/20">
        <div className="px-3.5 py-2.5 flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <div>
            <p className="text-[10px] text-zinc-500">Temperature</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono">{weather.temperature}°C</p>
          </div>
        </div>
        <div className="px-3.5 py-2.5 flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div>
            <p className="text-[10px] text-zinc-500">Humidity</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono">{weather.humidity}%</p>
          </div>
        </div>
        <div className="px-3.5 py-2.5 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <div>
            <p className="text-[10px] text-zinc-500">Visibility</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono">{weather.visibility} km</p>
          </div>
        </div>
        <div className="px-3.5 py-2.5 flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <div>
            <p className="text-[10px] text-zinc-500">Wind Speed</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono">{weather.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      {/* Advisory */}
      {weather.advisory && (
        <div className={`px-4 py-2.5 border-t border-zinc-800/60 flex items-start gap-2 ${
          isAdverse ? "bg-amber-500/5 text-amber-300" : "bg-zinc-900/40 text-zinc-400"
        }`}>
          <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
            isAdverse ? "text-amber-400" : "text-zinc-500"
          }`} />
          <p className="text-xs leading-relaxed">
            {weather.advisory}
          </p>
        </div>
      )}
    </div>
  );
}

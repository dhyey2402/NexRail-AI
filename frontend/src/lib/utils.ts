import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDelay(minutes: number): string {
  if (minutes === 0) return "On time";
  if (minutes < 0) return `${Math.abs(minutes)}m early`;
  if (minutes < 60) return `+${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `+${hrs}h ${mins}m`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "on-time":
    case "accurate":
      return "text-emerald-400";
    case "slight-delay":
    case "close":
      return "text-amber-400";
    case "delayed":
      return "text-amber-500";
    case "severe-delay":
    case "missed":
      return "text-rose-400";
    case "cancelled":
      return "text-zinc-400";
    default:
      return "text-zinc-400";
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case "on-time":
    case "accurate":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "slight-delay":
    case "close":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "delayed":
      return "bg-amber-500/15 text-amber-300 border-amber-500/25";
    case "severe-delay":
    case "missed":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "cancelled":
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
    default:
      return "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "on-time": return "On Time";
    case "slight-delay": return "Slight Delay";
    case "delayed": return "Delayed";
    case "severe-delay": return "Severe Delay";
    case "cancelled": return "Cancelled";
    case "arrived": return "Arrived";
    case "accurate": return "Accurate";
    case "close": return "Close";
    case "missed": return "Missed";
    default: return status;
  }
}

export function getConfidenceColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-amber-400";
  return "text-rose-400";
}

export function getConfidenceBg(score: number): string {
  if (score >= 90) return "stroke-emerald-500";
  if (score >= 75) return "stroke-amber-500";
  return "stroke-rose-500";
}

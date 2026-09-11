import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function minutesFromNow(epochMs: number, nowMs: number) {
  return Math.max(0, Math.round((epochMs - nowMs) / 60000))
}

export function delayLabel(minutes: number) {
  if (minutes <= 0) return 'On time'
  return `+${minutes} min`
}

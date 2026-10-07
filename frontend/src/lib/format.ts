import type { Settings } from './types'

export const tzs = (n: number | null | undefined) =>
  n == null ? '—' : `TZS ${Math.round(n).toLocaleString('en-US')}`

export const num = (n: number | null | undefined, digits = 0) =>
  n == null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: digits })

/** Price per kg shown in the user's preferred unit (kg or 100 kg bag). */
export function unitPrice(pricePerKg: number | null | undefined, settings?: Settings) {
  if (pricePerKg == null) return '—'
  if (settings?.price_unit === 'bag') return `${tzs(pricePerKg * 100)} / bag`
  return `${tzs(pricePerKg)} / kg`
}

export const shortDate = (iso: string) =>
  new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const longDate = (iso: string) =>
  new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const dateTime = (iso: string) =>
  new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export const initials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

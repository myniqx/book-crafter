import { useToolsStore } from '@renderer/store'

function getSettings() {
  return useToolsStore.getState().generalSettings
}

function getLocale(): string {
  const { defaultLanguage } = getSettings()
  return defaultLanguage === 'tr' ? 'tr-TR' : 'en-GB'
}

/**
 * Format an ISO date string according to the user's dateFormat setting.
 * DD/MM/YYYY → 31/12/2025
 * MM/DD/YYYY → 12/31/2025
 * YYYY-MM-DD → 2025-12-31
 */
export function formatDate(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(date.getTime())) return ''

  const { dateFormat } = getSettings()
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()

  switch (dateFormat) {
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`
    case 'YYYY-MM-DD': return `${y}-${m}-${d}`
    default:           return `${d}/${m}/${y}`
  }
}

/**
 * Format an ISO date string according to the user's timeFormat setting.
 * 24h → 15:30
 * 12h → 3:30 PM
 */
export function formatTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(date.getTime())) return ''

  const { timeFormat } = getSettings()
  return date.toLocaleTimeString(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h'
  })
}

/**
 * Format an ISO date string as date + time.
 */
export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(date.getTime())) return ''
  return `${formatDate(date)} ${formatTime(date)}`
}

/**
 * Relative time for recent events ("just now", "5m ago", "2h ago"),
 * falls back to formatDate for older dates.
 */
export function formatRelativeTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(date.getTime())) return ''

  const diff = Date.now() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return formatDate(date)
}

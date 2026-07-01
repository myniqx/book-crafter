import { useStore } from '@renderer/store'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

// In verbose mode: all levels pass. Otherwise: warn and error only.
const QUIET_MIN_LEVEL: LogLevel = 'warn'
const VERBOSE_MIN_LEVEL: LogLevel = 'debug'

function isVerbose(): boolean {
  try {
    return useStore.getState().advancedSettings.verboseLogging
  } catch {
    return false
  }
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = isVerbose() ? VERBOSE_MIN_LEVEL : QUIET_MIN_LEVEL
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel]
}

function formatPrefix(level: LogLevel, context?: string): string {
  const tag = context ? `[${context}]` : ''
  return `[book-crafter][${level}]${tag}`
}

export const logger = {
  debug(message: string, context?: string, ...args: unknown[]): void {
    if (!shouldLog('debug')) return
    console.debug(`${formatPrefix('debug', context)} ${message}`, ...args)
  },

  info(message: string, context?: string, ...args: unknown[]): void {
    if (!shouldLog('info')) return
    console.info(`${formatPrefix('info', context)} ${message}`, ...args)
  },

  warn(message: string, context?: string, ...args: unknown[]): void {
    if (!shouldLog('warn')) return
    console.warn(`${formatPrefix('warn', context)} ${message}`, ...args)
  },

  error(message: string, context?: string, ...args: unknown[]): void {
    if (!shouldLog('error')) return
    console.error(`${formatPrefix('error', context)} ${message}`, ...args)
  }
}

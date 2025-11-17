import { useState, useEffect, useCallback } from 'react'
import { fs } from '@renderer/lib/ipc'

/**
 * IPC-based localStorage replacement
 * Stores data in JSON file via IPC filesystem operations
 *
 * Similar to localStorage API but persists to disk
 *
 * @example
 * const [recentProjects, setRecentProjects] = usePersistedStore<string[]>('recentProjects', [])
 */

interface UsePersistedStoreOptions {
  /**
   * Custom storage path (default: userData/store)
   */
  storagePath?: string

  /**
   * Debounce write operations (ms)
   */
  debounce?: number
}

// Get user data path from Electron app.getPath
let userDataPath: string | null = null
async function getUserDataPath(): Promise<string> {
  if (!userDataPath) {
    try {
      // Use Electron's app.getPath('userData') via IPC
      const api = window.api as any
      if (api.app?.getPath) {
        userDataPath = await api.app.getPath('userData')
      } else {
        // Fallback: construct path manually if IPC not available
        userDataPath = process.platform === 'win32'
          ? `${process.env.APPDATA}/book-crafter`
          : process.platform === 'darwin'
            ? `${process.env.HOME}/Library/Application Support/book-crafter`
            : `${process.env.HOME}/.config/book-crafter`
      }
    } catch (error) {
      console.error('Failed to get user data path:', error)
      // Final fallback
      userDataPath = process.platform === 'win32'
        ? `${process.env.APPDATA}/book-crafter`
        : process.platform === 'darwin'
          ? `${process.env.HOME}/Library/Application Support/book-crafter`
          : `${process.env.HOME}/.config/book-crafter`
    }
  }
  return userDataPath
}

async function getDefaultStorageDir(): Promise<string> {
  const userData = await getUserDataPath()
  return `${userData}/store`
}

// In-memory cache to avoid excessive disk reads
const cache = new Map<string, unknown>()

// Pending write operations (for debouncing)
const pendingWrites = new Map<string, NodeJS.Timeout>()

/**
 * Get storage file path for a key
 */
async function getStoragePath(key: string, customPath?: string): Promise<string> {
  const storageDir = customPath || await getDefaultStorageDir()
  return `${storageDir}/${key}.json`
}

/**
 * Read value from disk
 */
async function readFromDisk<T>(key: string, defaultValue: T, storagePath?: string): Promise<T> {
  try {
    const filePath = await getStoragePath(key, storagePath)

    // Check if file exists
    const exists = await fs.exists(filePath)
    if (!exists) {
      return defaultValue
    }

    // Read and parse JSON
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content) as T

    // Update cache
    cache.set(key, parsed)

    return parsed
  } catch (error) {
    console.error(`[usePersistedStore] Failed to read ${key}:`, error)
    return defaultValue
  }
}

/**
 * Write value to disk
 */
async function writeToDisk<T>(
  key: string,
  value: T,
  storagePath?: string,
  immediate = false
): Promise<void> {
  // Cancel pending write if exists
  const pending = pendingWrites.get(key)
  if (pending && !immediate) {
    clearTimeout(pending)
  }

  const performWrite = async () => {
    try {
      const filePath = await getStoragePath(key, storagePath)
      const storageDir = filePath.substring(0, filePath.lastIndexOf('/'))

      // Ensure storage directory exists
      const dirExists = await fs.exists(storageDir)
      if (!dirExists) {
        await fs.mkdir(storageDir, true)
      }

      // Write JSON with backup
      const content = JSON.stringify(value, null, 2)
      await fs.writeFile(filePath, content, true) // backup enabled

      // Update cache
      cache.set(key, value)

      pendingWrites.delete(key)
    } catch (error) {
      console.error(`[usePersistedStore] Failed to write ${key}:`, error)
      throw error
    }
  }

  if (immediate) {
    await performWrite()
  } else {
    // Debounce writes (default 500ms)
    const timeout = setTimeout(performWrite, 500)
    pendingWrites.set(key, timeout)
  }
}

/**
 * Hook for persisted state
 */
export function usePersistedStore<T>(
  key: string,
  defaultValue: T,
  options?: UsePersistedStoreOptions
): [T, (value: T | ((prev: T) => T)) => void, { loading: boolean; error: Error | null }] {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load initial value from disk
  useEffect(() => {
    let mounted = true

    const loadValue = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache first
        if (cache.has(key)) {
          const cached = cache.get(key) as T
          if (mounted) {
            setValue(cached)
            setLoading(false)
          }
          return
        }

        // Read from disk
        const stored = await readFromDisk(key, defaultValue, options?.storagePath)
        if (mounted) {
          setValue(stored)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    loadValue()

    return () => {
      mounted = false
    }
  }, [key, defaultValue, options?.storagePath])

  // Persist value to disk when it changes
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolvedValue = typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(prev)
          : newValue

        // Write to disk (debounced)
        writeToDisk(key, resolvedValue, options?.storagePath, false).catch((err) => {
          console.error(`[usePersistedStore] Failed to persist ${key}:`, err)
          setError(err instanceof Error ? err : new Error(String(err)))
        })

        return resolvedValue
      })
    },
    [key, options?.storagePath]
  )

  return [value, updateValue, { loading, error }]
}

/**
 * Remove a key from persisted storage
 */
export async function removePersistedKey(key: string, storagePath?: string): Promise<void> {
  const filePath = await getStoragePath(key, storagePath)

  try {
    const exists = await fs.exists(filePath)
    if (exists) {
      await fs.delete(filePath)
    }

    cache.delete(key)

    const pending = pendingWrites.get(key)
    if (pending) {
      clearTimeout(pending)
      pendingWrites.delete(key)
    }
  } catch (error) {
    console.error(`[usePersistedStore] Failed to remove ${key}:`, error)
    throw error
  }
}

/**
 * Clear all persisted storage
 */
export async function clearPersistedStore(storagePath?: string): Promise<void> {
  const storageDir = storagePath || await getDefaultStorageDir()

  try {
    const exists = await fs.exists(storageDir)
    if (exists) {
      await fs.delete(storageDir)
    }

    cache.clear()
    pendingWrites.forEach((timeout) => clearTimeout(timeout))
    pendingWrites.clear()
  } catch (error) {
    console.error('[usePersistedStore] Failed to clear storage:', error)
    throw error
  }
}

import type { IPCBridge, FetchOptions, FetchResponse, StreamOptions } from '../../../types/ipc'

/**
 * IPC Client Utilities
 * Provides a type-safe wrapper around the IPC bridge with error handling,
 * loading states, and operation queuing.
 */

// Error class for user-friendly error messages
export class IPCClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'IPCClientError'
  }
}

// Get IPC bridge from window
function getAPI(): IPCBridge {
  if (!window.api) {
    throw new IPCClientError('IPC bridge not available', 'IPC_NOT_AVAILABLE')
  }
  return window.api as unknown as IPCBridge
}

// Convert IPC errors to user-friendly messages
function handleIPCError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const ipcError = error as { code: string; message: string; details?: unknown }

    switch (ipcError.code) {
      case 'FILE_NOT_FOUND':
        throw new IPCClientError('File or directory not found', ipcError.code, ipcError.details)
      case 'PERMISSION_DENIED':
        throw new IPCClientError('Permission denied', ipcError.code, ipcError.details)
      case 'INVALID_PATH':
        throw new IPCClientError('Invalid file path', ipcError.code, ipcError.details)
      case 'NETWORK_ERROR':
        throw new IPCClientError('Network request failed', ipcError.code, ipcError.details)
      case 'TIMEOUT':
        throw new IPCClientError('Request timed out', ipcError.code, ipcError.details)
      default:
        throw new IPCClientError(
          ipcError.message || 'An unknown error occurred',
          ipcError.code,
          ipcError.details
        )
    }
  }

  throw new IPCClientError(
    error instanceof Error ? error.message : 'An unknown error occurred',
    'UNKNOWN',
    error
  )
}

// File operation queue to prevent race conditions
type QueuedOperation<T> = () => Promise<T>
const operationQueue = new Map<string, Promise<unknown>>()

async function queueOperation<T>(key: string, operation: QueuedOperation<T>): Promise<T> {
  // Wait for any pending operation on this key
  const pending = operationQueue.get(key)
  if (pending) {
    await pending.catch(() => {
      /* ignore errors from previous operations */
    })
  }

  // Execute operation
  const promise = operation()
  operationQueue.set(key, promise)

  try {
    return await promise
  } finally {
    // Clean up if this was the last operation
    if (operationQueue.get(key) === promise) {
      operationQueue.delete(key)
    }
  }
}

// Retry logic for transient failures
async function retry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry for certain error types
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        ['INVALID_PATH', 'PERMISSION_DENIED', 'FILE_NOT_FOUND'].includes(
          (error as { code: string }).code
        )
      ) {
        throw error
      }

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }

  throw lastError
}

/**
 * File System Operations
 */
export const fs = {
  /**
   * Read file contents
   */
  async readFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    try {
      const api = getAPI()
      return await retry(() => api.fs.readFile(path, { encoding }))
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Write file contents with optional backup
   */
  async writeFile(path: string, content: string, backup = false): Promise<void> {
    try {
      const api = getAPI()
      await queueOperation(`write:${path}`, () =>
        api.fs.writeFile(path, content, { encoding: 'utf-8', backup })
      )
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Read directory contents
   */
  async readDir(path: string, recursive = false): Promise<string[]> {
    try {
      const api = getAPI()
      return await api.fs.readDir(path, { recursive })
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Create directory
   */
  async mkdir(path: string, recursive = true): Promise<void> {
    try {
      const api = getAPI()
      await api.fs.mkdir(path, recursive)
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Delete file or directory
   */
  async delete(path: string): Promise<void> {
    try {
      const api = getAPI()
      await queueOperation(`delete:${path}`, () => api.fs.delete(path))
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Move or rename file
   */
  async move(oldPath: string, newPath: string): Promise<void> {
    try {
      const api = getAPI()
      await queueOperation(`move:${oldPath}`, () => api.fs.move(oldPath, newPath))
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Copy file
   */
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      const api = getAPI()
      await queueOperation(`copy:${sourcePath}`, () => api.fs.copyFile(sourcePath, destPath))
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      const api = getAPI()
      return await api.fs.exists(path)
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Get file stats
   */
  async stats(path: string) {
    try {
      const api = getAPI()
      return await api.fs.stats(path)
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Watch file or directory for changes
   */
  async watch(
    path: string,
    callback: (event: string, filename: string) => void
  ): Promise<() => void> {
    try {
      const api = getAPI()
      return await api.fs.watch(path, callback)
    } catch (error) {
      handleIPCError(error)
    }
  }
}

/**
 * HTTP Fetch Operations
 */
export const http = {
  /**
   * Make HTTP request
   */
  async request<T = unknown>(url: string, options?: FetchOptions): Promise<FetchResponse<T>> {
    try {
      const api = getAPI()
      return await retry(() => api.fetch.request<T>(url, options))
    } catch (error) {
      handleIPCError(error)
    }
  },

  /**
   * Make HTTP GET request
   */
  async get<T = unknown>(url: string, options?: Omit<FetchOptions, 'method'>): Promise<T> {
    const response = await this.request<FetchResponse<T>>(url, { ...options, method: 'GET' })
    return response.data as T
  },

  /**
   * Make HTTP POST request
   */
  async post<T = unknown>(
    url: string,
    body?: Record<string, unknown> | string,
    options?: Omit<FetchOptions, 'method' | 'body'>
  ): Promise<T> {
    const response = await this.request<FetchResponse<T>>(url, {
      ...options,
      method: 'POST',
      body
    })
    return response.data as T
  },

  /**
   * Make HTTP PUT request
   */
  async put<T = unknown>(
    url: string,
    body?: Record<string, unknown> | string,
    options?: Omit<FetchOptions, 'method' | 'body'>
  ): Promise<T> {
    const response = await this.request<FetchResponse<T>>(url, {
      ...options,
      method: 'PUT',
      body
    })
    return response.data as T
  },

  /**
   * Make HTTP DELETE request
   */
  async delete<T = unknown>(url: string, options?: Omit<FetchOptions, 'method'>): Promise<T> {
    const response = await this.request<FetchResponse<T>>(url, { ...options, method: 'DELETE' })
    return response.data as T
  },

  /**
   * Stream HTTP response (for AI chat)
   */
  async stream(url: string, options: StreamOptions): Promise<void> {
    try {
      const api = getAPI()
      await api.fetch.stream(url, options)
    } catch (error) {
      handleIPCError(error)
    }
  }
}

/**
 * Default export with all IPC utilities
 */
export default {
  fs,
  http
}
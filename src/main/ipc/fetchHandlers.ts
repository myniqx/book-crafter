import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { FetchOptions, FetchResponse, StreamOptions, IPCError } from '../../types/ipc'

function createIPCError(message: string, code: string, details?: unknown): IPCError {
  const error = new Error(message) as IPCError
  error.code = code
  error.details = details
  return error
}

// Active requests that can be cancelled via fetch:abort.
// userAborted distinguishes user cancellation from timeout — both fire AbortError.
const activeRequests = new Map<string, { controller: AbortController; userAborted: boolean }>()

function registerAbortable(requestId: string | undefined, controller: AbortController): void {
  if (requestId) {
    activeRequests.set(requestId, { controller, userAborted: false })
  }
}

function unregisterAbortable(requestId: string | undefined): void {
  if (requestId) {
    activeRequests.delete(requestId)
  }
}

function wasUserAborted(requestId: string | undefined): boolean {
  if (!requestId) return false
  return activeRequests.get(requestId)?.userAborted === true
}

export function registerFetchHandlers(): void {
  // Abort an in-flight request by id
  ipcMain.handle('fetch:abort', async (_event: IpcMainInvokeEvent, requestId: string) => {
    const entry = activeRequests.get(requestId)
    if (!entry) return false
    entry.userAborted = true
    entry.controller.abort()
    return true
  })

  // HTTP Request
  ipcMain.handle(
    'fetch:request',
    async (_event: IpcMainInvokeEvent, url: string, options?: FetchOptions) => {
      try {
        const method = options?.method || 'GET'
        const headers = options?.headers || {}
        const timeout = options?.timeout || 30000 // 30s default

        // Create abort controller for timeout and user cancellation
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        registerAbortable(options?.requestId, controller)

        // Prepare body
        let body: string | undefined
        if (options?.body) {
          if (typeof options.body === 'string') {
            body = options.body
          } else {
            body = JSON.stringify(options.body)
            headers['Content-Type'] = headers['Content-Type'] || 'application/json'
          }
        }

        // Make request
        let response: Response
        try {
          response = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal
          })
        } finally {
          clearTimeout(timeoutId)
        }

        // Parse response
        const contentType = response.headers.get('content-type') || ''
        let data: unknown

        if (contentType.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }

        // Build response object
        const result: FetchResponse = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data
        }

        return result
      } catch (error: unknown) {
        if ((error as Error).name === 'AbortError') {
          if (wasUserAborted(options?.requestId)) {
            throw createIPCError('Request aborted by user', 'ABORTED', { url })
          }
          throw createIPCError('Request timeout', 'TIMEOUT', { url, timeout: options?.timeout })
        }
        throw createIPCError(
          `Network request failed: ${(error as Error).message}`,
          'NETWORK_ERROR',
          error
        )
      } finally {
        unregisterAbortable(options?.requestId)
      }
    }
  )

  // Stream Request (for AI responses)
  ipcMain.handle(
    'fetch:stream',
    async (
      event: IpcMainInvokeEvent,
      url: string,
      options: Omit<StreamOptions, 'onChunk' | 'onError' | 'onComplete'>
    ) => {
      try {
        const method = options?.method || 'POST'
        const headers = options?.headers || {}
        const timeout = options?.timeout || 120000 // 2 minutes for streaming

        // Prepare body
        let body: string | undefined
        if (options?.body) {
          if (typeof options.body === 'string') {
            body = options.body
          } else {
            body = JSON.stringify(options.body)
            headers['Content-Type'] = headers['Content-Type'] || 'application/json'
          }
        }

        // Create abort controller for timeout and user cancellation
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        registerAbortable(options?.requestId, controller)

        // Make streaming request
        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal
        })

        if (!response.ok) {
          clearTimeout(timeoutId)
          throw createIPCError(`HTTP ${response.status}: ${response.statusText}`, 'NETWORK_ERROR', {
            status: response.status
          })
        }

        if (!response.body) {
          clearTimeout(timeoutId)
          throw createIPCError('No response body for streaming', 'NETWORK_ERROR')
        }

        // Read stream
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              clearTimeout(timeoutId)
              event.sender.send('fetch:stream:complete', { url })
              break
            }

            // Decode and send chunk
            const chunk = decoder.decode(value, { stream: true })
            event.sender.send('fetch:stream:chunk', { url, chunk })
          }
        } catch (streamError: unknown) {
          clearTimeout(timeoutId)
          event.sender.send('fetch:stream:error', {
            url,
            error: (streamError as Error).message
          })
          throw streamError
        }
      } catch (error: unknown) {
        if ((error as Error).name === 'AbortError') {
          if (wasUserAborted(options?.requestId)) {
            throw createIPCError('Stream aborted by user', 'ABORTED', { url })
          }
          throw createIPCError('Stream timeout', 'TIMEOUT', { url, timeout: options?.timeout })
        }
        throw createIPCError(
          `Streaming request failed: ${(error as Error).message}`,
          'NETWORK_ERROR',
          error
        )
      } finally {
        unregisterAbortable(options?.requestId)
      }
    }
  )
}

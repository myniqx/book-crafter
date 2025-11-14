import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { FetchOptions, FetchResponse, StreamOptions, IPCError } from '../../types/ipc'

function createIPCError(message: string, code: string, details?: unknown): IPCError {
  const error = new Error(message) as IPCError
  error.code = code
  error.details = details
  return error
}

export function registerFetchHandlers(): void {
  // HTTP Request
  ipcMain.handle(
    'fetch:request',
    async (_event: IpcMainInvokeEvent, url: string, options?: FetchOptions) => {
      try {
        const method = options?.method || 'GET'
        const headers = options?.headers || {}
        const timeout = options?.timeout || 30000 // 30s default

        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

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
        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

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
          throw createIPCError('Request timeout', 'TIMEOUT', { url, timeout: options?.timeout })
        }
        throw createIPCError(
          `Network request failed: ${(error as Error).message}`,
          'NETWORK_ERROR',
          error
        )
      }
    }
  )

  // Stream Request (for AI responses)
  ipcMain.handle(
    'fetch:stream',
    async (event: IpcMainInvokeEvent, url: string, options: Omit<StreamOptions, 'onChunk' | 'onError' | 'onComplete'>) => {
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

        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        // Make streaming request
        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal
        })

        if (!response.ok) {
          clearTimeout(timeoutId)
          throw createIPCError(
            `HTTP ${response.status}: ${response.statusText}`,
            'NETWORK_ERROR',
            { status: response.status }
          )
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
          throw createIPCError('Stream timeout', 'TIMEOUT', { url, timeout: options?.timeout })
        }
        throw createIPCError(
          `Streaming request failed: ${(error as Error).message}`,
          'NETWORK_ERROR',
          error
        )
      }
    }
  )
}

/**
 * Common error handling utilities for AI providers
 */

/**
 * Handle API errors with consistent formatting
 */
export function handleAPIError(
  error: unknown,
  provider: string,
  context: string
): Error {
  if (error instanceof Error) {
    console.error(`${provider} ${context} error:`, error)
    return new Error(`${provider} request failed: ${error.message}`)
  }
  console.error(`${provider} ${context} error:`, error)
  return new Error(`${provider} request failed: Unknown error`)
}

/**
 * Parse error response from different provider formats
 */
export function parseErrorResponse(
  data: unknown
): { message: string; details?: unknown } | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  // OpenAI/Anthropic format: { error: { message: "..." } }
  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>
    return {
      message: String(err.message || 'Unknown error'),
      details: err
    }
  }

  // Ollama format: { error: "..." }
  if (obj.error && typeof obj.error === 'string') {
    return { message: obj.error }
  }

  return null
}

/**
 * Parse response data from fetch response
 */
export function parseResponseData(response: unknown): Record<string, unknown> {
  if (typeof response === 'string') {
    try {
      return JSON.parse(response)
    } catch {
      return {}
    }
  }
  return (response as Record<string, unknown>) || {}
}

/**
 * Extract error message from fetch response
 */
export function extractErrorMessage(
  fetchResponse: {
    ok: boolean
    status: number
    statusText: string
    data: unknown
  }
): string {
  const errorData = parseResponseData(fetchResponse.data)
  const errorInfo = parseErrorResponse(errorData)
  return errorInfo?.message || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
}

/**
 * Validation utilities for AI providers
 */

import type { AIProvider } from '../types'

// Extended provider type that includes future providers
export type AIProviderType = AIProvider | 'gemini'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate API key for providers that require it
 */
export function validateAPIKey(
  apiKey: string | undefined,
  provider: AIProviderType
): ValidationResult {
  // Providers that require API key
  const requiresKey: AIProviderType[] = ['openai', 'anthropic', 'gemini']

  if (requiresKey.includes(provider) && !apiKey) {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
    return {
      isValid: false,
      error: `${providerName} API key is required`
    }
  }

  return { isValid: true }
}

/**
 * Validate that fetch API is available
 */
export function validateFetchAPI(forStreaming: boolean = false): ValidationResult {
  if (!window.api?.fetch?.request) {
    return {
      isValid: false,
      error: 'Fetch API not available'
    }
  }

  if (forStreaming && !window.api?.fetch?.stream) {
    return {
      isValid: false,
      error: 'Fetch streaming API not available'
    }
  }

  return { isValid: true }
}

/**
 * Validate endpoint URL
 */
export function validateEndpoint(endpoint: string | undefined): ValidationResult {
  if (!endpoint) {
    return { isValid: true } // Will use default
  }

  try {
    new URL(endpoint)
    return { isValid: true }
  } catch {
    return {
      isValid: false,
      error: `Invalid endpoint URL: ${endpoint}`
    }
  }
}

/**
 * Validate model name
 */
export function validateModel(model: string | undefined, provider: AIProviderType): ValidationResult {
  if (!model) {
    return {
      isValid: false,
      error: 'Model name is required'
    }
  }

  return { isValid: true }
}

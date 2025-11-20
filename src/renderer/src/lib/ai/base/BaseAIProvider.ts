/**
 * Base class for AI providers with common functionality
 */

import type {
  AIConfig,
  AIProviderInterface,
  AIRequestOptions,
  AIResponse,
  StreamCallback,
  StreamCallbackExtended,
  ToolDefinition,
  ToolCall
} from '../types'

import {
  handleAPIError,
  parseResponseData,
  extractErrorMessage,
  validateAPIKey,
  validateFetchAPI,
  buildContextAwareSystemPrompt,
  type AIProviderType
} from '../utils'

/**
 * Abstract base class for AI providers
 * Implements common functionality and defines abstract methods for provider-specific logic
 */
export abstract class BaseAIProvider implements AIProviderInterface {
  protected config: AIConfig
  protected providerName: string
  protected providerType: AIProviderType

  constructor(config: AIConfig, providerName: string, providerType: AIProviderType) {
    this.config = config
    this.providerName = providerName
    this.providerType = providerType
  }

  /**
   * Legacy callback adapter - same for all providers
   */
  async streamComplete(options: AIRequestOptions, callback: StreamCallback): Promise<void> {
    await this.streamCompleteExtended(options, (event) => {
      if (event.type === 'text') {
        callback(event.content, event.done)
      } else if (event.type === 'done') {
        callback('', true)
      }
    })
  }

  /**
   * Abstract methods that must be implemented by each provider
   */
  abstract complete(options: AIRequestOptions): Promise<AIResponse>

  abstract streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void>

  abstract testConnection(): Promise<boolean>

  /**
   * Optional method - providers can override if they support listing models
   */
  async listModels(): Promise<string[]> {
    return []
  }

  /**
   * Protected utility methods for use by subclasses
   */

  /**
   * Validate credentials (API key) for the provider
   */
  protected validateCredentials(): void {
    const validation = validateAPIKey(this.config.apiKey, this.providerType)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }
  }

  /**
   * Validate that fetch API is available
   */
  protected validateFetchAPI(forStreaming: boolean = false): void {
    const validation = validateFetchAPI(forStreaming)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }
  }

  /**
   * Handle fetch response errors uniformly
   */
  protected async handleFetchError(fetchResponse: {
    ok: boolean
    status: number
    statusText: string
    data: unknown
  }): Promise<void> {
    if (!fetchResponse.ok) {
      throw new Error(extractErrorMessage(fetchResponse))
    }
  }

  /**
   * Wrap error with provider context
   */
  protected wrapError(error: unknown, context: string): Error {
    return handleAPIError(error, this.providerName, context)
  }

  /**
   * Build system prompt with context
   */
  protected buildSystemPrompt(options: AIRequestOptions): string {
    return buildContextAwareSystemPrompt(options.context, options.systemPrompt)
  }

  /**
   * Parse response data from fetch response
   */
  protected parseResponse(data: unknown): Record<string, unknown> {
    return parseResponseData(data)
  }

  /**
   * Abstract methods for provider-specific implementations
   */

  /**
   * Convert tool definitions to provider-specific format
   */
  protected abstract convertTools(tools: ToolDefinition[]): unknown[]

  /**
   * Parse tool calls from provider response
   */
  protected abstract parseToolCalls(responseData: unknown): ToolCall[]

  /**
   * Build messages array for the provider
   */
  protected abstract buildMessages(options: AIRequestOptions): unknown[]

  /**
   * Get API endpoint URL
   */
  protected abstract getApiUrl(): string

  /**
   * Get request headers
   */
  protected abstract getHeaders(): Record<string, string>
}

/**
 * Export base class
 */
export default BaseAIProvider

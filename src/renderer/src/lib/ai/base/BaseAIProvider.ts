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
  buildNormalizedHistory,
  toOpenAITools,
  type AIProviderType,
  type NormalizedMessage,
  type OpenAITool
} from '../utils'

export abstract class BaseAIProvider implements AIProviderInterface {
  protected config: AIConfig
  protected providerName: string
  protected providerType: AIProviderType
  private modelsCache: string[] | null = null

  constructor(config: AIConfig, providerName: string, providerType: AIProviderType) {
    this.config = config
    this.providerName = providerName
    this.providerType = providerType
  }

  // Legacy callback adapter
  async streamComplete(options: AIRequestOptions, callback: StreamCallback): Promise<void> {
    await this.streamCompleteExtended(options, (event) => {
      if (event.type === 'text') {
        callback(event.content, event.done)
      } else if (event.type === 'done') {
        callback('', true)
      }
    })
  }

  abstract complete(options: AIRequestOptions): Promise<AIResponse>
  abstract streamCompleteExtended(options: AIRequestOptions, callback: StreamCallbackExtended): Promise<void>
  abstract testConnection(): Promise<boolean>

  /**
   * Default: OpenAI-compatible tool format. Ollama and OpenAI use this as-is.
   * Anthropic and Gemini override.
   */
  protected convertTools(tools: ToolDefinition[]): OpenAITool[] {
    return toOpenAITools(tools)
  }

  /**
   * Default: builds OpenAI-style messages [{role, content}].
   * Providers with different message shapes (Gemini) override this.
   * Anthropic overrides only to handle content-block format.
   */
  protected buildMessages(options: AIRequestOptions): unknown[] {
    const systemPrompt = this.buildSystemPrompt(options)
    const history = buildNormalizedHistory(options)

    const messages: unknown[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    for (const msg of history) {
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
          }))
        })
      } else if (msg.role === 'tool_result' && msg.toolResult) {
        messages.push({
          role: 'tool',
          tool_call_id: msg.toolResult.toolCallId,
          content: msg.toolResult.content
        })
      } else {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    return messages
  }

  /**
   * listModels with cache — providers override fetchModels() instead
   */
  async listModels(): Promise<string[]> {
    if (this.modelsCache) return this.modelsCache
    const models = await this.fetchModels()
    if (models.length > 0) this.modelsCache = models
    return models
  }

  protected async fetchModels(): Promise<string[]> {
    return []
  }

  protected validateCredentials(): void {
    const validation = validateAPIKey(this.config.apiKey, this.providerType)
    if (!validation.isValid) throw new Error(validation.error)
  }

  protected validateFetchAPI(forStreaming: boolean = false): void {
    const validation = validateFetchAPI(forStreaming)
    if (!validation.isValid) throw new Error(validation.error)
  }

  protected async handleFetchError(fetchResponse: {
    ok: boolean
    status: number
    statusText: string
    data: unknown
  }): Promise<void> {
    if (!fetchResponse.ok) throw new Error(extractErrorMessage(fetchResponse))
  }

  protected wrapError(error: unknown, context: string): Error {
    return handleAPIError(error, this.providerName, context)
  }

  protected buildSystemPrompt(options: AIRequestOptions): string {
    return buildContextAwareSystemPrompt(options.context, options.systemPrompt)
  }

  protected parseResponse(data: unknown): Record<string, unknown> {
    return parseResponseData(data)
  }

  protected abstract parseToolCalls(responseData: unknown): ToolCall[]
  protected abstract getApiUrl(): string
  protected abstract getHeaders(): Record<string, string>
}

export { type NormalizedMessage, type OpenAITool }
export default BaseAIProvider

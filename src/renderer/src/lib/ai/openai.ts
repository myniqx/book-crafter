import { BaseAIProvider } from './base'
import type {
  AIConfig,
  AIRequestOptions,
  AIResponse,
  StreamCallbackExtended,
  ToolCall
} from './types'
import { parseResponseData, createStreamHandler, parseOpenAIStream } from './utils'

export class OpenAIProvider extends BaseAIProvider {
  private apiUrl = 'https://api.openai.com/v1/chat/completions'

  constructor(config: AIConfig) {
    super(config, 'OpenAI', 'openai')
  }

  protected getApiUrl(): string {
    return this.apiUrl
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`
    }
  }

  protected parseToolCalls(responseData: unknown): ToolCall[] {
    const data = responseData as Record<string, unknown>
    const choices = data.choices as Array<{
      message?: { tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> }
    }>
    const toolCalls = choices?.[0]?.message?.tool_calls ?? []

    return toolCalls.map((tc) => {
      let args: Record<string, unknown> = {}
      try { args = JSON.parse(tc.function.arguments || '{}') } catch { /* invalid JSON */ }
      return { id: tc.id, name: tc.function.name, arguments: args }
    })
  }

  private convertToolChoice(
    toolChoice: AIRequestOptions['toolChoice']
  ): 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } } | undefined {
    if (!toolChoice || toolChoice === 'auto') return 'auto'
    if (toolChoice === 'none') return 'none'
    if (toolChoice === 'required') return 'required'
    if (typeof toolChoice === 'object' && toolChoice.type === 'tool') {
      return { type: 'function', function: { name: toolChoice.name } }
    }
    return 'auto'
  }

  async complete(options: AIRequestOptions): Promise<AIResponse> {
    try {
      this.validateCredentials()
      this.validateFetchAPI()

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages: this.buildMessages(options),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      }

      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        body.tool_choice = this.convertToolChoice(options.toolChoice)
      }

      const fetchResponse = await window.api.fetch.request(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        requestId: options.requestId
      })

      if (!fetchResponse.ok) {
        const errorData = parseResponseData(fetchResponse.data)
        throw new Error(
          (((errorData as Record<string, unknown>)?.error as Record<string, unknown>)?.message as string) ||
          `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
        )
      }

      const data = parseResponseData(fetchResponse.data)
      const choices = (data as Record<string, unknown>).choices as Array<{
        message?: { content?: string }
        finish_reason?: string
      }>
      const choice = choices?.[0]
      if (!choice) throw new Error('No response from OpenAI')

      const toolCalls = this.parseToolCalls(data)
      const usage = (data as Record<string, unknown>).usage as Record<string, number>

      let finishReason: 'stop' | 'length' | 'error' | 'tool_use' = 'stop'
      if (choice.finish_reason === 'tool_calls') finishReason = 'tool_use'
      else if (choice.finish_reason === 'length') finishReason = 'length'

      return {
        content: choice.message?.content || '',
        finishReason,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0
        }
      }
    } catch (error) {
      throw this.wrapError(error, 'completion')
    }
  }

  async streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void> {
    try {
      this.validateCredentials()
      this.validateFetchAPI(true)

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages: this.buildMessages(options),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      }

      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        body.tool_choice = this.convertToolChoice(options.toolChoice)
      }

      const toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }> = new Map()

      const streamHandler = createStreamHandler(
        (chunk) => parseOpenAIStream(chunk, toolCallsInProgress),
        callback
      )

      await window.api.fetch.stream(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        requestId: options.requestId,
        ...streamHandler
      })
    } catch (error) {
      callback({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      throw this.wrapError(error, 'streaming')
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) return false
    try {
      this.validateFetchAPI()
      const fetchResponse = await window.api.fetch.request('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.config.apiKey}` }
      })
      return fetchResponse.ok
    } catch {
      return false
    }
  }

  protected async fetchModels(): Promise<string[]> {
    if (!this.config.apiKey) return []
    try {
      this.validateFetchAPI()
      const fetchResponse = await window.api.fetch.request('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.config.apiKey}` }
      })
      if (!fetchResponse.ok) return []
      const data = parseResponseData(fetchResponse.data)
      const models = (data as Record<string, unknown>).data as Array<{ id: string }>
      return Array.isArray(models)
        ? models.map((m) => m.id).filter((id) => id.startsWith('gpt-')).sort()
        : []
    } catch {
      return []
    }
  }
}

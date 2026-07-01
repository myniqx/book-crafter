import { BaseAIProvider } from './base'
import type {
  AIConfig,
  AIRequestOptions,
  AIResponse,
  StreamCallbackExtended,
  ToolCall
} from './types'
import { parseResponseData, createStreamHandler, parseOllamaStream, buildNormalizedHistory } from './utils'

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: Array<{ function: { name: string; arguments: Record<string, unknown> } }>
}

export class OllamaProvider extends BaseAIProvider {
  constructor(config: AIConfig) {
    super(config, 'Ollama', 'ollama')
  }

  protected getApiUrl(): string {
    return this.config.endpoint || 'http://localhost:11434'
  }

  protected getHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' }
  }

  // Ollama uses 'tool' role (not 'tool_result') and no tool_call_id — needs its own mapper
  protected buildMessages(options: AIRequestOptions): OllamaMessage[] {
    const systemPrompt = this.buildSystemPrompt(options)
    const history = buildNormalizedHistory(options)
    const messages: OllamaMessage[] = []

    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })

    for (const msg of history) {
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: msg.content || '',
          tool_calls: msg.toolCalls.map((tc) => ({
            function: { name: tc.name, arguments: tc.arguments }
          }))
        })
      } else if (msg.role === 'tool_result' && msg.toolResult) {
        messages.push({ role: 'tool', content: msg.toolResult.content })
      } else {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content })
      }
    }

    return messages
  }

  protected parseToolCalls(responseData: unknown): ToolCall[] {
    const data = responseData as Record<string, unknown>
    const message = data.message as Record<string, unknown> | undefined
    const rawCalls = message?.tool_calls as Array<{
      function: { name: string; arguments: Record<string, unknown> }
    }> | undefined

    return (rawCalls ?? []).map((tc) => ({
      id: `ollama-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: tc.function.name,
      arguments: tc.function.arguments || {}
    }))
  }

  private buildBody(options: AIRequestOptions, stream: boolean): { url: string; body: Record<string, unknown> } {
    const endpoint = this.getApiUrl()
    const hasTools = (options.tools?.length ?? 0) > 0
    const hasHistory = (options.context?.conversationHistory?.length ?? 0) > 0
    const useChat = hasTools || hasHistory

    const common = {
      model: this.config.model,
      stream,
      options: { temperature: this.config.temperature, num_predict: this.config.maxTokens },
      keep_alive: this.config.keepAlive || '5m'
    }

    if (useChat) {
      const body: Record<string, unknown> = { ...common, messages: this.buildMessages(options) }
      if (hasTools) body.tools = this.convertTools(options.tools!)
      return { url: `${endpoint}/api/chat`, body }
    }

    return {
      url: `${endpoint}/api/generate`,
      body: { ...common, prompt: options.prompt }
    }
  }

  async complete(options: AIRequestOptions): Promise<AIResponse> {
    try {
      this.validateFetchAPI()
      const { url, body } = this.buildBody(options, false)

      const fetchResponse = await window.api.fetch.request(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        requestId: options.requestId
      })

      if (!fetchResponse.ok) {
        const errorData = parseResponseData(fetchResponse.data)
        throw new Error(
          ((errorData as Record<string, unknown>)?.error as string) ||
          `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
        )
      }

      const data = parseResponseData(fetchResponse.data)
      if (data.error) throw new Error(data.error as string)

      const usage = {
        promptTokens: (data.prompt_eval_count as number) || 0,
        completionTokens: (data.eval_count as number) || 0,
        totalTokens: ((data.prompt_eval_count as number) || 0) + ((data.eval_count as number) || 0)
      }

      if (data.message) {
        const toolCalls = this.parseToolCalls(data)
        return {
          content: ((data.message as Record<string, unknown>)?.content as string) || '',
          finishReason: toolCalls.length > 0 ? 'tool_use' : 'stop',
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          usage
        }
      }

      return {
        content: (data.response as string) || '',
        finishReason: data.done ? 'stop' : 'length',
        usage
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
      this.validateFetchAPI(true)
      const { url, body } = this.buildBody(options, true)
      const useChat = url.endsWith('/api/chat')

      const streamHandler = createStreamHandler(
        (chunk) => parseOllamaStream(chunk, useChat),
        callback
      )

      await window.api.fetch.stream(url, {
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
    try {
      this.validateFetchAPI()
      const fetchResponse = await window.api.fetch.request(
        `${this.getApiUrl()}/api/tags`,
        { method: 'GET' }
      )
      return fetchResponse.ok
    } catch {
      return false
    }
  }

  protected async fetchModels(): Promise<string[]> {
    try {
      this.validateFetchAPI()
      const fetchResponse = await window.api.fetch.request(
        `${this.getApiUrl()}/api/tags`,
        { method: 'GET' }
      )
      if (!fetchResponse.ok) return []
      const data = parseResponseData(fetchResponse.data)
      return Array.isArray(data.models)
        ? (data.models as Array<{ name: string }>).map((m) => m.name)
        : []
    } catch {
      return []
    }
  }
}

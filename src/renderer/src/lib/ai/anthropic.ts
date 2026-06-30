import { BaseAIProvider } from './base'
import type {
  AIConfig,
  AIRequestOptions,
  AIResponse,
  StreamCallbackExtended,
  ToolDefinition,
  ToolCall
} from './types'
import { parseResponseData, createStreamHandler, parseAnthropicStream, buildNormalizedHistory } from './utils'

interface AnthropicTextContent { type: 'text'; text: string }
interface AnthropicToolUseContent { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
interface AnthropicToolResultContent { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
type AnthropicContent = AnthropicTextContent | AnthropicToolUseContent | AnthropicToolResultContent

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContent[]
}

interface AnthropicTool {
  name: string
  description: string
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
}

export class AnthropicProvider extends BaseAIProvider {
  private apiUrl = 'https://api.anthropic.com/v1/messages'

  constructor(config: AIConfig) {
    super(config, 'Anthropic', 'anthropic')
  }

  protected getApiUrl(): string {
    return this.apiUrl
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey || '',
      'anthropic-version': '2023-06-01'
    }
  }

  // Anthropic uses content-block arrays instead of plain strings
  protected buildMessages(options: AIRequestOptions): AnthropicMessage[] {
    const history = buildNormalizedHistory(options)
    const messages: AnthropicMessage[] = []

    for (const msg of history) {
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        const content: AnthropicContent[] = []
        if (msg.content) content.push({ type: 'text', text: msg.content })
        msg.toolCalls.forEach((tc) =>
          content.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.arguments })
        )
        messages.push({ role: 'assistant', content })
      } else if (msg.role === 'tool_result' && msg.toolResult) {
        messages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: msg.toolResult.toolCallId,
            content: msg.toolResult.content,
            is_error: msg.toolResult.isError
          }]
        })
      } else {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content })
      }
    }

    return messages
  }

  // Anthropic uses input_schema instead of parameters
  protected convertTools(tools: ToolDefinition[]): AnthropicTool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.parameters.properties,
        required: tool.parameters.required
      }
    }))
  }

  private convertToolChoice(
    toolChoice: AIRequestOptions['toolChoice']
  ): { type: 'auto' | 'any' | 'tool'; name?: string } | undefined {
    if (!toolChoice || toolChoice === 'auto') return { type: 'auto' }
    if (toolChoice === 'none') return undefined
    if (toolChoice === 'required') return { type: 'any' }
    if (typeof toolChoice === 'object' && toolChoice.type === 'tool') {
      return { type: 'tool', name: toolChoice.name }
    }
    return { type: 'auto' }
  }

  protected parseToolCalls(responseData: unknown): ToolCall[] {
    const data = responseData as Record<string, unknown>
    if (!Array.isArray(data.content)) return []

    return (data.content as AnthropicContent[])
      .filter((b): b is AnthropicToolUseContent => b.type === 'tool_use')
      .map((b) => ({ id: b.id, name: b.name, arguments: b.input }))
  }

  async complete(options: AIRequestOptions): Promise<AIResponse> {
    try {
      this.validateCredentials()
      this.validateFetchAPI()

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages: this.buildMessages(options),
        system: this.buildSystemPrompt(options),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      }

      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        const toolChoice = this.convertToolChoice(options.toolChoice)
        if (toolChoice) body.tool_choice = toolChoice
      }

      const fetchResponse = await window.api.fetch.request(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      })

      if (!fetchResponse.ok) {
        const errorData = parseResponseData(fetchResponse.data)
        throw new Error(
          (((errorData as Record<string, unknown>)?.error as Record<string, unknown>)?.message as string) ||
          `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
        )
      }

      const data = parseResponseData(fetchResponse.data)
      if ((data as Record<string, unknown>).error) {
        throw new Error(((data as Record<string, unknown>).error as Record<string, unknown>).message as string)
      }

      let textContent = ''
      const toolCalls = this.parseToolCalls(data)

      if (Array.isArray(data.content)) {
        for (const block of data.content as AnthropicContent[]) {
          if (block.type === 'text') textContent += (block as AnthropicTextContent).text
        }
      }

      const usage = (data as Record<string, unknown>).usage as Record<string, number>
      const stopReason = (data as Record<string, unknown>).stop_reason as string

      let finishReason: 'stop' | 'length' | 'error' | 'tool_use' = 'stop'
      if (stopReason === 'tool_use') finishReason = 'tool_use'
      else if (stopReason === 'max_tokens') finishReason = 'length'

      return {
        content: textContent,
        finishReason,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: usage?.input_tokens || 0,
          completionTokens: usage?.output_tokens || 0,
          totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0)
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
        system: this.buildSystemPrompt(options),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      }

      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        const toolChoice = this.convertToolChoice(options.toolChoice)
        if (toolChoice) body.tool_choice = toolChoice
      }

      const currentTool = { id: '', name: '', input: '' }

      const streamHandler = createStreamHandler(
        (chunk) => parseAnthropicStream(chunk, currentTool),
        callback
      )

      await window.api.fetch.stream(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
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
      const result = await this.complete({ prompt: 'Hi', context: undefined })
      return !!result.content
    } catch {
      return false
    }
  }

  protected async fetchModels(): Promise<string[]> {
    // Anthropic does not expose a public models list endpoint — fall back to a static list
    return [
      'claude-opus-4-8',
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-1-20250805',
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku-20241022'
    ]
  }
}

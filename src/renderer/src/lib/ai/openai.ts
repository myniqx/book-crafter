/**
 * OpenAI AI Provider - Refactored with BaseAIProvider
 */

import { BaseAIProvider } from './base'
import type {
  AIConfig,
  AIRequestOptions,
  AIResponse,
  StreamCallbackExtended,
  AIMessage,
  ToolDefinition,
  ToolCall
} from './types'
import { parseResponseData, createStreamHandler, parseOpenAIStream } from './utils'

/**
 * OpenAI message types
 */
interface OpenAITextMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIToolCallMessage {
  role: 'assistant'
  content: string | null
  tool_calls: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

interface OpenAIToolResultMessage {
  role: 'tool'
  tool_call_id: string
  content: string
}

type OpenAIMessage = OpenAITextMessage | OpenAIToolCallMessage | OpenAIToolResultMessage

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

/**
 * OpenAI AI Provider
 */
export class OpenAIProvider extends BaseAIProvider {
  private apiUrl = 'https://api.openai.com/v1/chat/completions'

  constructor(config: AIConfig) {
    super(config, 'OpenAI', 'openai')
  }

  /**
   * Get API endpoint URL
   */
  protected getApiUrl(): string {
    return this.apiUrl
  }

  /**
   * Get request headers
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`
    }
  }

  /**
   * Build messages array with tool support
   */
  protected buildMessages(options: AIRequestOptions): OpenAIMessage[] {
    const messages: OpenAIMessage[] = []

    // System message
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(options)
    })

    // Conversation history
    if (options.context?.conversationHistory) {
      options.context.conversationHistory.forEach((msg: AIMessage) => {
        if (msg.role === 'system') return

        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          messages.push({
            role: 'assistant',
            content: msg.content || null,
            tool_calls: msg.toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.arguments)
              }
            }))
          })
        } else if (msg.role === 'tool_result' && msg.toolResult) {
          messages.push({
            role: 'tool',
            tool_call_id: msg.toolResult.toolCallId,
            content: msg.toolResult.content
          })
        } else {
          messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content })
        }
      })
    }

    // User prompt
    messages.push({ role: 'user', content: options.prompt })

    return messages
  }

  /**
   * Convert tool definitions to OpenAI format
   */
  protected convertTools(tools: ToolDefinition[]): OpenAITool[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.properties,
          required: tool.parameters.required
        }
      }
    }))
  }

  /**
   * Convert tool choice to OpenAI format
   */
  private convertToolChoice(
    toolChoice: AIRequestOptions['toolChoice']
  ): 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } } | undefined {
    if (!toolChoice) return 'auto'
    if (toolChoice === 'auto') return 'auto'
    if (toolChoice === 'none') return 'none'
    if (toolChoice === 'required') return 'required'
    if (typeof toolChoice === 'object' && toolChoice.type === 'tool') {
      return { type: 'function', function: { name: toolChoice.name } }
    }
    return 'auto'
  }

  /**
   * Parse tool calls from OpenAI response
   */
  protected parseToolCalls(responseData: unknown): ToolCall[] {
    const data = responseData as Record<string, unknown>
    const toolCalls: ToolCall[] = []

    const choices = data.choices as Array<{
      message?: {
        tool_calls?: Array<{
          id: string
          function: { name: string; arguments: string }
        }>
      }
    }>

    const choice = choices?.[0]
    if (choice?.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        let parsedArgs: Record<string, unknown> = {}
        try {
          parsedArgs = JSON.parse(tc.function.arguments || '{}')
        } catch {
          // Invalid JSON
        }
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: parsedArgs
        })
      }
    }

    return toolCalls
  }

  /**
   * Complete (non-streaming) with tool support
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    try {
      this.validateCredentials()
      this.validateFetchAPI()

      const messages = this.buildMessages(options)

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      }

      // Add tools if provided
      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        body.tool_choice = this.convertToolChoice(options.toolChoice)
      }

      const fetchResponse = await window.api.fetch.request(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      })

      if (!fetchResponse.ok) {
        const errorData = parseResponseData(fetchResponse.data)
        throw new Error(
          (((errorData as Record<string, unknown>)?.error as Record<string, unknown>)
            ?.message as string) || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
        )
      }

      const data = parseResponseData(fetchResponse.data)

      if ((data as Record<string, unknown>).error) {
        const error = (data as Record<string, unknown>).error as Record<string, unknown>
        throw new Error((error.message as string) || 'OpenAI API error')
      }

      const choices = (data as Record<string, unknown>).choices as Array<{
        message?: { content?: string }
        finish_reason?: string
      }>
      const choice = choices?.[0]
      if (!choice) {
        throw new Error('No response from OpenAI')
      }

      const toolCalls = this.parseToolCalls(data)
      const usage = (data as Record<string, unknown>).usage as Record<string, number>

      // Map finish reason to our type
      let finishReason: 'stop' | 'length' | 'error' | 'tool_use' = 'stop'
      if (choice.finish_reason === 'tool_calls') {
        finishReason = 'tool_use'
      } else if (choice.finish_reason === 'length') {
        finishReason = 'length'
      }

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

  /**
   * Stream complete with full tool support
   */
  async streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void> {
    try {
      this.validateCredentials()
      this.validateFetchAPI(true)

      const messages = this.buildMessages(options)

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      }

      // Add tools if provided
      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        body.tool_choice = this.convertToolChoice(options.toolChoice)
      }

      // Track tool calls being built
      const toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }> =
        new Map()

      const streamHandler = createStreamHandler(
        (chunk) => parseOpenAIStream(chunk, toolCallsInProgress),
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

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    try {
      this.validateFetchAPI()

      const fetchResponse = await window.api.fetch.request('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      })

      return fetchResponse.ok
    } catch {
      return false
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    if (!this.config.apiKey) {
      return []
    }

    try {
      this.validateFetchAPI()

      const fetchResponse = await window.api.fetch.request('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      })

      if (!fetchResponse.ok) {
        return []
      }

      const data = parseResponseData(fetchResponse.data)
      const models = (data as Record<string, unknown>).data as Array<{ id: string }>

      if (models && Array.isArray(models)) {
        return models
          .map((m) => m.id)
          .filter((id) => id.startsWith('gpt-'))
          .sort()
      }

      return []
    } catch {
      return []
    }
  }
}

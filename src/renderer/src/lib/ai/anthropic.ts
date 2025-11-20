/**
 * Anthropic (Claude) AI Provider - Refactored with BaseAIProvider
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
import { parseResponseData, createStreamHandler, parseAnthropicStream } from './utils'

/**
 * Anthropic message content types
 */
interface AnthropicTextContent {
  type: 'text'
  text: string
}

interface AnthropicToolUseContent {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

interface AnthropicToolResultContent {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}

type AnthropicContent = AnthropicTextContent | AnthropicToolUseContent | AnthropicToolResultContent

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContent[]
}

interface AnthropicTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

/**
 * Anthropic (Claude) AI Provider
 */
export class AnthropicProvider extends BaseAIProvider {
  private apiUrl = 'https://api.anthropic.com/v1/messages'

  constructor(config: AIConfig) {
    super(config, 'Anthropic', 'anthropic')
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
      'x-api-key': this.config.apiKey || '',
      'anthropic-version': '2023-06-01'
    }
  }

  /**
   * Build messages array with tool support
   */
  protected buildMessages(options: AIRequestOptions): AnthropicMessage[] {
    const messages: AnthropicMessage[] = []

    // Conversation history
    if (options.context?.conversationHistory) {
      options.context.conversationHistory.forEach((msg: AIMessage) => {
        if (msg.role === 'system') return

        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          const content: AnthropicContent[] = []

          if (msg.content) {
            content.push({ type: 'text', text: msg.content })
          }

          msg.toolCalls.forEach((tc) => {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.arguments
            })
          })

          messages.push({ role: 'assistant', content })
        } else if (msg.role === 'tool_result' && msg.toolResult) {
          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: msg.toolResult.toolCallId,
                content: msg.toolResult.content,
                is_error: msg.toolResult.isError
              }
            ]
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
   * Convert tool definitions to Anthropic format
   */
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

  /**
   * Convert tool choice to Anthropic format
   */
  private convertToolChoice(
    toolChoice: AIRequestOptions['toolChoice']
  ): { type: 'auto' | 'any' | 'tool'; name?: string } | undefined {
    if (!toolChoice) return { type: 'auto' }
    if (toolChoice === 'auto') return { type: 'auto' }
    if (toolChoice === 'none') return undefined
    if (toolChoice === 'required') return { type: 'any' }
    if (typeof toolChoice === 'object' && toolChoice.type === 'tool') {
      return { type: 'tool', name: toolChoice.name }
    }
    return { type: 'auto' }
  }

  /**
   * Parse tool calls from Anthropic response
   */
  protected parseToolCalls(responseData: unknown): ToolCall[] {
    const data = responseData as Record<string, unknown>
    const toolCalls: ToolCall[] = []

    if (Array.isArray(data.content)) {
      for (const block of data.content) {
        const contentBlock = block as AnthropicContent
        if (contentBlock.type === 'tool_use') {
          const toolUse = contentBlock as AnthropicToolUseContent
          toolCalls.push({
            id: toolUse.id,
            name: toolUse.name,
            arguments: toolUse.input
          })
        }
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
      const system = this.buildSystemPrompt(options)

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages,
        system,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      }

      // Add tools if provided
      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        const toolChoice = this.convertToolChoice(options.toolChoice)
        if (toolChoice) {
          body.tool_choice = toolChoice
        }
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
        throw new Error((error.message as string) || 'Anthropic API error')
      }

      // Extract text content and tool calls
      let textContent = ''
      const toolCalls = this.parseToolCalls(data)

      if (Array.isArray(data.content)) {
        for (const block of data.content) {
          const contentBlock = block as AnthropicContent
          if (contentBlock.type === 'text') {
            textContent += (contentBlock as AnthropicTextContent).text
          }
        }
      }

      const usage = (data as Record<string, unknown>).usage as Record<string, number>
      const stopReason = (data as Record<string, unknown>).stop_reason as string

      // Map stop reason to our type
      let finishReason: 'stop' | 'length' | 'error' | 'tool_use' = 'stop'
      if (stopReason === 'tool_use') {
        finishReason = 'tool_use'
      } else if (stopReason === 'max_tokens') {
        finishReason = 'length'
      }

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
      const system = this.buildSystemPrompt(options)

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages,
        system,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      }

      // Add tools if provided
      if (options.tools && options.tools.length > 0) {
        body.tools = this.convertTools(options.tools)
        const toolChoice = this.convertToolChoice(options.toolChoice)
        if (toolChoice) {
          body.tool_choice = toolChoice
        }
      }

      // Track current tool call being built
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

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    try {
      // Try a minimal request
      const result = await this.complete({
        prompt: 'Hi',
        context: undefined
      })

      return !!result.content
    } catch {
      return false
    }
  }
}

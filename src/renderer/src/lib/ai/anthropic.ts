import type {
  AIConfig,
  AIProviderInterface,
  AIRequestOptions,
  AIResponse,
  StreamCallback,
  StreamCallbackExtended,
  AIMessage,
  ToolDefinition,
  ToolCall
} from './types'
import { buildContextPrompt } from './types'

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
export class AnthropicProvider implements AIProviderInterface {
  private config: AIConfig
  private apiUrl = 'https://api.anthropic.com/v1/messages'

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * Build messages array with tool support
   */
  private buildMessages(options: AIRequestOptions): AnthropicMessage[] {
    const messages: AnthropicMessage[] = []

    // Conversation history
    if (options.context?.conversationHistory) {
      options.context.conversationHistory.forEach((msg: AIMessage) => {
        if (msg.role === 'system') return

        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          // Assistant message with tool calls
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
          // Tool result message
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
          // Regular text message
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
  private convertTools(tools: ToolDefinition[]): AnthropicTool[] {
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
   * Build system prompt
   */
  private buildSystemPrompt(options: AIRequestOptions): string {
    const parts: string[] = []

    if (options.systemPrompt) {
      parts.push(options.systemPrompt)
    } else {
      parts.push(
        'You are an AI writing assistant for a book authoring tool. Help authors with creative writing, grammar, character development, and plot consistency.'
      )
    }

    if (options.context) {
      const contextPrompt = buildContextPrompt(options.context)
      parts.push('\n\n' + contextPrompt)
    }

    return parts.join('\n')
  }

  /**
   * Complete (non-streaming) with tool support
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

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

    try {
      if (!window.api?.fetch?.request) {
        throw new Error('Fetch API not available')
      }

      const fetchResponse = await window.api.fetch.request(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      })

      // fetchResponse is { ok, status, statusText, headers, data }
      if (!fetchResponse.ok) {
        const errorData = typeof fetchResponse.data === 'string' ? JSON.parse(fetchResponse.data) : fetchResponse.data
        throw new Error(errorData?.error?.message || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`)
      }

      const data = typeof fetchResponse.data === 'string' ? JSON.parse(fetchResponse.data) : fetchResponse.data

      if (data.error) {
        throw new Error(data.error.message || 'Anthropic API error')
      }

      // Extract text content and tool calls
      let textContent = ''
      const toolCalls: ToolCall[] = []

      if (Array.isArray(data.content)) {
        for (const block of data.content) {
          if (block.type === 'text') {
            textContent += block.text
          } else if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              name: block.name,
              arguments: block.input
            })
          }
        }
      }

      return {
        content: textContent,
        finishReason: data.stop_reason === 'tool_use' ? 'tool_use' : data.stop_reason || 'stop',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      }
    } catch (error) {
      console.error('Anthropic completion error:', error)
      throw new Error(
        `Anthropic request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Stream complete (legacy callback)
   */
  async streamComplete(options: AIRequestOptions, callback: StreamCallback): Promise<void> {
    // Convert legacy callback to extended callback
    await this.streamCompleteExtended(options, (event) => {
      if (event.type === 'text') {
        callback(event.content, event.done)
      } else if (event.type === 'done') {
        callback('', true)
      }
    })
  }

  /**
   * Stream complete with full tool support
   */
  async streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

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

    try {
      if (!window.api?.fetch?.stream) {
        throw new Error('Fetch streaming API not available')
      }

      // Track current tool call being built
      let currentToolId = ''
      let currentToolName = ''
      let currentToolInput = ''
      const toolCalls: ToolCall[] = []

      await window.api.fetch.stream(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body),
        onChunk: (chunk: string) => {
          // Anthropic sends SSE format: "event: ...\ndata: {...}\n\n"
          const lines = chunk.split('\n')

          lines.forEach((line) => {
            if (line.startsWith('data:')) {
              const data = line.replace(/^data:\s*/, '').trim()

              try {
                const parsed = JSON.parse(data)

                // Content block start
                if (parsed.type === 'content_block_start') {
                  if (parsed.content_block?.type === 'tool_use') {
                    currentToolId = parsed.content_block.id
                    currentToolName = parsed.content_block.name
                    currentToolInput = ''
                    callback({
                      type: 'tool_call_start',
                      toolCall: {
                        id: currentToolId,
                        name: currentToolName
                      }
                    })
                  }
                }

                // Content block delta
                if (parsed.type === 'content_block_delta') {
                  if (parsed.delta?.type === 'text_delta' && parsed.delta?.text) {
                    callback({ type: 'text', content: parsed.delta.text, done: false })
                  } else if (
                    parsed.delta?.type === 'input_json_delta' &&
                    parsed.delta?.partial_json
                  ) {
                    currentToolInput += parsed.delta.partial_json
                    callback({
                      type: 'tool_call_delta',
                      id: currentToolId,
                      arguments: parsed.delta.partial_json
                    })
                  }
                }

                // Content block stop
                if (parsed.type === 'content_block_stop') {
                  if (currentToolId && currentToolName) {
                    let parsedArgs: Record<string, unknown> = {}
                    try {
                      parsedArgs = JSON.parse(currentToolInput || '{}')
                    } catch {
                      // Invalid JSON, use empty object
                    }
                    const toolCall: ToolCall = {
                      id: currentToolId,
                      name: currentToolName,
                      arguments: parsedArgs
                    }
                    toolCalls.push(toolCall)
                    callback({ type: 'tool_call_end', toolCall })
                    currentToolId = ''
                    currentToolName = ''
                    currentToolInput = ''
                  }
                }

                // Message complete
                if (parsed.type === 'message_stop') {
                  callback({ type: 'done', finishReason: 'stop' })
                }

                // Message delta (for stop reason)
                if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                  callback({
                    type: 'done',
                    finishReason: parsed.delta.stop_reason === 'tool_use' ? 'tool_use' : 'stop'
                  })
                }
              } catch (error) {
                console.error('Failed to parse Anthropic stream chunk:', error)
              }
            }
          })
        },
        onError: (error: Error) => {
          console.error('Stream error:', error)
          callback({ type: 'error', error: error.message })
        },
        onComplete: () => {
          // Stream completed
        }
      })
    } catch (error) {
      console.error('Anthropic streaming error:', error)
      callback({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error(
        `Anthropic streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
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
        context: undefined,
        stream: false
      })

      return !!result.content
    } catch {
      return false
    }
  }
}

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
export class OpenAIProvider implements AIProviderInterface {
  private config: AIConfig
  private apiUrl = 'https://api.openai.com/v1/chat/completions'

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * Build messages array with tool support
   */
  private buildMessages(options: AIRequestOptions): OpenAIMessage[] {
    const messages: OpenAIMessage[] = []

    // System message
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    } else {
      messages.push({
        role: 'system',
        content:
          'You are an AI writing assistant for a book authoring tool. Help authors with creative writing, grammar, character development, and plot consistency.'
      })
    }

    // Context
    if (options.context) {
      const contextPrompt = buildContextPrompt(options.context)
      messages.push({ role: 'system', content: contextPrompt })

      // Conversation history
      if (options.context.conversationHistory) {
        options.context.conversationHistory.forEach((msg: AIMessage) => {
          if (msg.role === 'system') return

          if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
            // Assistant message with tool calls
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
            // Tool result message
            messages.push({
              role: 'tool',
              tool_call_id: msg.toolResult.toolCallId,
              content: msg.toolResult.content
            })
          } else {
            // Regular text message
            messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content })
          }
        })
      }
    }

    // User prompt
    messages.push({ role: 'user', content: options.prompt })

    return messages
  }

  /**
   * Convert tool definitions to OpenAI format
   */
  private convertTools(tools: ToolDefinition[]): OpenAITool[] {
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
   * Complete (non-streaming) with tool support
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

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

    try {
      if (!window.api?.fetch?.request) {
        throw new Error('Fetch API not available')
      }

      const fetchResponse = await window.api.fetch.request(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
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
        throw new Error(data.error.message || 'OpenAI API error')
      }

      const choice = data.choices?.[0]
      if (!choice) {
        throw new Error('No response from OpenAI')
      }

      // Extract tool calls if present
      const toolCalls: ToolCall[] = []
      if (choice.message?.tool_calls) {
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

      return {
        content: choice.message?.content || '',
        finishReason:
          choice.finish_reason === 'tool_calls' ? 'tool_use' : choice.finish_reason || 'stop',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('OpenAI completion error:', error)
      throw new Error(
        `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Stream complete (legacy callback)
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
   * Stream complete with full tool support
   */
  async streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

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

    try {
      if (!window.api?.fetch?.stream) {
        throw new Error('Fetch streaming API not available')
      }

      // Track tool calls being built
      const toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }> =
        new Map()

      await window.api.fetch.stream(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body),
        onChunk: (chunk: string) => {
          // OpenAI sends SSE format: "data: {...}\n\n"
          const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'))

          lines.forEach((line) => {
            const data = line.replace(/^data:\s*/, '').trim()

            if (data === '[DONE]') {
              callback({ type: 'done', finishReason: 'stop' })
              return
            }

            try {
              const parsed = JSON.parse(data)
              const choice = parsed.choices?.[0]
              const delta = choice?.delta

              // Text content
              if (delta?.content) {
                callback({ type: 'text', content: delta.content, done: false })
              }

              // Tool calls
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const index = tc.index

                  if (tc.id) {
                    // New tool call
                    toolCallsInProgress.set(index, {
                      id: tc.id,
                      name: tc.function?.name || '',
                      arguments: tc.function?.arguments || ''
                    })
                    callback({
                      type: 'tool_call_start',
                      toolCall: {
                        id: tc.id,
                        name: tc.function?.name
                      }
                    })
                  } else if (toolCallsInProgress.has(index)) {
                    // Continue building tool call
                    const existing = toolCallsInProgress.get(index)!
                    if (tc.function?.name) {
                      existing.name += tc.function.name
                    }
                    if (tc.function?.arguments) {
                      existing.arguments += tc.function.arguments
                      callback({
                        type: 'tool_call_delta',
                        id: existing.id,
                        arguments: tc.function.arguments
                      })
                    }
                  }
                }
              }

              // Finish reason
              if (choice?.finish_reason) {
                // Emit completed tool calls
                for (const [, tc] of toolCallsInProgress) {
                  let parsedArgs: Record<string, unknown> = {}
                  try {
                    parsedArgs = JSON.parse(tc.arguments || '{}')
                  } catch {
                    // Invalid JSON
                  }
                  callback({
                    type: 'tool_call_end',
                    toolCall: {
                      id: tc.id,
                      name: tc.name,
                      arguments: parsedArgs
                    }
                  })
                }

                callback({
                  type: 'done',
                  finishReason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'stop'
                })
              }
            } catch (error) {
              console.error('Failed to parse OpenAI stream chunk:', error)
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
      console.error('OpenAI streaming error:', error)
      callback({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error(
        `OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      if (!window.api?.fetch?.request) {
        return false
      }

      const fetchResponse = await window.api.fetch.request('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      })

      if (!fetchResponse.ok) {
        return false
      }

      const data = typeof fetchResponse.data === 'string' ? JSON.parse(fetchResponse.data) : fetchResponse.data
      return !!data.data
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
      if (!window.api?.fetch?.request) {
        return []
      }

      const fetchResponse = await window.api.fetch.request('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      })

      if (!fetchResponse.ok) {
        return []
      }

      const data = typeof fetchResponse.data === 'string' ? JSON.parse(fetchResponse.data) : fetchResponse.data

      if (data.data && Array.isArray(data.data)) {
        return data.data
          .map((m: { id: string }) => m.id)
          .filter((id: string) => id.startsWith('gpt-'))
          .sort()
      }

      return []
    } catch {
      return []
    }
  }
}

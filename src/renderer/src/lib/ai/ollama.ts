import type {
  AIConfig,
  AIProviderInterface,
  AIRequestOptions,
  AIResponse,
  StreamCallback,
  StreamCallbackExtended,
  ToolDefinition,
  ToolCall
} from './types'
import { buildContextPrompt } from './types'

/**
 * Ollama tool format (for models that support it)
 */
interface OllamaTool {
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
 * Ollama AI Provider
 */
export class OllamaProvider implements AIProviderInterface {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * Convert tool definitions to Ollama format
   */
  private convertTools(tools: ToolDefinition[]): OllamaTool[] {
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
   * Complete (non-streaming) with tool support
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    const endpoint = this.config.endpoint || 'http://localhost:11434'

    // Use chat endpoint for tool support
    const hasTools = options.tools && options.tools.length > 0
    const url = hasTools ? `${endpoint}/api/chat` : `${endpoint}/api/generate`

    // Build full prompt with context
    let fullPrompt = options.prompt
    if (options.context) {
      const contextPrompt = buildContextPrompt(options.context)
      fullPrompt = `${contextPrompt}\n\nUser: ${options.prompt}\n\nAssistant:`
    }

    const body: Record<string, unknown> = hasTools
      ? {
          model: this.config.model,
          messages: [{ role: 'user', content: fullPrompt }],
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m',
          tools: this.convertTools(options.tools!)
        }
      : {
          model: this.config.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m'
        }

    try {
      // Use IPC fetch
      if (!window.api?.fetch?.request) {
        throw new Error('Fetch API not available')
      }

      const fetchResponse = await window.api.fetch.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      // fetchResponse is { ok, status, statusText, headers, data }
      if (!fetchResponse.ok) {
        // Try to extract error message from response data
        const errorData = typeof fetchResponse.data === 'string'
          ? JSON.parse(fetchResponse.data)
          : fetchResponse.data
        const errorMessage = errorData?.error || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
        throw new Error(errorMessage)
      }

      // Extract data from response
      const data = typeof fetchResponse.data === 'string' ? JSON.parse(fetchResponse.data) : fetchResponse.data

      // Check for error in response (Ollama sometimes returns errors in the data)
      if (data.error) {
        throw new Error(data.error)
      }

      // Handle chat response format (with tools)
      if (hasTools && data.message) {
        const toolCalls: ToolCall[] = []

        if (data.message.tool_calls) {
          for (const tc of data.message.tool_calls) {
            toolCalls.push({
              id: `ollama-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              name: tc.function.name,
              arguments: tc.function.arguments || {}
            })
          }
        }

        return {
          content: data.message.content || '',
          finishReason: toolCalls.length > 0 ? 'tool_use' : 'stop',
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          usage: {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
          }
        }
      }

      // Handle generate response format (no tools)
      return {
        content: data.response || '',
        finishReason: data.done ? 'stop' : 'length',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      }
    } catch (error) {
      console.error('Ollama completion error:', error)
      throw new Error(
        `Ollama request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
   * Stream complete with tool support
   * Note: Ollama's streaming tool support is limited
   */
  async streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void> {
    const endpoint = this.config.endpoint || 'http://localhost:11434'

    // Use chat endpoint for tool support
    const hasTools = options.tools && options.tools.length > 0
    const url = hasTools ? `${endpoint}/api/chat` : `${endpoint}/api/generate`

    // Build full prompt with context
    let fullPrompt = options.prompt
    if (options.context) {
      const contextPrompt = buildContextPrompt(options.context)
      fullPrompt = `${contextPrompt}\n\nUser: ${options.prompt}\n\nAssistant:`
    }

    const requestBody: Record<string, unknown> = hasTools
      ? {
          model: this.config.model,
          messages: [{ role: 'user', content: fullPrompt }],
          stream: true,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m',
          tools: this.convertTools(options.tools!)
        }
      : {
          model: this.config.model,
          prompt: fullPrompt,
          stream: true,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m'
        }

    try {
      // Use IPC fetch with streaming
      if (!window.api?.fetch?.stream) {
        throw new Error('Fetch streaming API not available')
      }

      await window.api.fetch.stream(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        onChunk: (chunk: string) => {
          try {
            // Ollama sends newline-delimited JSON
            const lines = chunk.split('\n').filter((line) => line.trim())
            for (const line of lines) {
              const data = JSON.parse(line)

              // Handle chat response format (with tools)
              if (hasTools && data.message) {
                if (data.message.content) {
                  callback({ type: 'text', content: data.message.content, done: false })
                }

                // Handle tool calls in streaming (if supported)
                if (data.message.tool_calls && data.done) {
                  for (const tc of data.message.tool_calls) {
                    const toolCall: ToolCall = {
                      id: `ollama-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                      name: tc.function.name,
                      arguments: tc.function.arguments || {}
                    }
                    callback({
                      type: 'tool_call_start',
                      toolCall: { id: toolCall.id, name: toolCall.name }
                    })
                    callback({ type: 'tool_call_end', toolCall })
                  }
                  callback({ type: 'done', finishReason: 'tool_use' })
                } else if (data.done) {
                  callback({ type: 'done', finishReason: 'stop' })
                }
              } else {
                // Handle generate response format (no tools)
                if (data.response) {
                  callback({ type: 'text', content: data.response, done: false })
                }
                if (data.done) {
                  callback({ type: 'done', finishReason: 'stop' })
                }
              }
            }
          } catch (error) {
            console.error('Failed to parse stream chunk:', error)
          }
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
      console.error('Ollama streaming error:', error)
      callback({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error(
        `Ollama streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    const endpoint = this.config.endpoint || 'http://localhost:11434'
    const url = `${endpoint}/api/tags`

    try {
      if (!window.api?.fetch?.request) {
        return false
      }

      const fetchResponse = await window.api.fetch.request(url, { method: 'GET' })
      return fetchResponse.ok
    } catch {
      return false
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    const endpoint = this.config.endpoint || 'http://localhost:11434'
    const url = `${endpoint}/api/tags`

    try {
      if (!window.api?.fetch?.request) {
        return []
      }

      const fetchResponse = await window.api.fetch.request(url, { method: 'GET' })

      if (!fetchResponse.ok) {
        return []
      }

      const data = typeof fetchResponse.data === 'string' ? JSON.parse(fetchResponse.data) : fetchResponse.data

      if (data.models && Array.isArray(data.models)) {
        return data.models.map((m: { name: string }) => m.name)
      }

      return []
    } catch {
      return []
    }
  }
}

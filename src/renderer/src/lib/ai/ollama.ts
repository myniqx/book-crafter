/**
 * Ollama AI Provider - Refactored with BaseAIProvider
 */

import { BaseAIProvider } from './base'
import type {
  AIConfig,
  AIRequestOptions,
  AIResponse,
  StreamCallbackExtended,
  ToolDefinition,
  ToolCall
} from './types'
import { parseResponseData, createStreamHandler, parseOllamaStream } from './utils'

/**
 * Ollama tool format
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
 * Ollama message types
 */
interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: Array<{
    function: {
      name: string
      arguments: Record<string, unknown>
    }
  }>
}

/**
 * Ollama AI Provider
 */
export class OllamaProvider extends BaseAIProvider {
  constructor(config: AIConfig) {
    super(config, 'Ollama', 'ollama')
  }

  /**
   * Get API endpoint URL
   */
  protected getApiUrl(): string {
    return this.config.endpoint || 'http://localhost:11434'
  }

  /**
   * Get request headers
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json'
    }
  }

  /**
   * Convert tool definitions to Ollama format
   */
  protected convertTools(tools: ToolDefinition[]): OllamaTool[] {
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
   * Parse tool calls from Ollama response
   */
  protected parseToolCalls(responseData: unknown): ToolCall[] {
    const data = responseData as Record<string, unknown>
    const toolCalls: ToolCall[] = []

    if (data.message && typeof data.message === 'object') {
      const message = data.message as Record<string, unknown>
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        for (const tc of message.tool_calls) {
          const toolCall = tc as { function: { name: string; arguments: Record<string, unknown> } }
          toolCalls.push({
            id: `ollama-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments || {}
          })
        }
      }
    }

    return toolCalls
  }

  /**
   * Build messages array with conversation history support
   */
  protected buildMessages(options: AIRequestOptions): OllamaMessage[] {
    const messages: OllamaMessage[] = []

    // System message
    const systemPrompt = this.buildSystemPrompt(options)
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      })
    }

    // Conversation history
    if (options.context?.conversationHistory) {
      options.context.conversationHistory.forEach((msg) => {
        if (msg.role === 'system') return

        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          messages.push({
            role: 'assistant',
            content: msg.content || '',
            tool_calls: msg.toolCalls.map((tc) => ({
              function: {
                name: tc.name,
                arguments: tc.arguments
              }
            }))
          })
        } else if (msg.role === 'tool_result' && msg.toolResult) {
          messages.push({
            role: 'tool',
            content: msg.toolResult.content
          })
        } else {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })
        }
      })
    }

    // User prompt
    messages.push({ role: 'user', content: options.prompt })

    return messages
  }

  /**
   * Complete (non-streaming) with tool support
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    const endpoint = this.getApiUrl()

    // Use chat endpoint for tool support or conversation history
    const hasTools = options.tools && options.tools.length > 0
    const hasHistory =
      options.context?.conversationHistory && options.context.conversationHistory.length > 0
    const useChat = hasTools || hasHistory
    const url = useChat ? `${endpoint}/api/chat` : `${endpoint}/api/generate`

    const body: Record<string, unknown> = useChat
      ? {
          model: this.config.model,
          messages: this.buildMessages(options),
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m'
        }
      : {
          model: this.config.model,
          prompt: options.prompt,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m'
        }

    // Add tools if provided
    if (hasTools) {
      body.tools = this.convertTools(options.tools!)
    }

    try {
      this.validateFetchAPI()

      const fetchResponse = await window.api.fetch.request(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      })

      // Check for HTTP errors
      if (!fetchResponse.ok) {
        const errorData = parseResponseData(fetchResponse.data)
        const errorMessage =
          ((errorData as Record<string, unknown>)?.error as string) ||
          `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
        throw new Error(errorMessage)
      }

      // Extract data from response
      const data = parseResponseData(fetchResponse.data)

      // Check for error in response
      if (data.error) {
        throw new Error(data.error as string)
      }

      // Handle chat response format (used for tools and conversation history)
      if (useChat && data.message) {
        const toolCalls = this.parseToolCalls(data)

        return {
          content: ((data.message as Record<string, unknown>)?.content as string) || '',
          finishReason: toolCalls.length > 0 ? 'tool_use' : 'stop',
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          usage: {
            promptTokens: (data.prompt_eval_count as number) || 0,
            completionTokens: (data.eval_count as number) || 0,
            totalTokens:
              ((data.prompt_eval_count as number) || 0) + ((data.eval_count as number) || 0)
          }
        }
      }

      // Handle generate response format (simple prompt without history)
      return {
        content: (data.response as string) || '',
        finishReason: data.done ? 'stop' : 'length',
        usage: {
          promptTokens: (data.prompt_eval_count as number) || 0,
          completionTokens: (data.eval_count as number) || 0,
          totalTokens:
            ((data.prompt_eval_count as number) || 0) + ((data.eval_count as number) || 0)
        }
      }
    } catch (error) {
      throw this.wrapError(error, 'completion')
    }
  }

  /**
   * Stream complete with tool support
   */
  async streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void> {
    const endpoint = this.getApiUrl()

    // Use chat endpoint for tool support or conversation history
    const hasTools = options.tools && options.tools.length > 0
    const hasHistory =
      options.context?.conversationHistory && options.context.conversationHistory.length > 0
    const useChat = hasTools || hasHistory
    const url = useChat ? `${endpoint}/api/chat` : `${endpoint}/api/generate`

    const requestBody: Record<string, unknown> = useChat
      ? {
          model: this.config.model,
          messages: this.buildMessages(options),
          stream: true,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m'
        }
      : {
          model: this.config.model,
          prompt: options.prompt,
          stream: true,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          },
          keep_alive: this.config.keepAlive || '5m'
        }

    // Add tools if provided
    if (hasTools) {
      requestBody.tools = this.convertTools(options.tools!)
    }

    try {
      this.validateFetchAPI(true)

      const streamHandler = createStreamHandler(
        (chunk) => parseOllamaStream(chunk, useChat),
        callback
      )

      await window.api.fetch.stream(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
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
    const endpoint = this.getApiUrl()
    const url = `${endpoint}/api/tags`

    try {
      this.validateFetchAPI()

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
    const endpoint = this.getApiUrl()
    const url = `${endpoint}/api/tags`

    try {
      this.validateFetchAPI()

      const fetchResponse = await window.api.fetch.request(url, { method: 'GET' })

      if (!fetchResponse.ok) {
        return []
      }

      const data = parseResponseData(fetchResponse.data)

      if (data.models && Array.isArray(data.models)) {
        return (data.models as Array<{ name: string }>).map((m) => m.name)
      }

      return []
    } catch {
      return []
    }
  }
}

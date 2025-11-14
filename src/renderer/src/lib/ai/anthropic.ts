import type {
  AIConfig,
  AIProviderInterface,
  AIRequestOptions,
  AIResponse,
  StreamCallback,
  AIMessage
} from './types'
import { buildContextPrompt } from './types'

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
   * Build messages array
   */
  private buildMessages(options: AIRequestOptions): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = []

    // Conversation history
    if (options.context?.conversationHistory) {
      options.context.conversationHistory.forEach((msg: AIMessage) => {
        if (msg.role !== 'system') {
          messages.push({ role: msg.role, content: msg.content })
        }
      })
    }

    // User prompt
    messages.push({ role: 'user', content: options.prompt })

    return messages
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
   * Complete (non-streaming)
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

    const messages = this.buildMessages(options)
    const system = this.buildSystemPrompt(options)

    const body = {
      model: this.config.model,
      messages,
      system,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: false
    }

    try {
      if (!window.api?.http?.post) {
        throw new Error('HTTP API not available')
      }

      const response = await window.api.http.post(this.apiUrl, body, {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      })

      const data = JSON.parse(response)

      if (data.error) {
        throw new Error(data.error.message || 'Anthropic API error')
      }

      const content = data.content?.[0]?.text || ''

      return {
        content,
        finishReason: data.stop_reason || 'stop',
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
   * Stream complete
   */
  async streamComplete(options: AIRequestOptions, callback: StreamCallback): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

    const messages = this.buildMessages(options)
    const system = this.buildSystemPrompt(options)

    const body = {
      model: this.config.model,
      messages,
      system,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true
    }

    try {
      if (!window.api?.http?.stream) {
        throw new Error('HTTP streaming API not available')
      }

      await window.api.http.stream(
        this.apiUrl,
        body,
        (chunk: string) => {
          // Anthropic sends SSE format: "event: ...\ndata: {...}\n\n"
          const lines = chunk.split('\n')

          lines.forEach((line) => {
            if (line.startsWith('data:')) {
              const data = line.replace(/^data:\s*/, '').trim()

              try {
                const parsed = JSON.parse(data)

                // Content block delta
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  callback(parsed.delta.text, false)
                }

                // Message complete
                if (parsed.type === 'message_stop') {
                  callback('', true)
                }
              } catch (error) {
                console.error('Failed to parse Anthropic stream chunk:', error)
              }
            }
          })
        },
        {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        }
      )
    } catch (error) {
      console.error('Anthropic streaming error:', error)
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

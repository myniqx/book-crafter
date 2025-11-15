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
 * OpenAI AI Provider
 */
export class OpenAIProvider implements AIProviderInterface {
  private config: AIConfig
  private apiUrl = 'https://api.openai.com/v1/chat/completions'

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * Build messages array
   */
  private buildMessages(options: AIRequestOptions): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = []

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
          if (msg.role !== 'system') {
            messages.push({ role: msg.role, content: msg.content })
          }
        })
      }
    }

    // User prompt
    messages.push({ role: 'user', content: options.prompt })

    return messages
  }

  /**
   * Complete (non-streaming)
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    const messages = this.buildMessages(options)

    const body = {
      model: this.config.model,
      messages,
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
        Authorization: `Bearer ${this.config.apiKey}`
      })

      const data = JSON.parse(response)

      if (data.error) {
        throw new Error(data.error.message || 'OpenAI API error')
      }

      const choice = data.choices?.[0]
      if (!choice) {
        throw new Error('No response from OpenAI')
      }

      return {
        content: choice.message?.content || '',
        finishReason: choice.finish_reason || 'stop',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('OpenAI completion error:', error)
      throw new Error(`OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stream complete
   */
  async streamComplete(options: AIRequestOptions, callback: StreamCallback): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    const messages = this.buildMessages(options)

    const body = {
      model: this.config.model,
      messages,
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
          // OpenAI sends SSE format: "data: {...}\n\n"
          const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'))

          lines.forEach((line) => {
            const data = line.replace(/^data:\s*/, '').trim()

            if (data === '[DONE]') {
              callback('', true)
              return
            }

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta
              if (delta?.content) {
                callback(delta.content, false)
              }
              if (parsed.choices?.[0]?.finish_reason) {
                callback('', true)
              }
            } catch (error) {
              console.error('Failed to parse OpenAI stream chunk:', error)
            }
          })
        },
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        }
      )
    } catch (error) {
      console.error('OpenAI streaming error:', error)
      throw new Error(`OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      if (!window.api?.http?.get) {
        return false
      }

      const response = await window.api.http.get('https://api.openai.com/v1/models', {
        Authorization: `Bearer ${this.config.apiKey}`
      })

      const data = JSON.parse(response)
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
      if (!window.api?.http?.get) {
        return []
      }

      const response = await window.api.http.get('https://api.openai.com/v1/models', {
        Authorization: `Bearer ${this.config.apiKey}`
      })

      const data = JSON.parse(response)

      if (data.data && Array.isArray(data.data)) {
        return data.data
          .map((m: any) => m.id)
          .filter((id: string) => id.startsWith('gpt-'))
          .sort()
      }

      return []
    } catch {
      return []
    }
  }
}

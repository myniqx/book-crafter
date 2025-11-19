import type {
  AIConfig,
  AIProviderInterface,
  AIRequestOptions,
  AIResponse,
  StreamCallback
} from './types'
import { buildContextPrompt } from './types'

/**
 * Ollama AI Provider
 */
export class OllamaProvider implements AIProviderInterface {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * Complete (non-streaming)
   */
  async complete(options: AIRequestOptions): Promise<AIResponse> {
    const endpoint = this.config.endpoint || 'http://localhost:11434'
    const url = `${endpoint}/api/generate`

    // Build full prompt with context
    let fullPrompt = options.prompt
    if (options.context) {
      const contextPrompt = buildContextPrompt(options.context)
      fullPrompt = `${contextPrompt}\n\nUser: ${options.prompt}\n\nAssistant:`
    }

    const body = {
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
      if (!window.api?.http?.post) {
        throw new Error('HTTP API not available')
      }

      const response = await window.api.http.post(url, body)
      const data = JSON.parse(response)

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
   * Stream complete
   */
  async streamComplete(options: AIRequestOptions, callback: StreamCallback): Promise<void> {
    const endpoint = this.config.endpoint || 'http://localhost:11434'
    const url = `${endpoint}/api/generate`

    // Build full prompt with context
    let fullPrompt = options.prompt
    if (options.context) {
      const contextPrompt = buildContextPrompt(options.context)
      fullPrompt = `${contextPrompt}\n\nUser: ${options.prompt}\n\nAssistant:`
    }

    const requestBody = {
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
      if (!window.api?.http?.stream) {
        throw new Error('HTTP streaming API not available')
      }

      await window.api.http.stream(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody,
        onChunk: (chunk: string) => {
          try {
            // Ollama sends newline-delimited JSON
            const lines = chunk.split('\n').filter((line) => line.trim())
            for (const line of lines) {
              const data = JSON.parse(line)
              if (data.response) {
                callback(data.response, data.done || false)
              }
              if (data.done) {
                callback('', true)
              }
            }
          } catch (error) {
            console.error('Failed to parse stream chunk:', error)
          }
        },
        onError: (error: Error) => {
          console.error('Stream error:', error)
          throw error
        },
        onComplete: () => {
          // Stream completed
        }
      })
    } catch (error) {
      console.error('Ollama streaming error:', error)
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
      if (!window.api?.http?.get) {
        return false
      }

      await window.api.http.get(url)
      return true
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
      if (!window.api?.http?.get) {
        return []
      }

      const response = await window.api.http.get(url)
      const data = JSON.parse(response)

      if (data.models && Array.isArray(data.models)) {
        return data.models.map((m: { name: string }) => m.name)
      }

      return []
    } catch {
      return []
    }
  }
}

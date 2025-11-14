import type { AIConfig, AIProviderInterface } from './types'
import { OllamaProvider } from './ollama'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'

/**
 * Create AI provider instance based on config
 */
export function createAIProvider(config: AIConfig): AIProviderInterface {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config)
    case 'openai':
      return new OpenAIProvider(config)
    case 'anthropic':
      return new AnthropicProvider(config)
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`)
  }
}

// Re-export types
export * from './types'
export { OllamaProvider } from './ollama'
export { OpenAIProvider } from './openai'
export { AnthropicProvider } from './anthropic'

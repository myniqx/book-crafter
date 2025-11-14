/**
 * AI Provider types
 */
export type AIProvider = 'ollama' | 'openai' | 'anthropic'

/**
 * AI Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * AI Message
 */
export interface AIMessage {
  role: MessageRole
  content: string
  timestamp: string
}

/**
 * Custom Prompt
 */
export interface CustomPrompt {
  id: string
  name: string
  prompt: string
  category: 'writing' | 'editing' | 'analysis' | 'custom'
  created: string
  modified: string
}

/**
 * AI Suggestion (for history)
 */
export interface AISuggestion {
  id: string
  type: 'grammar' | 'expansion' | 'dramatic' | 'dialogue' | 'improvement' | 'custom'
  original: string
  suggested: string
  prompt: string
  applied: boolean
  timestamp: string
  bookSlug?: string
  chapterSlug?: string
}

/**
 * AI Configuration
 */
export interface AIConfig {
  provider: AIProvider
  model: string
  endpoint?: string // For Ollama
  apiKey?: string // For OpenAI/Anthropic
  temperature: number
  maxTokens: number
  keepAlive?: string // For Ollama (e.g., "30m", "1h")
}

/**
 * AI Context (what's included in the prompt)
 */
export interface AIContext {
  currentChapter?: {
    bookSlug: string
    chapterSlug: string
    title: string
    content: string
  }
  selection?: {
    text: string
    start: number
    end: number
  }
  entities?: Array<{
    slug: string
    name: string
    fields: Array<{ name: string; value: string }>
  }>
  conversationHistory?: AIMessage[]
}

/**
 * AI Request options
 */
export interface AIRequestOptions {
  prompt: string
  context?: AIContext
  stream?: boolean
  systemPrompt?: string
}

/**
 * AI Response
 */
export interface AIResponse {
  content: string
  finishReason?: 'stop' | 'length' | 'error'
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Streaming callback
 */
export type StreamCallback = (chunk: string, done: boolean) => void

/**
 * AI Provider interface
 */
export interface AIProviderInterface {
  /**
   * Send a completion request
   */
  complete(options: AIRequestOptions): Promise<AIResponse>

  /**
   * Send a streaming completion request
   */
  streamComplete(options: AIRequestOptions, callback: StreamCallback): Promise<void>

  /**
   * Test connection
   */
  testConnection(): Promise<boolean>

  /**
   * List available models
   */
  listModels?(): Promise<string[]>
}

/**
 * Default AI configurations
 */
export const DEFAULT_AI_CONFIGS: Record<AIProvider, AIConfig> = {
  ollama: {
    provider: 'ollama',
    model: 'llama3.2',
    endpoint: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 2000,
    keepAlive: '30m'
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 2000
  }
}

/**
 * Available Ollama models
 */
export const OLLAMA_MODELS = [
  'llama3.2',
  'llama3.2:1b',
  'llama3.1',
  'llama3.1:70b',
  'mistral',
  'mistral-nemo',
  'phi3',
  'qwen2.5',
  'gemma2'
]

/**
 * Available OpenAI models
 */
export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo'
]

/**
 * Available Anthropic models
 */
export const ANTHROPIC_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
]

/**
 * Build context prompt
 */
export function buildContextPrompt(context: AIContext): string {
  const parts: string[] = []

  // System context
  parts.push('You are an AI writing assistant for a book authoring tool called Book Crafter.')
  parts.push('Your role is to help authors with their creative writing process.')
  parts.push('')

  // Current chapter
  if (context.currentChapter) {
    parts.push(`Current Chapter: "${context.currentChapter.title}"`)
    parts.push('---')
    parts.push(context.currentChapter.content)
    parts.push('---')
    parts.push('')
  }

  // Selection
  if (context.selection) {
    parts.push('Selected Text:')
    parts.push('"""')
    parts.push(context.selection.text)
    parts.push('"""')
    parts.push('')
  }

  // Entities
  if (context.entities && context.entities.length > 0) {
    parts.push('Characters/Entities:')
    context.entities.forEach((entity) => {
      parts.push(`\n@${entity.slug} - ${entity.name}`)
      entity.fields.forEach((field) => {
        if (field.value) {
          parts.push(`  ${field.name}: ${field.value}`)
        }
      })
    })
    parts.push('')
  }

  return parts.join('\n')
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

/**
 * Preset prompts for common tasks
 */
export const PRESET_PROMPTS = {
  expandScene: 'Expand this scene with more descriptive details and sensory information.',
  checkGrammar: 'Check the grammar and style of the selected text. List all issues found.',
  makeDramatic: 'Rewrite this text to make it more dramatic and emotionally engaging.',
  writeDialogue: 'Write a dialogue between the mentioned characters based on their personalities.',
  summarize: 'Provide a concise summary of this chapter.',
  findPlotHoles: 'Analyze this content for any plot holes or inconsistencies.',
  suggestImprovements: 'Suggest improvements to make this text more compelling.',
  characterConsistency: 'Check if the character behavior is consistent with their defined personality and background.'
}

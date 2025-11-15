import { StateCreator } from 'zustand'
import {
  type AIConfig,
  type AIMessage,
  type AIContext,
  type AIProviderInterface,
  type CustomPrompt,
  type AISuggestion,
  DEFAULT_AI_CONFIGS
} from '@renderer/lib/ai/types'
import { createAIProvider } from '@renderer/lib/ai'
import type { Entity } from './entitySlice'
import type { Book } from './booksSlice'

// UUID generator helper
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * AI slice state
 */
export interface AISlice {
  // Configuration per provider
  ollamaConfig: AIConfig
  openaiConfig: AIConfig
  anthropicConfig: AIConfig

  // Current active configuration
  config: AIConfig

  // Message history
  messages: AIMessage[]

  // Streaming state
  isStreaming: boolean
  currentStreamMessage: string

  // Custom prompts
  customPrompts: CustomPrompt[]

  // Suggestions history
  suggestions: AISuggestion[]

  // Provider instance (not persisted)
  _provider: AIProviderInterface | null

  // Actions
  updateConfig: (config: Partial<AIConfig>) => void
  sendMessage: (
    prompt: string,
    context?: AIContext,
    onStream?: (chunk: string) => void
  ) => Promise<void>
  clearMessages: () => void
  testConnection: () => Promise<boolean>
  listModels: () => Promise<string[]>
  buildContext: (options: {
    currentChapter?: { bookSlug: string; chapterSlug: string }
    selection?: { text: string; start: number; end: number }
    includeEntities?: boolean
  }) => AIContext | undefined
  getProvider: () => AIProviderInterface

  // Custom prompts actions
  addCustomPrompt: (prompt: Omit<CustomPrompt, 'id' | 'created' | 'modified'>) => void
  updateCustomPrompt: (id: string, prompt: Partial<CustomPrompt>) => void
  deleteCustomPrompt: (id: string) => void

  // Suggestions actions
  addSuggestion: (suggestion: Omit<AISuggestion, 'id' | 'timestamp'>) => void
  applySuggestion: (id: string) => void
  clearSuggestions: () => void
}

/**
 * Create AI slice
 */
export const createAISlice: StateCreator<
  AISlice,
  [['zustand/immer', never]],
  [],
  AISlice
> = (set, get) => ({
  // Initial state
  ollamaConfig: DEFAULT_AI_CONFIGS.ollama,
  openaiConfig: DEFAULT_AI_CONFIGS.openai,
  anthropicConfig: DEFAULT_AI_CONFIGS.anthropic,
  config: DEFAULT_AI_CONFIGS.ollama, // Default to Ollama
  messages: [],
  isStreaming: false,
  currentStreamMessage: '',
  customPrompts: [],
  suggestions: [],
  _provider: null,

  // Update configuration
  updateConfig: (newConfig) => {
    set((state) => {
      state.config = { ...state.config, ...newConfig }
      // Also update the provider-specific config if provider changed
      const provider = newConfig.provider || state.config.provider
      if (provider === 'ollama') {
        state.ollamaConfig = { ...state.ollamaConfig, ...state.config }
      } else if (provider === 'openai') {
        state.openaiConfig = { ...state.openaiConfig, ...state.config }
      } else if (provider === 'anthropic') {
        state.anthropicConfig = { ...state.anthropicConfig, ...state.config }
      }
      state._provider = null // Reset provider to force recreation
    })
  },

  // Get or create provider instance
  getProvider: () => {
    const state = get()
    if (!state._provider) {
      const provider = createAIProvider(state.config)
      set((state) => {
        state._provider = provider
      })
      return provider
    }
    return state._provider
  },

  // Build context from current state
  buildContext: (options) => {
    const state = get() as any // Access full store state

    const context: AIContext = {}

    // Add current chapter if specified
    if (options.currentChapter) {
      const { bookSlug, chapterSlug } = options.currentChapter
      const book = state.books?.[bookSlug] as Book | undefined
      const chapter = book?.chapters.find((c) => c.slug === chapterSlug)

      if (chapter) {
        context.currentChapter = {
          bookSlug,
          chapterSlug,
          title: chapter.title,
          content: chapter.content
        }
      }
    }

    // Add selection if specified
    if (options.selection) {
      context.selection = options.selection
    }

    // Add entities if requested
    if (options.includeEntities && state.entities) {
      const entities = state.entities as Record<string, Entity>
      context.entities = Object.values(entities).map((entity) => ({
        slug: entity.slug,
        name: entity.name,
        fields: entity.fields.map((f) => ({ name: f.name, value: f.value }))
      }))
    }

    // Add conversation history (last 10 messages)
    if (get().messages.length > 0) {
      context.conversationHistory = get().messages.slice(-10)
    }

    return Object.keys(context).length > 0 ? context : undefined
  },

  // Send message to AI
  sendMessage: async (prompt, context, onStream) => {
    try {
      set((state) => {
        state.isStreaming = true
        state.currentStreamMessage = ''
      })

      // Add user message
      const userMessage: AIMessage = {
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }

      set((state) => {
        state.messages.push(userMessage)
      })

      const provider = get().getProvider()

      // Stream response
      await provider.streamComplete(
        {
          prompt,
          context,
          conversationHistory: get().messages.slice(-10)
        },
        (chunk) => {
          set((state) => {
            state.currentStreamMessage += chunk
          })
          onStream?.(chunk)
        }
      )

      // Add assistant message
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: get().currentStreamMessage,
        timestamp: new Date().toISOString()
      }

      set((state) => {
        state.messages.push(assistantMessage)
        state.isStreaming = false
        state.currentStreamMessage = ''
      })
    } catch (error) {
      console.error('AI message error:', error)

      // Add error message
      set((state) => {
        state.messages.push({
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString()
        })
        state.isStreaming = false
        state.currentStreamMessage = ''
      })

      throw error
    }
  },

  // Clear message history
  clearMessages: () => {
    set((state) => {
      state.messages = []
      state.currentStreamMessage = ''
    })
  },

  // Test connection to AI provider
  testConnection: async () => {
    try {
      const provider = get().getProvider()
      return await provider.testConnection()
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  },

  // List available models
  listModels: async () => {
    try {
      const provider = get().getProvider()
      if (provider.listModels) {
        return await provider.listModels()
      }
      return []
    } catch (error) {
      console.error('Failed to list models:', error)
      return []
    }
  },

  // Custom prompts actions
  addCustomPrompt: (prompt) => {
    set((state) => {
      const now = new Date().toISOString()
      const newPrompt: CustomPrompt = {
        ...prompt,
        id: generateUUID(),
        created: now,
        modified: now
      }
      state.customPrompts.push(newPrompt)
    })
  },

  updateCustomPrompt: (id, updates) => {
    set((state) => {
      const index = state.customPrompts.findIndex((p) => p.id === id)
      if (index !== -1) {
        state.customPrompts[index] = {
          ...state.customPrompts[index],
          ...updates,
          modified: new Date().toISOString()
        }
      }
    })
  },

  deleteCustomPrompt: (id) => {
    set((state) => {
      state.customPrompts = state.customPrompts.filter((p) => p.id !== id)
    })
  },

  // Suggestions actions
  addSuggestion: (suggestion) => {
    set((state) => {
      const newSuggestion: AISuggestion = {
        ...suggestion,
        id: generateUUID(),
        timestamp: new Date().toISOString()
      }
      state.suggestions.unshift(newSuggestion) // Add to beginning
      // Keep only last 50 suggestions
      if (state.suggestions.length > 50) {
        state.suggestions = state.suggestions.slice(0, 50)
      }
    })
  },

  applySuggestion: (id) => {
    set((state) => {
      const suggestion = state.suggestions.find((s) => s.id === id)
      if (suggestion) {
        suggestion.applied = true
      }
    })
  },

  clearSuggestions: () => {
    set((state) => {
      state.suggestions = []
    })
  }
})

import { StateCreator } from 'zustand'
import {
  type AIConfig,
  type AIMessage,
  type AIContext,
  type AIProviderInterface,
  type CustomPrompt,
  type AISuggestion,
  type ToolCall,
  type ToolResult,
  type ToolExecution,
  type AgenticSettings,
  DEFAULT_AI_CONFIGS,
  DEFAULT_AGENTIC_SETTINGS
} from '@renderer/lib/ai/types'
import { createAIProvider } from '@renderer/lib/ai'
import { getToolByName, executeToolCall, filterEnabledTools } from '@renderer/lib/ai/tools'
import type { StoreAccess } from '@renderer/lib/ai/tools/executor'
import type { Book } from './booksSlice'
import type { Entity } from './entitySlice'

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

  // Agentic state
  agenticSettings: AgenticSettings
  isAgentRunning: boolean
  currentIteration: number
  pendingApproval: ToolCall | null
  toolHistory: ToolExecution[]

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

  // Agentic actions
  sendAgenticMessage: (
    prompt: string,
    context?: AIContext,
    storeAccess?: StoreAccess,
    onStream?: (chunk: string) => void,
    onToolCall?: (toolCall: ToolCall) => void
  ) => Promise<void>
  approveToolCall: (storeAccess: StoreAccess) => Promise<void>
  rejectToolCall: () => void
  stopAgent: () => void
  updateAgenticSettings: (settings: Partial<AgenticSettings>) => void
  setPendingStoreAccess: (storeAccess: StoreAccess | null) => void
  _pendingStoreAccess: StoreAccess | null

  // Custom prompts actions
  addCustomPrompt: (prompt: Omit<CustomPrompt, 'id' | 'created' | 'modified'>) => void
  updateCustomPrompt: (id: string, prompt: Partial<CustomPrompt>) => void
  deleteCustomPrompt: (id: string) => void
  setCustomPrompts: (prompts: CustomPrompt[]) => void

  // Suggestions actions
  addSuggestion: (suggestion: Omit<AISuggestion, 'id' | 'timestamp'>) => void
  applySuggestion: (id: string) => void
  clearSuggestions: () => void

  // Direct setters for persistence
  setConfig: (config: AIConfig) => void
  setOllamaConfig: (config: AIConfig) => void
  setOpenAIConfig: (config: AIConfig) => void
  setAnthropicConfig: (config: AIConfig) => void
}

// Re-export types for use in other modules
export type {
  AIConfig,
  AIMessage,
  AIContext,
  CustomPrompt,
  AISuggestion,
  ToolCall,
  ToolResult,
  ToolExecution,
  AgenticSettings
}
export type { StoreAccess } from '@renderer/lib/ai/tools/executor'
export type OllamaConfig = AIConfig
export type OpenAIConfig = AIConfig
export type AnthropicConfig = AIConfig

/**
 * Create AI slice
 */
export const createAISlice: StateCreator<AISlice, [['zustand/immer', never]], [], AISlice> = (
  set,
  get
) => ({
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
  agenticSettings: DEFAULT_AGENTIC_SETTINGS,
  isAgentRunning: false,
  currentIteration: 0,
  pendingApproval: null,
  toolHistory: [],
  _provider: null,
  _pendingStoreAccess: null,

  // Update configuration
  updateConfig: (newConfig) => {
    set((state) => {
      // If provider is changing, load the full config for that provider
      if (newConfig.provider && newConfig.provider !== state.config.provider) {
        // Get the stored config for the new provider
        let baseConfig: AIConfig
        if (newConfig.provider === 'ollama') {
          baseConfig = state.ollamaConfig
        } else if (newConfig.provider === 'openai') {
          baseConfig = state.openaiConfig
        } else {
          baseConfig = state.anthropicConfig
        }
        // Merge with any additional settings from newConfig
        state.config = { ...baseConfig, ...newConfig }
      } else {
        // Just update the current config
        state.config = { ...state.config, ...newConfig }
      }

      // Also update the provider-specific config
      const provider = state.config.provider
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
    // Access full store state - this works because AISlice is part of ToolsStore
    // which doesn't have books/entities, but we're using this in components that have both
    const state = get() as AISlice & {
      books?: Record<string, Book>
      entities?: Record<string, Entity>
    }

    const context: AIContext = {}

    // Add current chapter if specified
    if (options.currentChapter) {
      const { bookSlug, chapterSlug } = options.currentChapter
      const book = state.books?.[bookSlug]
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
      context.entities = Object.values(state.entities).map((entity) => ({
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
          conversationHistory: get().messages.slice(-20)
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

  setCustomPrompts: (prompts) => {
    set((state) => {
      state.customPrompts = prompts
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
  },

  // Direct setters for persistence
  setConfig: (config) => {
    set((state) => {
      state.config = config
      state._provider = null // Reset provider to force recreation
    })
  },

  setOllamaConfig: (config) => {
    set((state) => {
      state.ollamaConfig = config
    })
  },

  setOpenAIConfig: (config) => {
    set((state) => {
      state.openaiConfig = config
    })
  },

  setAnthropicConfig: (config) => {
    set((state) => {
      state.anthropicConfig = config
    })
  },

  // Agentic settings
  updateAgenticSettings: (settings) => {
    set((state) => {
      state.agenticSettings = { ...state.agenticSettings, ...settings }
    })
  },

  // Stop running agent
  stopAgent: () => {
    set((state) => {
      state.isAgentRunning = false
      state.pendingApproval = null
      state.currentIteration = 0
    })
  },

  // Reject pending tool call
  rejectToolCall: () => {
    set((state) => {
      if (state.pendingApproval) {
        // Add rejection to history
        state.toolHistory.push({
          id: generateUUID(),
          toolCall: state.pendingApproval,
          status: 'rejected',
          timestamp: new Date().toISOString()
        })

        // Add rejection message
        state.messages.push({
          role: 'tool_result',
          content: `Tool call "${state.pendingApproval.name}" was rejected by user`,
          timestamp: new Date().toISOString(),
          toolResult: {
            toolCallId: state.pendingApproval.id,
            content: 'Tool call was rejected by user',
            isError: true
          }
        })

        state.pendingApproval = null
        state.isAgentRunning = false
      }
    })
  },

  // Set pending store access for approval
  setPendingStoreAccess: (storeAccess) => {
    set((state) => {
      state._pendingStoreAccess = storeAccess
    })
  },

  // Approve pending tool call
  approveToolCall: async (storeAccess) => {
    const state = get()
    const toolCall = state.pendingApproval

    if (!toolCall) return

    // Mark as approved
    set((s) => {
      s.pendingApproval = null
      const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
      if (execution) {
        execution.status = 'running'
        execution.approvedAt = new Date().toISOString()
      }
    })

    // Execute the tool with provided store access
    const result = await executeToolCall(toolCall, storeAccess)

    // Update execution record
    set((s) => {
      const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
      if (execution) {
        execution.status = result.isError ? 'error' : 'completed'
        execution.result = result
        execution.completedAt = new Date().toISOString()
      }
    })

    // Add tool result message
    set((s) => {
      s.messages.push({
        role: 'tool_result',
        content: result.content,
        timestamp: new Date().toISOString(),
        toolResult: result
      })
    })

    // Continue agent loop if not stopped
    if (get().isAgentRunning) {
      // This will be handled by the main agentic loop
    }
  },

  // Main agentic message handler
  sendAgenticMessage: async (prompt, context, storeAccess, onStream, onToolCall) => {
    const state = get()
    const { agenticSettings } = state

    // If agentic is disabled, use regular sendMessage
    if (!agenticSettings.enabled) {
      return get().sendMessage(prompt, context, onStream)
    }

    // Store the store access for approval callbacks
    set((s) => {
      s._pendingStoreAccess = storeAccess || null
    })

    try {
      set((s) => {
        s.isStreaming = true
        s.isAgentRunning = true
        s.currentIteration = 0
        s.currentStreamMessage = ''
        s.toolHistory = []
      })

      // Add user message
      const userMessage: AIMessage = {
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }

      set((s) => {
        s.messages.push(userMessage)
      })

      const provider = get().getProvider()
      const tools = filterEnabledTools(agenticSettings.enabledTools)

      // Agentic loop
      let iteration = 0
      while (iteration < agenticSettings.maxIterations && get().isAgentRunning) {
        set((s) => {
          s.currentIteration = iteration + 1
        })

        // Get conversation history for context
        const messages = get().messages

        // Make API call with tools
        // For subsequent iterations, conversation history contains tool results
        // LLM will naturally continue based on context
        const currentPrompt = iteration === 0 ? prompt : ''

        const response = await provider.complete({
          prompt: currentPrompt,
          context: {
            ...context,
            conversationHistory: messages.slice(-20)
          },
          tools: tools.length > 0 ? tools : undefined,
          toolChoice: 'auto'
        })

        // Handle text response
        if (response.content) {
          set((s) => {
            s.currentStreamMessage = response.content
          })
          onStream?.(response.content)

          // Add assistant message
          const assistantMessage: AIMessage = {
            role: 'assistant',
            content: response.content,
            timestamp: new Date().toISOString(),
            toolCalls: response.toolCalls
          }

          set((s) => {
            s.messages.push(assistantMessage)
          })
        }

        // Handle tool calls
        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const toolCall of response.toolCalls) {
            // Check if still running
            if (!get().isAgentRunning) break

            onToolCall?.(toolCall)

            const tool = getToolByName(toolCall.name)
            const needsApproval = tool?.requiresApproval && agenticSettings.approvalMode !== 'none'
            const isWriteOp = tool?.requiresApproval
            const shouldAskApproval =
              agenticSettings.approvalMode === 'all' ||
              (agenticSettings.approvalMode === 'write_only' && isWriteOp)

            // Add to history
            set((s) => {
              s.toolHistory.push({
                id: generateUUID(),
                toolCall,
                status: shouldAskApproval ? 'pending' : 'running',
                timestamp: new Date().toISOString()
              })
            })

            if (shouldAskApproval) {
              // Wait for approval
              set((s) => {
                s.pendingApproval = toolCall
              })

              // Wait for approval/rejection
              await new Promise<void>((resolve) => {
                const checkApproval = setInterval(() => {
                  const currentState = get()
                  if (!currentState.pendingApproval || !currentState.isAgentRunning) {
                    clearInterval(checkApproval)
                    resolve()
                  }
                }, 100)
              })

              // Check if rejected or stopped
              if (!get().isAgentRunning) break
            } else if (storeAccess) {
              // Execute immediately with provided store access
              const result = await executeToolCall(toolCall, storeAccess)

              // Update execution record
              set((s) => {
                const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
                if (execution) {
                  execution.status = result.isError ? 'error' : 'completed'
                  execution.result = result
                  execution.completedAt = new Date().toISOString()
                }
              })

              // Add tool result message
              set((s) => {
                s.messages.push({
                  role: 'tool_result',
                  content: result.content,
                  timestamp: new Date().toISOString(),
                  toolResult: result
                })
              })
            } else {
              // No store access provided, skip tool execution
              set((s) => {
                const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
                if (execution) {
                  execution.status = 'error'
                  execution.result = {
                    toolCallId: toolCall.id,
                    content: 'Store access not available',
                    isError: true
                  }
                }
              })
            }
          }
        }

        // Check if we should stop
        if (response.finishReason !== 'tool_use') {
          break
        }

        iteration++
      }

      // Clean up
      set((s) => {
        s.isStreaming = false
        s.isAgentRunning = false
        s.currentIteration = 0
        s.currentStreamMessage = ''
        s.pendingApproval = null
      })
    } catch (error) {
      console.error('Agentic message error:', error)

      // Add error message
      set((s) => {
        s.messages.push({
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString()
        })
        s.isStreaming = false
        s.isAgentRunning = false
        s.currentIteration = 0
        s.currentStreamMessage = ''
        s.pendingApproval = null
      })

      throw error
    }
  }
})

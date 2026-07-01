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
  DEFAULT_AGENTIC_SETTINGS
} from '@renderer/lib/ai/types'
import { createAIProvider } from '@renderer/lib/ai'
import { getToolByName, executeToolCall, filterEnabledTools } from '@renderer/lib/ai/tools'
import { takeRecentMessages } from '@renderer/lib/ai/utils'
import type { StoreAccess } from '@renderer/lib/ai/tools/executor'
import type { AppStore } from '..'
import { logger } from '@renderer/lib/logger'

function isAbortError(error: unknown): boolean {
  return error instanceof Error && /abort/i.test(error.message)
}

/**
 * A question the agent asked via the ask_user tool. The agent loop pauses
 * until answerQuestion() is called (or the agent is stopped).
 */
export interface PendingQuestion {
  toolCall: ToolCall
  question: string
  options: string[]
}

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

export interface AISlice {
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
  pendingQuestion: PendingQuestion | null
  toolHistory: ToolExecution[]

  // Provider instance (not persisted)
  _provider: AIProviderInterface | null
  _pendingStoreAccess: StoreAccess | null
  _currentRequestId: string | null

  // Actions
  sendMessage: (prompt: string, context?: AIContext, onStream?: (chunk: string) => void) => Promise<void>
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
  answerQuestion: (answer: string) => void
  stopAgent: () => void
  updateAgenticSettings: (settings: Partial<AgenticSettings>) => void
  setPendingStoreAccess: (storeAccess: StoreAccess | null) => void

  // Custom prompts actions
  addCustomPrompt: (prompt: Omit<CustomPrompt, 'id' | 'created' | 'modified'>) => void
  updateCustomPrompt: (id: string, prompt: Partial<CustomPrompt>) => void
  deleteCustomPrompt: (id: string) => void
  setCustomPrompts: (prompts: CustomPrompt[]) => void

  // Suggestions actions
  addSuggestion: (suggestion: Omit<AISuggestion, 'id' | 'timestamp'>) => void
  applySuggestion: (id: string) => void
  clearSuggestions: () => void
}

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

export const createAISlice: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  AISlice
> = (set, get) => ({
  messages: [],
  isStreaming: false,
  currentStreamMessage: '',
  customPrompts: [],
  suggestions: [],
  agenticSettings: DEFAULT_AGENTIC_SETTINGS,
  isAgentRunning: false,
  currentIteration: 0,
  pendingApproval: null,
  pendingQuestion: null,
  toolHistory: [],
  _provider: null,
  _pendingStoreAccess: null,
  _currentRequestId: null,

  getProvider: () => {
    const state = get()
    if (!state._provider) {
      const config = state.getActiveConfig()
      const provider = createAIProvider(config)
      set((s) => { s._provider = provider })
      return provider
    }
    return state._provider
  },

  buildContext: (options) => {
    const state = get()
    const context: AIContext = {}

    // Always include the lightweight workspace map — it lets the agent
    // resolve "chapter 1" style references (or ask which book) without tools.
    if (state.books && Object.keys(state.books).length > 0) {
      context.workspace = {
        books: Object.values(state.books).map((book) => ({
          slug: book.slug,
          title: book.title,
          chapters: book.chapters.map((ch) => ({ slug: ch.slug, title: ch.title }))
        }))
      }
    }

    if (options.currentChapter) {
      const { bookSlug, chapterSlug } = options.currentChapter
      const chapter = state.books?.[bookSlug]?.chapters.find((c) => c.slug === chapterSlug)
      if (chapter) {
        context.currentChapter = { bookSlug, chapterSlug, title: chapter.title, content: chapter.content }
      }
    }

    if (options.selection) context.selection = options.selection

    if (options.includeEntities && state.entities) {
      context.entities = Object.values(state.entities).map((entity) => ({
        slug: entity.slug,
        name: entity.name,
        fields: entity.fields.map((f) => ({ name: f.name, value: f.value }))
      }))
    }

    if (get().messages.length > 0) {
      context.conversationHistory = takeRecentMessages(get().messages, 10)
    }

    return Object.keys(context).length > 0 ? context : undefined
  },

  sendMessage: async (prompt, context, onStream) => {
    try {
      set((state) => {
        state.isStreaming = true
        state.currentStreamMessage = ''
      })

      set((state) => {
        state.messages.push({ role: 'user', content: prompt, timestamp: new Date().toISOString() })
      })

      const provider = get().getProvider()

      await provider.streamComplete(
        { prompt, context, conversationHistory: takeRecentMessages(get().messages, 20) },
        (chunk) => {
          set((state) => { state.currentStreamMessage += chunk })
          onStream?.(chunk)
        }
      )

      set((state) => {
        state.messages.push({
          role: 'assistant',
          content: state.currentStreamMessage,
          timestamp: new Date().toISOString()
        })
        state.isStreaming = false
        state.currentStreamMessage = ''
      })
    } catch (error) {
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

  clearMessages: () => {
    set((state) => {
      state.messages = []
      state.currentStreamMessage = ''
    })
  },

  testConnection: async () => {
    try {
      // Reset provider so it picks up the latest config
      set((state) => { state._provider = null })
      return await get().getProvider().testConnection()
    } catch {
      return false
    }
  },

  listModels: async () => {
    try {
      // Reset provider so it picks up the latest config
      set((state) => { state._provider = null })
      const provider = get().getProvider()
      return provider.listModels ? await provider.listModels() : []
    } catch {
      return []
    }
  },

  addCustomPrompt: (prompt) => {
    set((state) => {
      const now = new Date().toISOString()
      state.customPrompts.push({ ...prompt, id: generateUUID(), created: now, modified: now })
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
    set((state) => { state.customPrompts = state.customPrompts.filter((p) => p.id !== id) })
  },

  setCustomPrompts: (prompts) => {
    set((state) => { state.customPrompts = prompts })
  },

  addSuggestion: (suggestion) => {
    set((state) => {
      state.suggestions.unshift({ ...suggestion, id: generateUUID(), timestamp: new Date().toISOString() })
      if (state.suggestions.length > 50) state.suggestions = state.suggestions.slice(0, 50)
    })
  },

  applySuggestion: (id) => {
    set((state) => {
      const s = state.suggestions.find((s) => s.id === id)
      if (s) s.applied = true
    })
  },

  clearSuggestions: () => {
    set((state) => { state.suggestions = [] })
  },

  updateAgenticSettings: (settings) => {
    set((state) => { state.agenticSettings = { ...state.agenticSettings, ...settings } })
  },

  stopAgent: () => {
    const requestId = get()._currentRequestId
    if (requestId) {
      window.api.fetch.abort(requestId).catch((error) => {
        logger.warn('Failed to abort AI request', 'aiSlice', error)
      })
    }
    set((state) => {
      state.isAgentRunning = false
      state.pendingApproval = null
      state.pendingQuestion = null
      state.currentIteration = 0
    })
  },

  answerQuestion: (answer) => {
    set((state) => {
      if (!state.pendingQuestion) return
      const { toolCall } = state.pendingQuestion
      const execution = state.toolHistory.find((t) => t.toolCall.id === toolCall.id)
      if (execution) {
        execution.status = 'completed'
        execution.completedAt = new Date().toISOString()
        execution.result = { toolCallId: toolCall.id, content: answer }
      }
      state.messages.push({
        role: 'tool_result',
        content: answer,
        timestamp: new Date().toISOString(),
        toolResult: {
          toolCallId: toolCall.id,
          content: `The user answered: ${answer}`,
          displayContent: answer
        }
      })
      state.pendingQuestion = null
    })
  },

  rejectToolCall: () => {
    set((state) => {
      if (state.pendingApproval) {
        const rejected = state.pendingApproval
        const execution = state.toolHistory.find((t) => t.toolCall.id === rejected.id)
        if (execution) {
          execution.status = 'rejected'
          execution.completedAt = new Date().toISOString()
        }
        state.messages.push({
          role: 'tool_result',
          content: `Rejected: ${rejected.name}`,
          timestamp: new Date().toISOString(),
          toolResult: {
            toolCallId: rejected.id,
            content:
              'The user rejected this tool call. Do not retry the same call with the same arguments. Ask the user how they would like to proceed, or take a different approach.',
            displayContent: `Rejected: ${rejected.name}`,
            isError: true
          }
        })
        // Keep the agent running so the model can see the rejection and adapt.
        // The user can still stop the whole run via stopAgent.
        state.pendingApproval = null
      }
    })
  },

  setPendingStoreAccess: (storeAccess) => {
    set((state) => { state._pendingStoreAccess = storeAccess })
  },

  approveToolCall: async (storeAccess) => {
    const toolCall = get().pendingApproval
    if (!toolCall) return

    set((s) => {
      s.pendingApproval = null
      const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
      if (execution) {
        execution.status = 'running'
        execution.approvedAt = new Date().toISOString()
      }
    })

    const result = await executeToolCall(toolCall, storeAccess)

    set((s) => {
      const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
      if (execution) {
        execution.status = result.isError ? 'error' : 'completed'
        execution.result = result
        execution.completedAt = new Date().toISOString()
      }
    })

    set((s) => {
      s.messages.push({
        role: 'tool_result',
        content: result.displayContent ?? result.content,
        timestamp: new Date().toISOString(),
        toolResult: result
      })
    })
  },

  sendAgenticMessage: async (prompt, context, storeAccess, onStream, onToolCall) => {
    const { agenticSettings } = get()

    if (!agenticSettings.enabled) {
      return get().sendMessage(prompt, context, onStream)
    }

    set((s) => { s._pendingStoreAccess = storeAccess || null })

    try {
      set((s) => {
        s.isStreaming = true
        s.isAgentRunning = true
        s.currentIteration = 0
        s.currentStreamMessage = ''
        s.toolHistory = []
      })

      set((s) => {
        s.messages.push({ role: 'user', content: prompt, timestamp: new Date().toISOString() })
      })

      const provider = get().getProvider()
      const tools = filterEnabledTools(agenticSettings.enabledTools)

      let iteration = 0
      while (iteration < agenticSettings.maxIterations && get().isAgentRunning) {
        set((s) => { s.currentIteration = iteration + 1 })

        const messages = get().messages

        // The user prompt is already in `messages` — passing it again as
        // options.prompt would duplicate the user message in the history.
        const requestId = generateUUID()
        set((s) => { s._currentRequestId = requestId })

        let response: Awaited<ReturnType<typeof provider.complete>>
        try {
          response = await provider.complete({
            prompt: '',
            context: { ...context, conversationHistory: takeRecentMessages(messages, 20) },
            tools: tools.length > 0 ? tools : undefined,
            toolChoice: 'auto',
            requestId
          })
        } finally {
          set((s) => { s._currentRequestId = null })
        }

        // The user may have stopped the agent while the request was in flight
        if (!get().isAgentRunning) break

        // Push the assistant message even when the model returned only tool
        // calls with no text — a tool_result without its matching assistant
        // tool_use message makes the next request malformed.
        if (response.content || (response.toolCalls && response.toolCalls.length > 0)) {
          if (response.content) {
            set((s) => { s.currentStreamMessage = response.content })
            onStream?.(response.content)
          }
          set((s) => {
            s.messages.push({
              role: 'assistant',
              content: response.content || '',
              timestamp: new Date().toISOString(),
              toolCalls: response.toolCalls
            })
          })
        }

        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const toolCall of response.toolCalls) {
            if (!get().isAgentRunning) break

            onToolCall?.(toolCall)

            // ask_user is not executed — it pauses the loop until the user answers
            if (toolCall.name === 'ask_user') {
              const question = String(toolCall.arguments.question || '')
              const options = Array.isArray(toolCall.arguments.options)
                ? (toolCall.arguments.options as unknown[]).map(String)
                : []

              set((s) => {
                s.toolHistory.push({
                  id: generateUUID(),
                  toolCall,
                  status: 'running',
                  timestamp: new Date().toISOString()
                })
                s.pendingQuestion = { toolCall, question, options }
              })

              await new Promise<void>((resolve) => {
                const check = setInterval(() => {
                  if (!get().pendingQuestion || !get().isAgentRunning) {
                    clearInterval(check)
                    resolve()
                  }
                }, 100)
              })

              if (!get().isAgentRunning) break
              continue
            }

            const tool = getToolByName(toolCall.name)
            const isWriteOp = tool?.requiresApproval
            const shouldAskApproval =
              agenticSettings.approvalMode === 'all' ||
              (agenticSettings.approvalMode === 'write_only' && isWriteOp)

            set((s) => {
              s.toolHistory.push({
                id: generateUUID(),
                toolCall,
                status: shouldAskApproval ? 'pending' : 'running',
                timestamp: new Date().toISOString()
              })
            })

            if (shouldAskApproval) {
              set((s) => { s.pendingApproval = toolCall })

              await new Promise<void>((resolve) => {
                const check = setInterval(() => {
                  if (!get().pendingApproval || !get().isAgentRunning) {
                    clearInterval(check)
                    resolve()
                  }
                }, 100)
              })

              if (!get().isAgentRunning) break
            } else if (storeAccess) {
              const result = await executeToolCall(toolCall, storeAccess)

              set((s) => {
                const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
                if (execution) {
                  execution.status = result.isError ? 'error' : 'completed'
                  execution.result = result
                  execution.completedAt = new Date().toISOString()
                }
              })

              set((s) => {
                s.messages.push({
                  role: 'tool_result',
                  content: result.displayContent ?? result.content,
                  timestamp: new Date().toISOString(),
                  toolResult: result
                })
              })
            } else {
              // Every tool_use needs a matching tool_result in the history,
              // otherwise the next request is malformed (hard error on Anthropic).
              const result: ToolResult = {
                toolCallId: toolCall.id,
                content: 'Tool execution failed: store access not available',
                displayContent: 'Tool could not run',
                isError: true
              }
              set((s) => {
                const execution = s.toolHistory.find((t) => t.toolCall.id === toolCall.id)
                if (execution) {
                  execution.status = 'error'
                  execution.result = result
                }
                s.messages.push({
                  role: 'tool_result',
                  content: result.displayContent ?? result.content,
                  timestamp: new Date().toISOString(),
                  toolResult: result
                })
              })
            }
          }
        }

        if (response.finishReason !== 'tool_use') break
        iteration++
      }

      set((s) => {
        if (iteration >= agenticSettings.maxIterations && s.isAgentRunning) {
          s.messages.push({
            role: 'assistant',
            content: `Stopped after reaching the maximum of ${agenticSettings.maxIterations} iterations. Send a follow-up message to continue.`,
            timestamp: new Date().toISOString()
          })
        }
        s.isStreaming = false
        s.isAgentRunning = false
        s.currentIteration = 0
        s.currentStreamMessage = ''
        s.pendingApproval = null
        s.pendingQuestion = null
        s._currentRequestId = null
      })
    } catch (error) {
      const aborted = isAbortError(error)
      set((s) => {
        s.messages.push({
          role: 'assistant',
          content: aborted
            ? 'Stopped by user.'
            : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString()
        })
        s.isStreaming = false
        s.isAgentRunning = false
        s.currentIteration = 0
        s.currentStreamMessage = ''
        s.pendingApproval = null
        s.pendingQuestion = null
        s._currentRequestId = null
      })
      if (!aborted) throw error
    }
  }
})

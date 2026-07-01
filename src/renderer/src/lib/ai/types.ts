/**
 * AI Provider types
 */
export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'gemini'

/**
 * AI Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool_result'

/**
 * Tool categories
 */
export type ToolCategory = 'file' | 'analysis' | 'generation' | 'app' | 'interaction'

/**
 * Approval mode for tool execution
 */
export type ApprovalMode = 'all' | 'write_only' | 'none'

/**
 * Tool definition (JSON Schema based)
 */
export interface ToolDefinition {
  name: string
  description: string
  category: ToolCategory
  requiresApproval: boolean // true for write operations
  parameters: {
    type: 'object'
    properties: Record<string, ToolParameterSchema>
    required?: string[]
  }
}

/**
 * Tool parameter schema
 */
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?: string[]
  items?: ToolParameterSchema
  default?: unknown
}

/**
 * Tool call from AI
 */
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  // Gemini 2.5+ returns a thought signature with each functionCall part and
  // requires it to be echoed back verbatim when the history is resent.
  // Opaque passthrough — other providers ignore it.
  thoughtSignature?: string
}

/**
 * Tool execution result
 *
 * `content` is what the AI sees (full detail, including raw error messages).
 * `displayContent` is a short, human-friendly summary shown in the chat UI.
 * When absent, the UI falls back to `content`.
 */
export interface ToolResult {
  toolCallId: string
  content: string
  displayContent?: string
  isError?: boolean
}

/**
 * Tool execution status
 */
export type ToolExecutionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'running'
  | 'completed'
  | 'error'

/**
 * Tool execution record
 */
export interface ToolExecution {
  id: string
  toolCall: ToolCall
  status: ToolExecutionStatus
  result?: ToolResult
  timestamp: string
  approvedAt?: string
  completedAt?: string
}

/**
 * AI Message
 */
export interface AIMessage {
  role: MessageRole
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  toolResult?: ToolResult
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
  // Lightweight map of the whole workspace (titles + slugs only, no content).
  // Lets the agent resolve "chapter 1" style references without tool calls.
  workspace?: {
    books: Array<{
      slug: string
      title: string
      chapters: Array<{ slug: string; title: string }>
    }>
  }
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
  conversationHistory?: AIMessage[]
  tools?: ToolDefinition[]
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'tool'; name: string }
  // Id used to cancel the underlying HTTP request via fetch.abort(requestId)
  requestId?: string
}

/**
 * AI Response
 */
export interface AIResponse {
  content: string
  finishReason?: 'stop' | 'length' | 'error' | 'tool_use'
  toolCalls?: ToolCall[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Streaming callback with tool support
 */
export type StreamCallbackExtended = (event: StreamEvent) => void

/**
 * Stream event types
 */
export type StreamEvent =
  | { type: 'text'; content: string; done: boolean }
  | { type: 'tool_call_start'; toolCall: Partial<ToolCall> }
  | { type: 'tool_call_delta'; id: string; arguments: string }
  | { type: 'tool_call_end'; toolCall: ToolCall }
  | { type: 'done'; finishReason?: 'stop' | 'length' | 'error' | 'tool_use' }
  | { type: 'error'; error: string }

/**
 * Agentic settings
 */
export interface AgenticSettings {
  enabled: boolean
  maxIterations: number
  approvalMode: ApprovalMode
  enabledTools: string[]
}

/**
 * Default agentic settings
 */
export const DEFAULT_AGENTIC_SETTINGS: AgenticSettings = {
  enabled: true,
  maxIterations: 10,
  approvalMode: 'write_only',
  enabledTools: []
}

/**
 * Model info for dynamic model management
 */
export interface ModelInfo {
  id: string
  name: string
  provider: AIProvider
  visible: boolean
  order: number
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
  },
  gemini: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2000
  }
}

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
export interface PresetPrompt {
  label: string
  prompt: string
  category: 'writing' | 'analysis'
}

export const PRESET_PROMPTS: Record<string, PresetPrompt> = {
  expandScene: {
    label: 'Expand Scene',
    prompt: 'Expand this scene with more descriptive details and sensory information.',
    category: 'writing'
  },
  checkGrammar: {
    label: 'Check Grammar',
    prompt: 'Check the grammar and style of the selected text. List all issues found.',
    category: 'writing'
  },
  makeDramatic: {
    label: 'Make Dramatic',
    prompt: 'Rewrite this text to make it more dramatic and emotionally engaging.',
    category: 'writing'
  },
  writeDialogue: {
    label: 'Write Dialogue',
    prompt: 'Write a dialogue between the mentioned characters based on their personalities.',
    category: 'writing'
  },
  summarize: {
    label: 'Summarize',
    prompt: 'Provide a concise summary of this chapter.',
    category: 'analysis'
  },
  findPlotHoles: {
    label: 'Find Plot Holes',
    prompt: 'Analyze this content for any plot holes or inconsistencies.',
    category: 'analysis'
  },
  suggestImprovements: {
    label: 'Suggest Improvements',
    prompt: 'Suggest improvements to make this text more compelling.',
    category: 'analysis'
  },
  characterConsistency: {
    label: 'Check Character Consistency',
    prompt:
      'Check if the character behavior is consistent with their defined personality and background.',
    category: 'analysis'
  },
  adaptStyle: {
    label: 'Adapt Style',
    prompt:
      'Adapt the writing style of the selected text (tell me the target style: formal, casual, literary, journalistic, academic, or poetic). Preserve @mentions.',
    category: 'writing'
  },
  changePOV: {
    label: 'Change Point of View',
    prompt:
      'Change the point of view of the selected text (tell me the target POV: first person, second person, third person limited, or omniscient). Preserve @mentions.',
    category: 'writing'
  },
  simplifyText: {
    label: 'Simplify Text',
    prompt: 'Simplify the selected text to make it easier to read while preserving @mentions.',
    category: 'writing'
  },
  translateText: {
    label: 'Translate',
    prompt:
      'Translate the selected text (tell me the target language). Keep character and place names untranslated and preserve @mentions.',
    category: 'writing'
  },
  addSensoryDetails: {
    label: 'Add Sensory Details',
    prompt:
      'Enhance the selected text with sensory descriptions (sight, sound, smell, touch, taste) while preserving @mentions.',
    category: 'writing'
  },
  removeFilterWords: {
    label: 'Remove Filter Words',
    prompt:
      'Remove filter words (e.g., "seemed", "felt", "appeared") from the selected text and strengthen the prose while preserving @mentions.',
    category: 'writing'
  },
  brainstormIdeas: {
    label: 'Brainstorm Ideas',
    prompt:
      'Brainstorm creative ideas for my story (tell me the focus: plot twist, conflict, backstory, subplot, ending, or opening).',
    category: 'writing'
  },
  generateOutline: {
    label: 'Generate Outline',
    prompt: 'Generate an outline for this chapter or story based on the premise I describe.',
    category: 'writing'
  }
}

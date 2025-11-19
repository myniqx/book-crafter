import type {
  MessageRole,
  AIProvider,
  ToolCall,
  ToolResult,
  ToolExecutionStatus
} from '@renderer/lib/ai/types'

export interface ModelSelectorProps {
  className?: string
}

export type ProviderModels = Record<AIProvider, string[]>

export interface AIChatPanelProps {
  // Optional props for pre-set context
  initialPrompt?: string
  bookSlug?: string
  chapterSlug?: string
  selection?: {
    text: string
    start: number
    end: number
  }
}

export interface MessageBubbleProps {
  role: MessageRole
  content: string
  timestamp: string
  isStreaming?: boolean
  toolCalls?: ToolCall[]
  toolResult?: ToolResult
  toolStatus?: ToolExecutionStatus
  onApprove?: () => void
  onReject?: () => void
}

export interface ContextDisplayProps {
  context: {
    currentChapter?: {
      bookSlug: string
      chapterSlug: string
      title: string
    }
    selection?: {
      text: string
    }
    entities?: Array<{
      slug: string
      name: string
    }>
  }
}

export interface PresetPromptsSelectorProps {
  onSelectPrompt: (prompt: string) => void
  className?: string
}

export interface HeaderMenuProps {
  showContext: boolean
  onShowContextChange: (value: boolean) => void
  messagesCount: number
  onClearMessages: () => void
  className?: string
}

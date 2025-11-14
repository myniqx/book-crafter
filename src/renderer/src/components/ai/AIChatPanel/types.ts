import type { MessageRole } from '@renderer/lib/ai/types'

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

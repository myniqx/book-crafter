import React, { useState, useRef, useEffect } from 'react'
import { useToolsStore, useContentStore } from '@renderer/store'
import type { AIChatPanelProps } from './types'
import { Bot, Send, Sparkles, FileText, Users } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { ModelSelector } from './ModelSelector'
import { PresetPromptsSelector } from './PresetPromptsSelector'
import { MessageBubble } from './MessageBubble'
import { HeaderMenu } from './HeaderMenu'

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  initialPrompt,
  bookSlug,
  chapterSlug,
  selection
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || '')
  const [showContext, setShowContext] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tools store state
  const messages = useToolsStore((state) => state.messages)
  const isStreaming = useToolsStore((state) => state.isStreaming)
  const currentStreamMessage = useToolsStore((state) => state.currentStreamMessage)

  // Tools store actions
  const sendMessage = useToolsStore((state) => state.sendMessage)
  const clearMessages = useToolsStore((state) => state.clearMessages)
  const buildContext = useToolsStore((state) => state.buildContext)

  // Content store state
  const books = useContentStore((state) => state.books)

  // Build context from props or current state
  const context = buildContext({
    currentChapter: bookSlug && chapterSlug ? { bookSlug, chapterSlug } : undefined,
    selection,
    includeEntities: true
  })

  // Get current chapter info
  const currentChapter =
    bookSlug && chapterSlug
      ? {
        book: books[bookSlug],
        chapter: books[bookSlug]?.chapters.find((c) => c.slug === chapterSlug)
      }
      : null

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentStreamMessage])

  // Focus input when streaming ends
  useEffect(() => {
    if (!isStreaming) {
      inputRef.current?.focus()
    }
  }, [isStreaming])

  const handleSend = async (): Promise<void> => {
    if (!prompt.trim() || isStreaming) return

    try {
      await sendMessage(prompt, context)
      setPrompt('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2 grow">
            <div className="flex flex-row gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-foreground line-clamp-1">AI Assistant</span>
            </div>
            <ModelSelector />
          </div>

          <div className="shrink-0">
            <HeaderMenu
              showContext={showContext}
              onShowContextChange={setShowContext}
              messagesCount={messages.length}
              onClearMessages={clearMessages}
            />
          </div>
        </div>

        {/* Context Display */}
        {showContext && context && (
          <div className="mt-3 space-y-2">
            {context.currentChapter && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>
                  {currentChapter?.book?.title} - {currentChapter?.chapter?.title}
                </span>
              </div>
            )}

            {context.selection && (
              <div className="flex items-start gap-2 text-xs">
                <Sparkles className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div className="flex-1 rounded bg-muted px-2 py-1 text-muted-foreground">
                  <span className="line-clamp-2">{context.selection.text}</span>
                </div>
              </div>
            )}

            {context.entities && context.entities.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>
                  {context.entities.length} entities:{' '}
                  {context.entities
                    .slice(0, 3)
                    .map((e) => e.name)
                    .join(', ')}
                  {context.entities.length > 3 && ` +${context.entities.length - 3} more`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-muted mb-4" />
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                AI Writing Assistant
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Ask me anything about your story, characters, or writing. I can help expand scenes,
                check grammar, suggest improvements, and more.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}

          {/* Streaming message */}
          {isStreaming && currentStreamMessage && (
            <MessageBubble
              role="assistant"
              content={currentStreamMessage}
              timestamp={new Date().toISOString()}
              isStreaming={true}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4 space-y-2">
        {/* Preset Prompts */}
        <div className="flex items-center gap-2">
          <PresetPromptsSelector onSelectPrompt={setPrompt} />
        </div>

        {/* Input */}
        <div className="flex items-end gap-2">
          <Input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1"
            disabled={isStreaming}
          />
          <Button onClick={handleSend} disabled={!prompt.trim() || isStreaming} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '@renderer/store'
import { PRESET_PROMPTS } from '@renderer/lib/ai/types'
import type { AIChatPanelProps, MessageBubbleProps } from './types'
import { cn } from '@renderer/lib/utils'
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  FileText,
  Users,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Card } from '@renderer/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@renderer/components/ui/dropdown-menu'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { AISettingsDialog } from '@renderer/components/ai/AISettingsDialog'
import { CustomPromptsDialog } from '@renderer/components/ai/CustomPromptsDialog'

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  initialPrompt,
  bookSlug,
  chapterSlug,
  selection
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || '')
  const [showContext, setShowContext] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Store state
  const messages = useStore((state) => state.messages)
  const isStreaming = useStore((state) => state.isStreaming)
  const currentStreamMessage = useStore((state) => state.currentStreamMessage)
  const config = useStore((state) => state.config)
  const books = useStore((state) => state.books)
  const entities = useStore((state) => state.entities)
  const customPrompts = useStore((state) => state.customPrompts)

  // Store actions
  const sendMessage = useStore((state) => state.sendMessage)
  const clearMessages = useStore((state) => state.clearMessages)
  const buildContext = useStore((state) => state.buildContext)

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

  const handleSend = async (): Promise<void> => {
    if (!prompt.trim() || isStreaming) return

    try {
      await sendMessage(prompt, context)
      setPrompt('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handlePresetPrompt = (presetPrompt: string): void => {
    setPrompt(presetPrompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-slate-300">AI Assistant</span>
            <Badge variant="secondary" className="text-xs">
              {config.provider} / {config.model}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowContext(!showContext)}
              className="h-7"
            >
              <FileText className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clearMessages()}
              disabled={messages.length === 0}
              className="h-7"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <CustomPromptsDialog />
            <AISettingsDialog />
          </div>
        </div>

        {/* Context Display */}
        {showContext && context && (
          <div className="mt-3 space-y-2">
            {context.currentChapter && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileText className="h-3 w-3" />
                <span>
                  {currentChapter?.book?.title} - {currentChapter?.chapter?.title}
                </span>
              </div>
            )}

            {context.selection && (
              <div className="flex items-start gap-2 text-xs">
                <Sparkles className="h-3 w-3 text-slate-400 mt-0.5" />
                <div className="flex-1 rounded bg-slate-800 px-2 py-1 text-slate-300">
                  <span className="line-clamp-2">{context.selection.text}</span>
                </div>
              </div>
            )}

            {context.entities && context.entities.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
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
              <Bot className="h-12 w-12 text-slate-700 mb-4" />
              <h3 className="text-sm font-medium text-slate-400 mb-2">AI Writing Assistant</h3>
              <p className="text-xs text-slate-500 max-w-sm">
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
      <div className="border-t border-slate-800 bg-slate-900 p-4 space-y-2">
        {/* Preset Prompts */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7">
                <Sparkles className="h-3 w-3 mr-1" />
                Presets
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePresetPrompt(PRESET_PROMPTS.expandScene)}>
                Expand Scene
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetPrompt(PRESET_PROMPTS.checkGrammar)}>
                Check Grammar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetPrompt(PRESET_PROMPTS.makeDramatic)}>
                Make Dramatic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetPrompt(PRESET_PROMPTS.writeDialogue)}>
                Write Dialogue
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Analysis</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handlePresetPrompt(PRESET_PROMPTS.summarize)}>
                Summarize
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetPrompt(PRESET_PROMPTS.findPlotHoles)}>
                Find Plot Holes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePresetPrompt(PRESET_PROMPTS.suggestImprovements)}
              >
                Suggest Improvements
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePresetPrompt(PRESET_PROMPTS.characterConsistency)}
              >
                Check Character Consistency
              </DropdownMenuItem>

              {/* Custom Prompts */}
              {customPrompts.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Custom Prompts</DropdownMenuLabel>
                  {customPrompts.map((cp) => (
                    <DropdownMenuItem key={cp.id} onClick={() => handlePresetPrompt(cp.prompt)}>
                      {cp.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Input */}
        <div className="flex items-end gap-2">
          <Input
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

/**
 * Message bubble component
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, timestamp, isStreaming = false }) => {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-blue-500' : 'bg-purple-500'
        )}
      >
        {isUser ? (
          <span className="text-xs font-medium text-white">You</span>
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message */}
      <div className={cn('flex-1 space-y-1', isUser && 'flex flex-col items-end')}>
        <div className="relative group">
          <Card
            className={cn(
              'inline-block max-w-[85%] p-3',
              isUser
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </Card>

          {/* Copy button - only for assistant messages */}
          {!isUser && !isStreaming && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 hover:bg-slate-600"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {copied && <span className="text-xs text-green-400">Copied!</span>}
        </div>
      </div>
    </div>
  )
}

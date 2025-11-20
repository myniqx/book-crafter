import React, { useState } from 'react'
import type { MessageBubbleProps } from './types'
import { cn } from '@renderer/lib/utils'
import { Bot, Copy, Check, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { ToolBubble } from './ToolBubble'

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  timestamp,
  isStreaming = false,
  toolCalls,
  toolResult,
  onApprove,
  onReject,
  toolStatus
}) => {
  const isUser = role === 'user'
  const isToolResult = role === 'tool_result'
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

  // Tool result message
  if (isToolResult && toolResult) {
    return (
      <div className="flex gap-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            toolResult.isError ? 'bg-red-500' : 'bg-purple-500'
          )}
        >
          {toolResult.isError ? (
            <XCircle className="h-4 w-4 text-white" />
          ) : (
            <CheckCircle className="h-4 w-4 text-white" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <Card
            className={cn(
              'inline-block max-w-4xl p-3 select-text',
              toolResult.isError
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-purple-500/10 border-purple-500/30'
            )}
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">Tool Result</p>
            <pre className="text-sm whitespace-pre-wrap wrap-break-word max-h-48 overflow-auto">
              {content}
            </pre>
          </Card>

          <span className="text-xs text-muted-foreground select-text">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-blue-500' : 'bg-green-500'
        )}
      >
        {isUser ? (
          <span className="text-xs font-medium text-white select-text">You</span>
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message */}
      <div className={cn('flex-1 space-y-2', isUser && 'flex flex-col items-end')}>
        {/* Text content */}
        {content && (
          <div className="relative group">
            <Card
              className={cn(
                'inline-block max-w-4xl p-3 select-text',
                isUser
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-muted text-foreground border-border'
              )}
            >
              <p className="text-sm whitespace-pre-wrap wrap-break-word">{content}</p>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </Card>

            {/* Copy button - only for assistant messages */}
            {!isUser && !isStreaming && content && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-accent"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Tool calls */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="space-y-2 w-full max-w-4xl">
            {toolCalls.map((tc) => (
              <ToolBubble
                key={tc.id}
                toolCall={tc}
                status={toolStatus || 'completed'}
                onApprove={toolStatus === 'pending' ? onApprove : undefined}
                onReject={toolStatus === 'pending' ? onReject : undefined}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
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

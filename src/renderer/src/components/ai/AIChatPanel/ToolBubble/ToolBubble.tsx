import React, { useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { Wrench, CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import type { ToolCall, ToolResult, ToolExecutionStatus } from '@renderer/lib/ai/types'

interface ToolBubbleProps {
  toolCall: ToolCall
  result?: ToolResult
  status: ToolExecutionStatus
  onApprove?: () => void
  onReject?: () => void
  className?: string
}

export const ToolBubble: React.FC<ToolBubbleProps> = ({
  toolCall,
  result,
  status,
  onApprove,
  onReject,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      label: 'Pending Approval'
    },
    approved: {
      icon: Loader2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      label: 'Approved'
    },
    running: {
      icon: Loader2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      label: 'Running'
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      label: 'Completed'
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Error'
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Rejected'
    }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className={cn('rounded-lg border p-3 text-sm', config.bg, config.border, className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{toolCall.name}</span>
          <StatusIcon
            className={cn('h-4 w-4', config.color, status === 'running' && 'animate-spin')}
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Arguments */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Arguments</p>
            <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {result && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Result</p>
              <pre
                className={cn(
                  'text-xs p-2 rounded overflow-x-auto max-h-48',
                  result.isError ? 'bg-red-500/10' : 'bg-background/50'
                )}
              >
                {result.content}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Approval buttons */}
      {status === 'pending' && onApprove && onReject && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onApprove}
            className="flex-1 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-500"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="flex-1 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-500"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}

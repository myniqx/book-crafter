import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle, Wrench } from 'lucide-react'
import type { ToolCall } from '@renderer/lib/ai/types'
import { getToolByName } from '@renderer/lib/ai/tools'
import { useStore } from '@renderer/store'

interface ApprovalDialogProps {
  toolCall: ToolCall | null
  open: boolean
  onApprove: () => void
  onReject: () => void
}

/**
 * Tool-aware preview of what the call will change. Text edits render as an
 * old → new diff instead of raw JSON parameters.
 */
const ToolCallPreview: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  const books = useStore((state) => state.books)
  const args = toolCall.arguments as Record<string, string | undefined>

  if (toolCall.name === 'edit_chapter' && args.oldText !== undefined) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Change in {args.bookSlug} / {args.chapterSlug}:
        </p>
        <pre className="text-xs bg-red-900/20 text-red-300 p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
          {args.oldText}
        </pre>
        <pre className="text-xs bg-green-900/20 text-green-300 p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
          {args.newText}
        </pre>
      </div>
    )
  }

  if (toolCall.name === 'write_chapter' && args.content !== undefined) {
    const currentContent =
      books[args.bookSlug || '']?.chapters.find((c) => c.slug === args.chapterSlug)?.content || ''
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Replaces the ENTIRE content of {args.bookSlug} / {args.chapterSlug} (
          {currentContent.length.toLocaleString()} → {args.content.length.toLocaleString()} chars):
        </p>
        <pre className="text-xs bg-green-900/20 text-green-300 p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap">
          {args.content}
        </pre>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">Parameters:</p>
      <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-32">
        {JSON.stringify(toolCall.arguments, null, 2)}
      </pre>
    </div>
  )
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  toolCall,
  open,
  onApprove,
  onReject
}) => {
  if (!toolCall) return null

  const tool = getToolByName(toolCall.name)
  const isTextEdit = toolCall.name === 'edit_chapter' || toolCall.name === 'write_chapter'

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className={isTextEdit ? 'sm:max-w-2xl' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Tool Approval Required
          </DialogTitle>
          <DialogDescription>
            The AI wants to execute a tool that may modify your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tool info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{toolCall.name}</span>
            </div>
            {tool && <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>}
            <ToolCallPreview toolCall={toolCall} />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p>
              This action will modify your workspace data. Make sure you review the parameters
              before approving.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onReject}
            className="border-red-500/30 hover:bg-red-500/10 text-red-500"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

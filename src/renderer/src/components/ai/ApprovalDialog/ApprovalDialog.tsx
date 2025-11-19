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

interface ApprovalDialogProps {
  toolCall: ToolCall | null
  open: boolean
  onApprove: () => void
  onReject: () => void
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  toolCall,
  open,
  onApprove,
  onReject
}) => {
  if (!toolCall) return null

  const tool = getToolByName(toolCall.name)

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-md">
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
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Parameters:</p>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-32">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
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

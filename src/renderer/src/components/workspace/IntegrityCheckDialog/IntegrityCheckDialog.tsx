import React, { useState } from 'react'
import { AlertCircle, FolderX, FileX, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import type { IntegrityCheckDialogProps, IntegrityIssue } from './types'

const getIssueIcon = (type: IntegrityIssue['type']) => {
  switch (type) {
    case 'missing_folder':
      return <FolderX className="h-4 w-4 text-tertiary" />
    case 'missing_file':
      return <FileX className="h-4 w-4 text-tertiary" />
    case 'invalid_json':
      return <AlertTriangle className="h-4 w-4 text-error" />
  }
}

export const IntegrityCheckDialog: React.FC<IntegrityCheckDialogProps> = ({
  open,
  onOpenChange,
  issues,
  onRepair,
  onIgnore
}) => {
  const [isRepairing, setIsRepairing] = useState(false)

  const handleRepair = async () => {
    setIsRepairing(true)
    try {
      await onRepair()
      onOpenChange(false)
    } catch (error) {
      // Error handled by onRepair
    } finally {
      setIsRepairing(false)
    }
  }

  const handleIgnore = () => {
    onIgnore()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-tertiary" />
            Workspace Integrity Issues
          </DialogTitle>
          <DialogDescription>
            We found {issues.length} issue{issues.length > 1 ? 's' : ''} with your workspace
            structure. Would you like to repair them automatically?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[300px] overflow-y-auto">
          <div className="space-y-2">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  'bg-surface-container border-outline-variant'
                )}
              >
                {getIssueIcon(issue.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{issue.description}</p>
                  <p className="text-xs text-on-surface-variant mt-1 truncate">{issue.path}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary-container/20 border border-primary/30 rounded-lg p-3">
          <p className="text-xs text-primary">
            <strong>Repair</strong> will create missing folders and files automatically. This is
            safe and recommended.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleIgnore} disabled={isRepairing}>
            Ignore for Now
          </Button>
          <Button type="button" onClick={handleRepair} disabled={isRepairing}>
            {isRepairing ? 'Repairing...' : 'Repair Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

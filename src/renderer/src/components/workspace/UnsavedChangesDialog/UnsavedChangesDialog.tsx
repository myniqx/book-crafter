import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import type { UnsavedChangesDialogProps } from './types'

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  onCancel
}) => {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
      onOpenChange(false)
    } catch (error) {
      // Error handled by onSave
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    onDiscard()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes in your workspace. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              Your changes will be lost if you don't save them before continuing.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDiscard}
            disabled={isSaving}
          >
            Discard Changes
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

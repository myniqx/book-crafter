export interface UnsavedChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
  onDiscard: () => void
  onCancel: () => void
}

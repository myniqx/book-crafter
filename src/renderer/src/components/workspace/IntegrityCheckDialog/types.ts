export interface IntegrityIssue {
  type: 'missing_folder' | 'missing_file' | 'invalid_json'
  path: string
  description: string
}

export interface IntegrityCheckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issues: IntegrityIssue[]
  onRepair: () => Promise<void>
  onIgnore: () => void
}

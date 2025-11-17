export interface CreateProjectFormData {
  projectName: string
  author: string
  location: string
}

export interface CreateProjectDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

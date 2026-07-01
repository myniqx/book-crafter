import type { ButtonProps } from '@renderer/components/ui/button'

export interface CreateChapterDialogProps {
  bookSlug: string
  triggerProps?: ButtonProps
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

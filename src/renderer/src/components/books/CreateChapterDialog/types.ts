import type { ButtonProps } from '@renderer/components/ui/button'

export interface CreateChapterDialogProps {
  /**
   * Book slug to add the chapter to
   */
  bookSlug: string

  /**
   * Optional trigger button props to customize the trigger button
   */
  triggerProps?: ButtonProps
}

export interface DiffViewerProps {
  original: string
  suggested: string
  onApply: (text: string) => void
  onReject: () => void
  title?: string
}

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed'
  content: string
  lineNumber: number
}

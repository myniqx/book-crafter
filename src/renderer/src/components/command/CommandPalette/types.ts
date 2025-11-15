export interface Command {
  id: string
  label: string
  description?: string
  category: 'Create' | 'AI' | 'Search' | 'Navigation' | 'General' | 'Editor'
  shortcut?: string
  keywords?: string[]
  action: () => void
  icon?: React.ReactNode
}

export interface CommandPaletteProps {
  // No props needed - uses global state and keyboard shortcut
}

import type { editor } from 'monaco-editor'

export interface MonacoEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  theme?: 'vs-dark' | 'light'
  readOnly?: boolean
  className?: string
  options?: editor.IStandaloneEditorConstructionOptions
}

export interface EditorInstance {
  getValue: () => string
  setValue: (value: string) => void
  focus: () => void
  getSelection: () => string
  insertText: (text: string) => void
}

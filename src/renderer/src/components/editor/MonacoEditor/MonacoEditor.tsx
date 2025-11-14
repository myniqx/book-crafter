import React, { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useStore } from '@renderer/store'
import type { MonacoEditorProps } from './types'
import { cn } from '@renderer/lib/utils'

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'markdown',
  theme,
  readOnly = false,
  className,
  options
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get theme and editor settings from store
  const storeTheme = useStore((state) => state.theme)
  const editorSettings = useStore((state) => state.workspaceConfig?.editorSettings)

  // Determine Monaco theme based on app theme
  const monacoTheme = theme || (storeTheme === 'light' ? 'light' : 'vs-dark')

  // Merge default options with custom options
  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    fontSize: editorSettings?.fontSize || 14,
    lineHeight: editorSettings?.lineHeight ? editorSettings.lineHeight * 20 : 28,
    wordWrap: editorSettings?.wordWrap ? 'on' : 'off',
    minimap: {
      enabled: editorSettings?.minimap ?? false
    },
    lineNumbers: editorSettings?.lineNumbers ? 'on' : 'off',
    tabSize: editorSettings?.tabSize || 2,
    readOnly,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    },
    suggest: {
      showWords: true,
      showKeywords: true
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    }
  }

  const mergedOptions = { ...defaultOptions, ...options }

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor

    // Focus editor on mount
    editor.focus()
  }

  // Handle content change with debouncing for auto-save
  const handleEditorChange = (newValue: string | undefined): void => {
    if (!onChange || newValue === undefined) return

    const autoSave = editorSettings?.autoSave ?? true
    const autoSaveDelay = editorSettings?.autoSaveDelay || 1000

    if (autoSave) {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout for debounced save
      timeoutRef.current = setTimeout(() => {
        onChange(newValue)
      }, autoSaveDelay)
    } else {
      // Immediate update if auto-save is disabled
      onChange(newValue)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('w-full h-full border border-[hsl(var(--border))] rounded-lg overflow-hidden', className)}>
      <Editor
        value={value}
        language={language}
        theme={monacoTheme}
        options={mergedOptions}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-[hsl(var(--muted-foreground))]">Loading editor...</div>
          </div>
        }
      />
    </div>
  )
}

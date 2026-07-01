import React, { useRef, useEffect } from 'react'
import Editor, { OnMount, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import type { editor } from 'monaco-editor'
import { useStore } from '@renderer/store'
import { logger } from '@renderer/lib/logger'
import type { MonacoEditorProps } from './types'
import { cn } from '@renderer/lib/utils'
import { PRESET_PROMPTS } from '@renderer/lib/ai/types'

// Configure Monaco to load from local package instead of CDN
loader.config({ monaco })

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
  const storeTheme = useStore((state) => state.generalSettings.theme)
  const editorSettings = useStore((state) => state.extendedEditorSettings)

  // Get AI actions from store
  const sendMessage = useStore((state) => state.sendMessage)
  const buildContext = useStore((state) => state.buildContext)
  const addSuggestion = useStore((state) => state.addSuggestion)

  // Determine Monaco theme based on app theme
  const monacoTheme = theme || (storeTheme === 'light' ? 'light' : 'vs-dark')

  // Merge default options with custom options
  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    fontSize: editorSettings.fontSize,
    lineHeight: editorSettings.lineHeight * 20,
    wordWrap: editorSettings.wordWrap ? 'on' : 'off',
    minimap: { enabled: editorSettings.minimap },
    lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
    tabSize: editorSettings.tabSize,
    fontFamily: editorSettings.fontFamily,
    cursorStyle: editorSettings.cursorStyle,
    cursorBlinking: editorSettings.cursorBlinking,
    renderWhitespace: editorSettings.renderWhitespace,
    bracketPairColorization: { enabled: editorSettings.bracketPairColorization },
    autoClosingBrackets: editorSettings.autoClosingBrackets,
    formatOnSave: editorSettings.formatOnSave,
    formatOnPaste: editorSettings.formatOnPaste,
    trimAutoWhitespace: editorSettings.trimAutoWhitespace,
    readOnly,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
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

    // Add AI context menu actions
    const aiActions = [
      {
        id: 'ai.expandScene',
        label: 'AI: Expand This Scene',
        contextMenuGroupId: 'ai',
        contextMenuOrder: 1,
        prompt: PRESET_PROMPTS.expandScene
      },
      {
        id: 'ai.checkGrammar',
        label: 'AI: Check Grammar',
        contextMenuGroupId: 'ai',
        contextMenuOrder: 2,
        prompt: PRESET_PROMPTS.checkGrammar
      },
      {
        id: 'ai.makeDramatic',
        label: 'AI: Make More Dramatic',
        contextMenuGroupId: 'ai',
        contextMenuOrder: 3,
        prompt: PRESET_PROMPTS.makeDramatic
      },
      {
        id: 'ai.summarize',
        label: 'AI: Summarize',
        contextMenuGroupId: 'ai',
        contextMenuOrder: 4,
        prompt: PRESET_PROMPTS.summarize
      },
      {
        id: 'ai.suggestImprovements',
        label: 'AI: Suggest Improvements',
        contextMenuGroupId: 'ai',
        contextMenuOrder: 5,
        prompt: PRESET_PROMPTS.suggestImprovements
      }
    ]

    aiActions.forEach(({ id, label, contextMenuGroupId, contextMenuOrder, prompt }) => {
      editor.addAction({
        id,
        label,
        contextMenuGroupId,
        contextMenuOrder,
        keybindings: [],
        run: async (ed) => {
          const selection = ed.getSelection()
          if (!selection) return

          const selectedText = ed.getModel()?.getValueInRange(selection)
          if (!selectedText) return

          // Build context with selected text
          const context = buildContext({
            selection: {
              text: selectedText,
              start: ed.getModel()?.getOffsetAt(selection.getStartPosition()) || 0,
              end: ed.getModel()?.getOffsetAt(selection.getEndPosition()) || 0
            },
            includeEntities: true
          })

          // Send to AI
          try {
            await sendMessage(prompt, context)
            logger.debug(`AI action executed: ${label}`, 'MonacoEditor')
          } catch (error) {
            logger.error('AI action failed:', 'MonacoEditor', error)
          }
        }
      })
    })
  }

  // Handle content change with debouncing for auto-save
  const handleEditorChange = (newValue: string | undefined): void => {
    if (!onChange || newValue === undefined) return

    const autoSave = editorSettings.autoSave
    const autoSaveDelay = editorSettings.autoSaveDelay

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

  // Apply settings changes live without remounting
  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.updateOptions({ ...defaultOptions, ...options })
  }, [editorSettings, readOnly, options])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'w-full h-full border border-[hsl(var(--border))] rounded-lg overflow-hidden',
        className
      )}
    >
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

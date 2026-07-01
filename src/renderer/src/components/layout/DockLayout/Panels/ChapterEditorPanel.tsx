import React, { useState, useEffect, useRef } from 'react'
import { MonacoEditor } from '@renderer/components/editor/MonacoEditor'
import { useContentStore, useCoreStore, useToolsStore } from '@renderer/store'
import { fs } from '@renderer/lib/ipc'
import { getChapterContentPath } from '@renderer/lib/books'
import { logger } from '@renderer/lib/logger'
import { handleExternalChange } from '@renderer/lib/fileReload'

export interface ChapterEditorPanelProps {
  bookSlug: string
  chapterSlug: string
}

export const ChapterEditorPanel: React.FC<ChapterEditorPanelProps> = ({
  bookSlug,
  chapterSlug
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const workspacePath = useCoreStore((state) => state.workspacePath)
  const book = useContentStore((state) => state.books[bookSlug])
  const chapter = book?.chapters.find((c) => c.slug === chapterSlug)
  const updateChapter = useContentStore((state) => state.updateChapter)
  const reloadOnExternalChange = useToolsStore(
    (state) => state.workspacePreferences.reloadOnExternalChange
  )
  const watchExternalChanges = useToolsStore(
    (state) => state.workspacePreferences.watchExternalChanges
  )
  const reloadBehaviorRef = useRef(reloadOnExternalChange)
  useEffect(() => {
    reloadBehaviorRef.current = reloadOnExternalChange
  }, [reloadOnExternalChange])

  // Load chapter content from disk (only on mount or when chapter changes)
  useEffect(() => {
    const loadContent = async (): Promise<void> => {
      if (!workspacePath) {
        logger.error('No workspace path', 'ChapterEditorPanel')
        setError('No workspace selected')
        setIsLoading(false)
        return
      }

      if (!chapter) {
        logger.error('Chapter not found', 'ChapterEditorPanel')
        setError('Chapter not found')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const contentPath = getChapterContentPath(workspacePath, bookSlug, chapterSlug)
        logger.debug(`Loading content from: ${contentPath}`, 'ChapterEditorPanel')
        const loadedContent = await fs.readFile(contentPath, 'utf-8')
        logger.debug(`Content loaded, length: ${loadedContent.length}`, 'ChapterEditorPanel')

        // Update store with loaded content (if different)
        if (chapter.content !== loadedContent) {
          updateChapter(bookSlug, chapterSlug, { content: loadedContent })
        }
      } catch (err) {
        logger.error('Failed to load chapter content:', 'ChapterEditorPanel', err)
        setError(`Failed to load chapter: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [workspacePath, bookSlug, chapterSlug]) // Removed 'chapter' dependency

  // Watch content.md for external changes while this tab is open
  useEffect(() => {
    if (!workspacePath || !chapter || !watchExternalChanges) return

    const contentPath = getChapterContentPath(workspacePath, bookSlug, chapterSlug)
    // Track last write timestamp to distinguish internal vs external changes
    const lastWriteRef = { ts: 0 }

    let unwatch: (() => void) | null = null

    fs.watch(contentPath, (event) => {
      if (event !== 'change') return
      if (Date.now() - lastWriteRef.ts < 2000) return // internal write

      const reload = async (): Promise<void> => {
        const newContent = await fs.readFile(contentPath, 'utf-8')
        updateChapter(bookSlug, chapterSlug, { content: newContent })
      }

      handleExternalChange(reloadBehaviorRef.current, 'Chapter content', reload)
    }).then((u) => {
      unwatch = u
    }).catch((e) => {
      logger.warn('Could not watch chapter content', 'ChapterEditorPanel', e)
    })

    return () => {
      unwatch?.()
    }
  }, [workspacePath, bookSlug, chapterSlug, watchExternalChanges])

  // Handle content change - Store handles auto-save automatically
  const handleContentChange = (newContent: string | undefined): void => {
    if (newContent === undefined) return

    // Update chapter content in store
    // Store will automatically:
    // 1. Set hasUnsavedChanges = true
    // 2. Trigger debounced auto-save (if enabled in config)
    // 3. Set hasUnsavedChanges = false after successful save
    updateChapter(bookSlug, chapterSlug, { content: newContent })
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-on-surface-variant">Loading chapter...</p>
        <p className="text-xs text-outline">Book: {bookSlug} / Chapter: {chapterSlug}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-error">Error: {error}</p>
        <p className="text-xs text-outline">Book: {bookSlug} / Chapter: {chapterSlug}</p>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-on-surface-variant">Chapter not found</p>
        <p className="text-xs text-outline">Book: {bookSlug} / Chapter: {chapterSlug}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <MonacoEditor
        value={chapter?.content || ''}
        onChange={handleContentChange}
        language="markdown"
      />
    </div>
  )
}

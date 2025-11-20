import React, { useState, useEffect } from 'react'
import { MonacoEditor } from '@renderer/components/editor/MonacoEditor'
import { useContentStore, useCoreStore } from '@renderer/store'
import { fs } from '@renderer/lib/ipc'
import { getChapterContentPath } from '@renderer/lib/books'

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

  // Load chapter content from disk (only on mount or when chapter changes)
  useEffect(() => {
    const loadContent = async (): Promise<void> => {
      if (!workspacePath) {
        console.error('[ChapterEditorPanel] No workspace path')
        setError('No workspace selected')
        setIsLoading(false)
        return
      }

      if (!chapter) {
        console.error('[ChapterEditorPanel] Chapter not found')
        setError('Chapter not found')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const contentPath = getChapterContentPath(workspacePath, bookSlug, chapterSlug)
        console.log('[ChapterEditorPanel] Loading content from:', contentPath)
        const loadedContent = await fs.readFile(contentPath, 'utf-8')
        console.log('[ChapterEditorPanel] Content loaded, length:', loadedContent.length)

        // Update store with loaded content (if different)
        if (chapter.content !== loadedContent) {
          updateChapter(bookSlug, chapterSlug, { content: loadedContent })
        }
      } catch (err) {
        console.error('[ChapterEditorPanel] Failed to load chapter content:', err)
        setError(`Failed to load chapter: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [workspacePath, bookSlug, chapterSlug]) // Removed 'chapter' dependency

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
        <p className="text-slate-400">Loading chapter...</p>
        <p className="text-xs text-slate-500">
          Book: {bookSlug} / Chapter: {chapterSlug}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-red-400">Error: {error}</p>
        <p className="text-xs text-slate-500">
          Book: {bookSlug} / Chapter: {chapterSlug}
        </p>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-slate-400">Chapter not found</p>
        <p className="text-xs text-slate-500">
          Book: {bookSlug} / Chapter: {chapterSlug}
        </p>
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

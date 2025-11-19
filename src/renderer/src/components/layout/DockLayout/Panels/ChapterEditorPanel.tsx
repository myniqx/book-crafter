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
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const workspacePath = useCoreStore((state) => state.workspacePath)
  const book = useContentStore((state) => state.books[bookSlug])
  const chapter = book?.chapters.find((c) => c.slug === chapterSlug)
  const updateChapter = useContentStore((state) => state.updateChapter)
  const setHasUnsavedChanges = useCoreStore((state) => state.setHasUnsavedChanges)

  // Load chapter content from disk
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
        setContent(loadedContent)
      } catch (err) {
        console.error('[ChapterEditorPanel] Failed to load chapter content:', err)
        setError(`Failed to load chapter: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setContent('') // Initialize with empty content if file doesn't exist
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [workspacePath, bookSlug, chapterSlug, chapter])

  // Save content with debounce
  const handleContentChange = (newContent: string | undefined): void => {
    if (newContent === undefined) return

    setContent(newContent)
    setHasUnsavedChanges(true)

    // Update chapter content in store
    if (chapter) {
      updateChapter(bookSlug, chapterSlug, { content: newContent })
    }

    // TODO: Implement debounced auto-save
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
      <MonacoEditor value={content} onChange={handleContentChange} language="markdown" />
    </div>
  )
}

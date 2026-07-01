import { useCallback } from 'react'
import { useStore, type TabEditorData, type TabMetadata } from '@renderer/store'
import { toast } from '@renderer/lib/toast'
import { logger } from '@renderer/lib/logger'

const getEditorData = (tab: TabMetadata | undefined): TabEditorData | undefined =>
  tab?.type === 'editor' ? (tab.data as TabEditorData | undefined) : undefined

/**
 * Returns a callback that saves the chapter in the currently active editor tab to disk.
 */
export function useSaveActiveChapter(): () => Promise<void> {
  return useCallback(async () => {
    const { workspacePath, openTabs, activeTabId, books, saveChapterToDisk, setHasUnsavedChanges } =
      useStore.getState()

    const data = getEditorData(openTabs.find((t) => t.id === activeTabId))
    if (!workspacePath || !data) {
      toast.info('No file to save', 'Open a file first')
      return
    }

    try {
      await saveChapterToDisk(workspacePath, data.bookSlug, data.chapterSlug)
      setHasUnsavedChanges(false)
      const chapter = books[data.bookSlug]?.chapters.find((c) => c.slug === data.chapterSlug)
      toast.success('File saved', `${chapter?.title ?? data.chapterSlug} has been saved`)
    } catch (error) {
      logger.error('Failed to save chapter:', 'useSaveChapter', error)
      toast.error('Save failed', error instanceof Error ? error.message : String(error))
    }
  }, [])
}

/**
 * Returns a callback that saves all chapters in open editor tabs to disk.
 */
export function useSaveAllChapters(): () => Promise<void> {
  return useCallback(async () => {
    const { workspacePath, openTabs, saveChapterToDisk, setHasUnsavedChanges } =
      useStore.getState()

    const editorTabs = openTabs
      .map((tab) => getEditorData(tab))
      .filter((data): data is TabEditorData => data !== undefined)

    if (!workspacePath || editorTabs.length === 0) {
      toast.info('No files to save', 'No files are currently open')
      return
    }

    const results = await Promise.allSettled(
      editorTabs.map((data) => saveChapterToDisk(workspacePath, data.bookSlug, data.chapterSlug))
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length === 0) {
      setHasUnsavedChanges(false)
      toast.success('All files saved', `${editorTabs.length} file(s) saved`)
    } else {
      logger.error('Failed to save some chapters:', 'useSaveChapter', failed)
      toast.error('Save failed', `${failed.length} of ${editorTabs.length} file(s) failed to save`)
    }
  }, [])
}

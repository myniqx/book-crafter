import React, { useMemo } from 'react'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useStore, type TabEditorData } from '@renderer/store'
import { formatRelativeTime } from '@renderer/lib/dateFormat'

export const StatusBar: React.FC = () => {
  const workspaceConfig = useStore((state) => state.workspaceConfig)
  const openTabs = useStore((state) => state.openTabs)
  const activeTabId = useStore((state) => state.activeTabId)
  const books = useStore((state) => state.books)

  // Find active tab and chapter (memoized to prevent unnecessary recalculations)
  const activeTabData = useMemo(() => {
    const tab = openTabs.find((t) => t.id === activeTabId)
    if (tab?.type === 'editor' && tab.data) {
      const { bookSlug, chapterSlug } = tab.data as TabEditorData
      const book = books[bookSlug]
      if (book) {
        const chapter = book.chapters.find((c) => c.slug === chapterSlug)
        return { book, chapter, tab }
      }
    }
    return null
  }, [openTabs, activeTabId, books])

  // Calculate word count from chapter content
  const wordCount = useMemo(() => {
    if (activeTabData?.chapter?.content) {
      return activeTabData.chapter.content.split(/\s+/).filter((w) => w.length > 0).length
    }
    return 0
  }, [activeTabData?.chapter?.content])

  const isSaving = false
  const lastSaved = workspaceConfig?.modified ? new Date(workspaceConfig.modified) : null


  return (
    <div className="h-6 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between px-3 text-xs text-on-surface-variant">
      {/* Left: Save status */}
      <div className="flex items-center gap-2">
        {isSaving ? (
          <div className="flex items-center gap-1.5">
            <Save className="h-3 w-3 animate-pulse" />
            <span>Saving...</span>
          </div>
        ) : lastSaved ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-tertiary" />
            <span>Saved {formatRelativeTime(lastSaved)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-error" />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Right: Document stats */}
      <div className="flex items-center gap-4">
        {activeTabData && (
          <>
            <span>{wordCount} words</span>
            <span className="text-outline-variant">|</span>
            <span>{activeTabData.chapter?.title || 'Untitled'}</span>
          </>
        )}
        {workspaceConfig && (
          <>
            <span className="text-outline-variant">|</span>
            <span>{workspaceConfig.projectName}</span>
          </>
        )}
      </div>
    </div>
  )
}

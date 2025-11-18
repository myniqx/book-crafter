import React, { useMemo } from 'react'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useContentStore, useCoreStore } from '@renderer/store'

export const StatusBar: React.FC = () => {
  const workspaceConfig = useCoreStore((state) => state.workspaceConfig)
  const openEditorTabs = useContentStore((state) => state.openEditorTabs)
  const activeTabIndex = useContentStore((state) => state.activeTabIndex)
  const books = useContentStore((state) => state.books)

  // Find active tab and chapter (memoized to prevent unnecessary recalculations)
  const activeTabData = useMemo(() => {
    if (activeTabIndex >= 0 && openEditorTabs[activeTabIndex]) {
      const tab = openEditorTabs[activeTabIndex]
      const book = books[tab.bookSlug]
      if (book) {
        const chapter = book.chapters.find((c) => c.slug === tab.chapterSlug)
        return { book, chapter, tab }
      }
    }
    return null
  }, [openEditorTabs, activeTabIndex, books])

  // Calculate word count from chapter content
  const wordCount = useMemo(() => {
    if (activeTabData?.chapter?.content) {
      return activeTabData.chapter.content.split(/\s+/).filter((w) => w.length > 0).length
    }
    return 0
  }, [activeTabData?.chapter?.content])

  const isSaving = false
  const lastSaved = workspaceConfig?.modified ? new Date(workspaceConfig.modified) : null

  const formatTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={cn(
        'h-6 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]',
        'flex items-center justify-between px-3',
        'text-xs text-[hsl(var(--muted-foreground))]'
      )}
    >
      {/* Left: Save status */}
      <div className="flex items-center gap-2">
        {isSaving ? (
          <div className="flex items-center gap-1.5">
            <Save className="h-3 w-3 animate-pulse" />
            <span>Saving...</span>
          </div>
        ) : lastSaved ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Saved {formatTime(lastSaved)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Right: Document stats */}
      <div className="flex items-center gap-4">
        {activeTabData && (
          <>
            <span>{wordCount} words</span>
            <span className="text-[hsl(var(--border))]">|</span>
            <span>{activeTabData.chapter?.title || 'Untitled'}</span>
          </>
        )}
        {workspaceConfig && (
          <>
            <span className="text-[hsl(var(--border))]">|</span>
            <span>{workspaceConfig.projectName}</span>
          </>
        )}
      </div>
    </div>
  )
}

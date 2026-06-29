import React, { useState } from 'react'
import { BookOpen, FileText, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useContentStore, useCoreStore } from '@renderer/store'
import { CreateBookDialog } from '../CreateBookDialog'
import { CreateChapterDialog } from '../CreateChapterDialog'
import type { BookExplorerProps } from './types'
import type { TabMetadata, TabEditorData } from '@renderer/components/layout/DockLayout/types'

export const BookExplorer: React.FC<BookExplorerProps> = ({ className }) => {
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set())

  const books = useContentStore((state) => state.books)
  const deleteBookFromDisk = useContentStore((state) => state.deleteBookFromDisk)
  const deleteChapterFromDisk = useContentStore((state) => state.deleteChapterFromDisk)
  const workspacePath = useCoreStore((state) => state.workspacePath)

  // Use new tab system from UISlice
  const openTab = useCoreStore((state) => state.openTab)
  const activeTabId = useCoreStore((state) => state.activeTabId)
  const openTabs = useCoreStore((state) => state.openTabs)

  const booksList = Object.values(books).sort((a, b) =>
    new Date(b.modified).getTime() - new Date(a.modified).getTime()
  )

  const toggleBook = (bookSlug: string): void => {
    setExpandedBooks((prev) => {
      const next = new Set(prev)
      if (next.has(bookSlug)) {
        next.delete(bookSlug)
      } else {
        next.add(bookSlug)
      }
      return next
    })
  }

  /**
   * Handle chapter click - Open chapter in editor
   * Creates TabMetadata and calls store.openTab()
   * Store → DockLayout sync happens automatically via useEffect
   */
  const handleChapterClick = (bookSlug: string, chapterSlug: string): void => {
    const book = books[bookSlug]
    const chapter = book?.chapters.find((c) => c.slug === chapterSlug)

    if (!book || !chapter) {
      console.error('[BookExplorer] Book or chapter not found:', bookSlug, chapterSlug)
      return
    }

    // Create tab metadata
    const tabMetadata: TabMetadata = {
      id: `editor-${bookSlug}-${chapterSlug}`,
      type: 'editor',
      title: chapter.title,
      closable: true,
      data: {
        bookSlug,
        chapterSlug
      } as TabEditorData
    }

    // Open tab (this will trigger Store → DockLayout sync)
    openTab(tabMetadata)
  }

  const handleDeleteBook = async (bookSlug: string, bookTitle: string): Promise<void> => {
    if (!workspacePath) return

    const confirmed = confirm(
      `Are you sure you want to delete "${bookTitle}"?\n\nThis will delete the book and all its chapters. This cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteBookFromDisk(workspacePath, bookSlug)
    } catch (error) {
      console.error('Failed to delete book:', error)
      alert('Failed to delete book. Please try again.')
    }
  }

  const handleDeleteChapter = async (
    bookSlug: string,
    chapterSlug: string,
    chapterTitle: string
  ): Promise<void> => {
    if (!workspacePath) return

    const confirmed = confirm(`Are you sure you want to delete "${chapterTitle}"?\n\nThis cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteChapterFromDisk(workspacePath, bookSlug, chapterSlug)
    } catch (error) {
      console.error('Failed to delete chapter:', error)
      alert('Failed to delete chapter. Please try again.')
    }
  }

  const totalBooks = booksList.length

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-outline-variant">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Books ({totalBooks})</h3>
          <CreateBookDialog />
        </div>
      </div>

      {/* Book List */}
      <div className="flex-1 overflow-y-auto">
        {booksList.map((book) => {
          const isExpanded = expandedBooks.has(book.slug)
          const hasOpenChapter = openTabs.some(
            (tab) => tab.type === 'editor' && (tab.data as TabEditorData)?.bookSlug === book.slug
          )

          return (
            <div key={book.slug} className="border-b border-outline-variant">
              {/* Book Header */}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2',
                  'hover:bg-surface-container-high transition-colors duration-150',
                  'group',
                  hasOpenChapter && 'bg-surface-container'
                )}
              >
                <button
                  onClick={() => toggleBook(book.slug)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-on-surface-variant" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-on-surface-variant" />
                  )}
                  <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-on-surface">{book.title}</div>
                    <div className="text-xs text-on-surface-variant">
                      {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.slug, book.title) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error-container/20 rounded"
                  title="Delete book"
                >
                  <Trash2 className="h-3 w-3 text-error" />
                </button>
              </div>

              {/* Chapters */}
              {isExpanded && (
                <div className="bg-surface-container-lowest">
                  <div className="px-3 py-1.5 border-b border-outline-variant">
                    <CreateChapterDialog bookSlug={book.slug} />
                  </div>

                  {[...book.chapters]
                    .sort((a, b) => a.order - b.order)
                    .map((chapter) => {
                      const chapterTabId = `editor-${book.slug}-${chapter.slug}`
                      const isActiveChapter = activeTabId === chapterTabId

                      return (
                        <div
                          key={chapter.slug}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 pl-9',
                            'hover:bg-surface-container transition-colors duration-150 cursor-pointer',
                            'group',
                            isActiveChapter && 'bg-surface-container text-primary font-medium border-l-2 border-primary'
                          )}
                        >
                          <button
                            onClick={() => handleChapterClick(book.slug, chapter.slug)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-on-surface-variant" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{chapter.title}</div>
                              <div className="text-xs text-on-surface-variant">
                                {chapter.wordCount} words
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteChapter(book.slug, chapter.slug, chapter.title) }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error-container/20 rounded"
                            title="Delete chapter"
                          >
                            <Trash2 className="h-3 w-3 text-error" />
                          </button>
                        </div>
                      )
                    })}

                  {book.chapters.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-on-surface-variant">
                      No chapters yet. Create one to get started.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Empty State */}
        {totalBooks === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <BookOpen className="h-10 w-10 text-on-surface-variant opacity-30 mb-3" />
            <h4 className="text-sm font-medium text-on-surface mb-1">No books yet</h4>
            <p className="text-xs text-on-surface-variant mb-4">Create your first book to start writing</p>
            <CreateBookDialog triggerProps={{ size: 'sm' }} />
          </div>
        )}
      </div>
    </div>
  )
}

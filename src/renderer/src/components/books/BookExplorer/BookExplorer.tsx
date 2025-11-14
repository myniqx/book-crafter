import React, { useState } from 'react'
import { BookOpen, FileText, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useStore } from '@renderer/store'
import { CreateBookDialog } from '../CreateBookDialog'
import { CreateChapterDialog } from '../CreateChapterDialog'
import type { BookExplorerProps } from './types'

export const BookExplorer: React.FC<BookExplorerProps> = ({ className }) => {
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set())

  const books = useStore((state) => state.books)
  const activeBookSlug = useStore((state) => state.activeBookSlug)
  const activeChapterSlug = useStore((state) => state.activeChapterSlug)
  const openTab = useStore((state) => state.openTab)
  const deleteBookFromDisk = useStore((state) => state.deleteBookFromDisk)
  const deleteChapterFromDisk = useStore((state) => state.deleteChapterFromDisk)
  const workspacePath = useStore((state) => state.workspacePath)

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

  const handleChapterClick = (bookSlug: string, chapterSlug: string): void => {
    openTab(bookSlug, chapterSlug)
  }

  const handleDeleteBook = async (bookSlug: string, bookTitle: string): void => {
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
  ): void => {
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
    <div className={cn('h-full flex flex-col bg-[hsl(var(--background))]', className)}>
      {/* Header */}
      <div className="p-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Books ({totalBooks})</h3>
          <CreateBookDialog />
        </div>
      </div>

      {/* Book List */}
      <div className="flex-1 overflow-y-auto">
        {booksList.map((book) => {
          const isExpanded = expandedBooks.has(book.slug)
          const isActive = activeBookSlug === book.slug

          return (
            <div key={book.slug} className="border-b border-[hsl(var(--border))]">
              {/* Book Header */}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2',
                  'hover:bg-[hsl(var(--accent))] transition-colors',
                  'group',
                  isActive && 'bg-[hsl(var(--accent))]'
                )}
              >
                <button
                  onClick={() => toggleBook(book.slug)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <BookOpen className="h-4 w-4 flex-shrink-0 text-[hsl(var(--primary))]" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{book.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteBook(book.slug, book.title)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                  title="Delete book"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>

              {/* Chapters */}
              {isExpanded && (
                <div className="bg-muted/30">
                  {/* Add Chapter Button */}
                  <div className="px-3 py-2 border-b border-[hsl(var(--border))]">
                    <CreateChapterDialog bookSlug={book.slug} />
                  </div>

                  {/* Chapter List */}
                  {book.chapters
                    .sort((a, b) => a.order - b.order)
                    .map((chapter) => {
                      const isActiveChapter =
                        activeBookSlug === book.slug && activeChapterSlug === chapter.slug

                      return (
                        <div
                          key={chapter.slug}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 pl-10',
                            'hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer',
                            'group',
                            isActiveChapter &&
                              'bg-[hsl(var(--accent))] text-[hsl(var(--primary))] font-medium'
                          )}
                        >
                          <button
                            onClick={() => handleChapterClick(book.slug, chapter.slug)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{chapter.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {chapter.wordCount} words
                              </div>
                            </div>
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteChapter(book.slug, chapter.slug, chapter.title)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            title="Delete chapter"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      )
                    })}

                  {/* Empty state */}
                  {book.chapters.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
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
            <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <h4 className="text-sm font-medium mb-1">No books yet</h4>
            <p className="text-xs text-muted-foreground mb-4">Create your first book to start writing</p>
            <CreateBookDialog triggerProps={{ size: 'sm' }} />
          </div>
        )}
      </div>
    </div>
  )
}

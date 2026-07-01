import { StateCreator } from 'zustand'
import { toast } from 'sonner'
import type { AppStore } from '..'
import { logger } from '@renderer/lib/logger'
import { loadAllBooks, saveBook, saveChapter, deleteBook as deleteBookFile, deleteChapter as deleteChapterFile } from '@renderer/lib/books'

export interface Chapter {
  slug: string
  title: string
  order: number
  content: string
  wordCount: number
  characterCount: number
  created: string
  modified: string
  status: 'draft' | 'in-progress' | 'review' | 'completed'
}

export interface Book {
  slug: string
  title: string
  author: string
  created: string
  modified: string
  chapters: Chapter[]
  coverImage?: string
  metadata: {
    totalWordCount: number
    totalChapters: number
  }
}

export interface BooksSlice {
  books: Record<string, Book>
  isLoadingBooks: boolean

  // CRUD operations
  addBook: (book: Book) => void
  updateBook: (slug: string, updates: Partial<Book>) => void
  deleteBook: (slug: string) => void
  getBook: (slug: string) => Book | undefined

  // Chapter operations
  addChapter: (bookSlug: string, chapter: Chapter) => void
  updateChapter: (bookSlug: string, chapterSlug: string, updates: Partial<Chapter>) => void
  updateChapterContent: (bookSlug: string, chapterSlug: string, content: string) => void
  deleteChapter: (bookSlug: string, chapterSlug: string) => void
  reorderChapters: (bookSlug: string, newOrder: string[]) => void

  // File operations
  loadAllBooks: (workspacePath: string) => Promise<void>
  saveBookToDisk: (workspacePath: string, bookSlug: string) => Promise<void>
  saveChapterToDisk: (workspacePath: string, bookSlug: string, chapterSlug: string) => Promise<void>
  deleteBookFromDisk: (workspacePath: string, bookSlug: string) => Promise<void>
  deleteChapterFromDisk: (
    workspacePath: string,
    bookSlug: string,
    chapterSlug: string
  ) => Promise<void>

  // Internal: Cleanup timers
  _cleanupTimers: () => void

  // NOTE: Tab management lives in UISlice (openTabs, activeTabId)
}

// Auto-save debounce timers (per-chapter). Kept outside the store because
// timer handles are not serializable state.
const saveTimers = new Map<string, NodeJS.Timeout>()

/**
 * Helper: Generate unique key for save timer
 */
const getSaveTimerKey = (bookSlug: string, chapterSlug: string): string => {
  return `${bookSlug}::${chapterSlug}`
}

export const createBooksSlice: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  BooksSlice
> = (set, get) => ({
  books: {},
  isLoadingBooks: false,

  addBook: (book) =>
    set((state) => {
      state.books[book.slug] = book
    }),

  updateBook: (slug, updates) =>
    set((state) => {
      if (state.books[slug]) {
        Object.assign(state.books[slug], updates)
        state.books[slug].modified = new Date().toISOString()
      }
    }),

  deleteBook: (slug) =>
    set((state) => {
      delete state.books[slug]
    }),

  getBook: (slug) => get().books[slug],

  addChapter: (bookSlug, chapter) =>
    set((state) => {
      if (state.books[bookSlug]) {
        state.books[bookSlug].chapters.push(chapter)
        state.books[bookSlug].metadata.totalChapters = state.books[bookSlug].chapters.length
        state.books[bookSlug].modified = new Date().toISOString()
      }
    }),

  updateChapter: (bookSlug, chapterSlug, updates) => {
    // Update store
    set((state) => {
      if (state.books[bookSlug]) {
        const chapterIndex = state.books[bookSlug].chapters.findIndex((c) => c.slug === chapterSlug)
        if (chapterIndex !== -1) {
          Object.assign(state.books[bookSlug].chapters[chapterIndex], updates)
          state.books[bookSlug].chapters[chapterIndex].modified = new Date().toISOString()
          state.books[bookSlug].modified = new Date().toISOString()
        }
      }
    })

    // Set unsaved changes flag
    get().setHasUnsavedChanges(true)

    // Check auto-save config
    const workspacePath = get().workspacePath
    const { autoSave, autoSaveDelay } = get().extendedEditorSettings

    if (!autoSave || !workspacePath) {
      return // Auto-save disabled or no workspace
    }

    // Clear previous timer for this chapter
    const timerKey = getSaveTimerKey(bookSlug, chapterSlug)
    const existingTimer = saveTimers.get(timerKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new debounced save timer
    const newTimer = setTimeout(async () => {
      saveTimers.delete(timerKey)
      try {
        await get().saveChapterToDisk(workspacePath, bookSlug, chapterSlug)

        // Save successful → clear unsaved changes flag
        get().setHasUnsavedChanges(false)

        logger.info(`Successfully saved ${bookSlug}/${chapterSlug}`, 'Auto-save')
      } catch (error) {
        logger.error('Failed to save chapter:', 'Auto-save', error)

        // Show error toast; changes remain marked as unsaved
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`Failed to save ${chapterSlug}`, {
          description: errorMessage
        })
      }
    }, autoSaveDelay)

    saveTimers.set(timerKey, newTimer)
  },

  updateChapterContent: (bookSlug, chapterSlug, content) =>
    set((state) => {
      if (state.books[bookSlug]) {
        const chapterIndex = state.books[bookSlug].chapters.findIndex((c) => c.slug === chapterSlug)
        if (chapterIndex !== -1) {
          state.books[bookSlug].chapters[chapterIndex].content = content
          state.books[bookSlug].chapters[chapterIndex].wordCount = content
            .split(/\s+/)
            .filter((w) => w.length > 0).length
          state.books[bookSlug].chapters[chapterIndex].characterCount = content.length
          state.books[bookSlug].chapters[chapterIndex].modified = new Date().toISOString()
          state.books[bookSlug].modified = new Date().toISOString()
        }
      }
    }),

  deleteChapter: (bookSlug, chapterSlug) =>
    set((state) => {
      if (state.books[bookSlug]) {
        state.books[bookSlug].chapters = state.books[bookSlug].chapters.filter(
          (c) => c.slug !== chapterSlug
        )
        state.books[bookSlug].metadata.totalChapters = state.books[bookSlug].chapters.length
        state.books[bookSlug].modified = new Date().toISOString()
      }
    }),

  reorderChapters: (bookSlug, newOrder) =>
    set((state) => {
      if (state.books[bookSlug]) {
        const chaptersMap = new Map(state.books[bookSlug].chapters.map((c) => [c.slug, c]))
        state.books[bookSlug].chapters = newOrder
          .map((slug) => chaptersMap.get(slug))
          .filter(Boolean) as Chapter[]

        // Update order property
        state.books[bookSlug].chapters.forEach((chapter, index) => {
          chapter.order = index
        })
      }
    }),

  // File operations
  loadAllBooks: async (workspacePath) => {
    set((state) => {
      state.isLoadingBooks = true
    })

    try {
      const books = await loadAllBooks(workspacePath)

      set((state) => {
        state.books = books
        state.isLoadingBooks = false
      })
    } catch (error) {
      logger.error('Failed to load books:', 'booksSlice', error)
      set((state) => {
        state.isLoadingBooks = false
      })
      throw error
    }
  },

  saveBookToDisk: async (workspacePath, bookSlug) => {
    const book = get().books[bookSlug]
    if (!book) {
      throw new Error(`Book ${bookSlug} not found`)
    }

    await saveBook(workspacePath, book)
  },

  saveChapterToDisk: async (workspacePath, bookSlug, chapterSlug) => {
    const book = get().books[bookSlug]
    if (!book) {
      throw new Error(`Book ${bookSlug} not found`)
    }

    const chapter = book.chapters.find((c) => c.slug === chapterSlug)
    if (!chapter) {
      throw new Error(`Chapter ${chapterSlug} not found in book ${bookSlug}`)
    }

    await saveChapter(workspacePath, bookSlug, chapter)
  },

  deleteBookFromDisk: async (workspacePath, bookSlug) => {
    await deleteBookFile(workspacePath, bookSlug)

    // Remove from store
    set((state) => {
      delete state.books[bookSlug]
    })

    // NOTE: Tab closing is handled automatically by DockLayout
    // When book data is removed, ChapterEditorPanel will show "Chapter not found"
  },

  deleteChapterFromDisk: async (workspacePath, bookSlug, chapterSlug) => {
    await deleteChapterFile(workspacePath, bookSlug, chapterSlug)

    // Remove from store
    set((state) => {
      if (state.books[bookSlug]) {
        state.books[bookSlug].chapters = state.books[bookSlug].chapters.filter(
          (c) => c.slug !== chapterSlug
        )
        state.books[bookSlug].metadata.totalChapters = state.books[bookSlug].chapters.length
        state.books[bookSlug].modified = new Date().toISOString()
      }
    })

    // NOTE: Tab closing is handled automatically by DockLayout
    // When chapter data is removed, ChapterEditorPanel will show "Chapter not found"
  },

  /**
   * Cleanup all pending save timers
   * Should be called on app unmount or workspace change
   */
  _cleanupTimers: () => {
    saveTimers.forEach((timer) => clearTimeout(timer))
    saveTimers.clear()
    logger.debug('Cleaned up all pending timers', 'Auto-save')
  }
})

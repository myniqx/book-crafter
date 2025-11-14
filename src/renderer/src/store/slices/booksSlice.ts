import { StateCreator } from 'zustand'
import { AppStore } from '..'

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
  activeBookSlug: string | null
  activeChapterSlug: string | null
  openEditorTabs: Array<{ bookSlug: string; chapterSlug: string }>
  activeTabIndex: number
  isLoadingBooks: boolean

  // CRUD operations
  addBook: (book: Book) => void
  updateBook: (slug: string, updates: Partial<Book>) => void
  deleteBook: (slug: string) => void
  getBook: (slug: string) => Book | undefined
  setActiveBook: (slug: string | null) => void

  // Chapter operations
  addChapter: (bookSlug: string, chapter: Chapter) => void
  updateChapter: (bookSlug: string, chapterSlug: string, updates: Partial<Chapter>) => void
  updateChapterContent: (bookSlug: string, chapterSlug: string, content: string) => void
  deleteChapter: (bookSlug: string, chapterSlug: string) => void
  reorderChapters: (bookSlug: string, newOrder: string[]) => void
  setActiveChapter: (chapterSlug: string | null) => void

  // Tab operations
  openTab: (bookSlug: string, chapterSlug: string) => void
  closeTab: (index: number) => void
  setActiveTab: (index: number) => void

  // File operations
  loadAllBooks: (workspacePath: string) => Promise<void>
  saveBookToDisk: (workspacePath: string, bookSlug: string) => Promise<void>
  saveChapterToDisk: (workspacePath: string, bookSlug: string, chapterSlug: string) => Promise<void>
  deleteBookFromDisk: (workspacePath: string, bookSlug: string) => Promise<void>
  deleteChapterFromDisk: (workspacePath: string, bookSlug: string, chapterSlug: string) => Promise<void>
}

export const createBooksSlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  BooksSlice
> = (set, get) => ({
  books: {},
  activeBookSlug: null,
  activeChapterSlug: null,
  openEditorTabs: [],
  activeTabIndex: -1,
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
      if (state.activeBookSlug === slug) {
        state.activeBookSlug = null
        state.activeChapterSlug = null
      }
      // Remove all tabs for this book
      state.openEditorTabs = state.openEditorTabs.filter((tab) => tab.bookSlug !== slug)
    }),

  getBook: (slug) => get().books[slug],

  setActiveBook: (slug) =>
    set((state) => {
      state.activeBookSlug = slug
    }),

  addChapter: (bookSlug, chapter) =>
    set((state) => {
      if (state.books[bookSlug]) {
        state.books[bookSlug].chapters.push(chapter)
        state.books[bookSlug].metadata.totalChapters = state.books[bookSlug].chapters.length
        state.books[bookSlug].modified = new Date().toISOString()
      }
    }),

  updateChapter: (bookSlug, chapterSlug, updates) =>
    set((state) => {
      if (state.books[bookSlug]) {
        const chapterIndex = state.books[bookSlug].chapters.findIndex((c) => c.slug === chapterSlug)
        if (chapterIndex !== -1) {
          Object.assign(state.books[bookSlug].chapters[chapterIndex], updates)
          state.books[bookSlug].chapters[chapterIndex].modified = new Date().toISOString()
          state.books[bookSlug].modified = new Date().toISOString()
        }
      }
    }),

  updateChapterContent: (bookSlug, chapterSlug, content) =>
    set((state) => {
      if (state.books[bookSlug]) {
        const chapterIndex = state.books[bookSlug].chapters.findIndex((c) => c.slug === chapterSlug)
        if (chapterIndex !== -1) {
          state.books[bookSlug].chapters[chapterIndex].content = content
          state.books[bookSlug].chapters[chapterIndex].wordCount = content.split(/\s+/).filter(w => w.length > 0).length
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

        // Remove tab if open
        const tabIndex = state.openEditorTabs.findIndex(
          (tab) => tab.bookSlug === bookSlug && tab.chapterSlug === chapterSlug
        )
        if (tabIndex !== -1) {
          state.openEditorTabs.splice(tabIndex, 1)
          if (state.activeTabIndex >= state.openEditorTabs.length) {
            state.activeTabIndex = state.openEditorTabs.length - 1
          }
        }
      }
    }),

  reorderChapters: (bookSlug, newOrder) =>
    set((state) => {
      if (state.books[bookSlug]) {
        const chaptersMap = new Map(
          state.books[bookSlug].chapters.map((c) => [c.slug, c])
        )
        state.books[bookSlug].chapters = newOrder
          .map((slug) => chaptersMap.get(slug))
          .filter(Boolean) as Chapter[]

        // Update order property
        state.books[bookSlug].chapters.forEach((chapter, index) => {
          chapter.order = index
        })
      }
    }),

  setActiveChapter: (chapterSlug) =>
    set((state) => {
      state.activeChapterSlug = chapterSlug
    }),

  openTab: (bookSlug, chapterSlug) =>
    set((state) => {
      const existingIndex = state.openEditorTabs.findIndex(
        (tab) => tab.bookSlug === bookSlug && tab.chapterSlug === chapterSlug
      )

      if (existingIndex !== -1) {
        state.activeTabIndex = existingIndex
      } else {
        state.openEditorTabs.push({ bookSlug, chapterSlug })
        state.activeTabIndex = state.openEditorTabs.length - 1
      }

      state.activeBookSlug = bookSlug
      state.activeChapterSlug = chapterSlug
    }),

  closeTab: (index) =>
    set((state) => {
      state.openEditorTabs.splice(index, 1)
      if (state.activeTabIndex >= state.openEditorTabs.length) {
        state.activeTabIndex = state.openEditorTabs.length - 1
      }

      // Update active chapter
      if (state.activeTabIndex >= 0 && state.openEditorTabs[state.activeTabIndex]) {
        const activeTab = state.openEditorTabs[state.activeTabIndex]
        state.activeBookSlug = activeTab.bookSlug
        state.activeChapterSlug = activeTab.chapterSlug
      } else {
        state.activeBookSlug = null
        state.activeChapterSlug = null
      }
    }),

  setActiveTab: (index) =>
    set((state) => {
      state.activeTabIndex = index
      if (index >= 0 && state.openEditorTabs[index]) {
        const activeTab = state.openEditorTabs[index]
        state.activeBookSlug = activeTab.bookSlug
        state.activeChapterSlug = activeTab.chapterSlug
      }
    }),

  // File operations
  loadAllBooks: async (workspacePath) => {
    set((state) => {
      state.isLoadingBooks = true
    })

    try {
      const { loadAllBooks } = await import('@renderer/lib/books')
      const books = await loadAllBooks(workspacePath)

      set((state) => {
        state.books = books
        state.isLoadingBooks = false
      })
    } catch (error) {
      console.error('Failed to load books:', error)
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

    const { saveBook } = await import('@renderer/lib/books')
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

    const { saveChapter } = await import('@renderer/lib/books')
    await saveChapter(workspacePath, bookSlug, chapter)
  },

  deleteBookFromDisk: async (workspacePath, bookSlug) => {
    const { deleteBook: deleteBookFile } = await import('@renderer/lib/books')
    await deleteBookFile(workspacePath, bookSlug)

    // Remove from store
    set((state) => {
      delete state.books[bookSlug]
      if (state.activeBookSlug === bookSlug) {
        state.activeBookSlug = null
        state.activeChapterSlug = null
      }
      // Remove all tabs for this book
      state.openEditorTabs = state.openEditorTabs.filter((tab) => tab.bookSlug !== bookSlug)
    })
  },

  deleteChapterFromDisk: async (workspacePath, bookSlug, chapterSlug) => {
    const { deleteChapter: deleteChapterFile } = await import('@renderer/lib/books')
    await deleteChapterFile(workspacePath, bookSlug, chapterSlug)

    // Remove from store
    set((state) => {
      if (state.books[bookSlug]) {
        state.books[bookSlug].chapters = state.books[bookSlug].chapters.filter(
          (c) => c.slug !== chapterSlug
        )
        state.books[bookSlug].metadata.totalChapters = state.books[bookSlug].chapters.length
        state.books[bookSlug].modified = new Date().toISOString()

        // Remove tab if open
        const tabIndex = state.openEditorTabs.findIndex(
          (tab) => tab.bookSlug === bookSlug && tab.chapterSlug === chapterSlug
        )
        if (tabIndex !== -1) {
          state.openEditorTabs.splice(tabIndex, 1)
          if (state.activeTabIndex >= state.openEditorTabs.length) {
            state.activeTabIndex = state.openEditorTabs.length - 1
          }
        }
      }
    })
  },
})

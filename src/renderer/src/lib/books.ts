import type { Book, Chapter } from '@renderer/store/slices/booksSlice'
import { slugify } from './slugify'
import ipcClient from './ipc'

/**
 * Book & Chapter File Operations
 * These functions interact with the file system through IPC to save/load books and chapters
 */

const BOOKS_DIR = 'books'

/**
 * Get the path to a book directory
 */
export function getBookPath(workspacePath: string, bookSlug: string): string {
  return `${workspacePath}/${BOOKS_DIR}/${bookSlug}`
}

/**
 * Get the path to a book.json file
 */
export function getBookJsonPath(workspacePath: string, bookSlug: string): string {
  return `${getBookPath(workspacePath, bookSlug)}/book.json`
}

/**
 * Get the path to a chapter directory
 */
export function getChapterPath(workspacePath: string, bookSlug: string, chapterSlug: string): string {
  return `${getBookPath(workspacePath, bookSlug)}/${chapterSlug}`
}

/**
 * Get the path to a chapter.json file
 */
export function getChapterJsonPath(workspacePath: string, bookSlug: string, chapterSlug: string): string {
  return `${getChapterPath(workspacePath, bookSlug, chapterSlug)}/chapter.json`
}

/**
 * Get the path to a chapter's content.md file
 */
export function getChapterContentPath(workspacePath: string, bookSlug: string, chapterSlug: string): string {
  return `${getChapterPath(workspacePath, bookSlug, chapterSlug)}/content.md`
}

/**
 * Generate a unique book slug
 */
export function generateBookSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = slugify(title)

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 1
  let newSlug = `${baseSlug}-${counter}`

  while (existingSlugs.includes(newSlug)) {
    counter++
    newSlug = `${baseSlug}-${counter}`
  }

  return newSlug
}

/**
 * Generate a unique chapter slug within a book
 */
export function generateChapterSlug(title: string, existingChapters: Chapter[]): string {
  const existingSlugs = existingChapters.map((c) => c.slug)
  const baseSlug = slugify(title)

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 1
  let newSlug = `${baseSlug}-${counter}`

  while (existingSlugs.includes(newSlug)) {
    counter++
    newSlug = `${baseSlug}-${counter}`
  }

  return newSlug
}

/**
 * Create a new book
 */
export function createBook(title: string, author: string, existingSlugs: string[]): Book {
  const slug = generateBookSlug(title, existingSlugs)
  const now = new Date().toISOString()

  return {
    slug,
    title,
    author,
    created: now,
    modified: now,
    chapters: [],
    metadata: {
      totalWordCount: 0,
      totalChapters: 0
    }
  }
}

/**
 * Create a new chapter
 */
export function createChapter(title: string, existingChapters: Chapter[]): Chapter {
  const slug = generateChapterSlug(title, existingChapters)
  const now = new Date().toISOString()
  const order = existingChapters.length

  return {
    slug,
    title,
    order,
    content: '',
    wordCount: 0,
    characterCount: 0,
    created: now,
    modified: now,
    status: 'draft'
  }
}

/**
 * Save a book to disk (book.json)
 */
export async function saveBook(workspacePath: string, book: Book): Promise<void> {
  const bookJsonPath = getBookJsonPath(workspacePath, book.slug)
  const bookPath = getBookPath(workspacePath, book.slug)

  // Ensure book directory exists
  await ipcClient.fs.mkdir(bookPath, true)

  // Save book.json
  const bookData = JSON.stringify(book, null, 2)
  await ipcClient.fs.writeFile(bookJsonPath, bookData)
}

/**
 * Load a book from disk
 */
export async function loadBook(workspacePath: string, bookSlug: string): Promise<Book> {
  const bookJsonPath = getBookJsonPath(workspacePath, bookSlug)
  const data = await ipcClient.fs.readFile(bookJsonPath)
  return JSON.parse(data) as Book
}

/**
 * Delete a book from disk
 */
export async function deleteBook(workspacePath: string, bookSlug: string): Promise<void> {
  const bookPath = getBookPath(workspacePath, bookSlug)
  await ipcClient.fs.delete(bookPath)
}

/**
 * Save a chapter to disk (chapter.json + content.md)
 */
export async function saveChapter(
  workspacePath: string,
  bookSlug: string,
  chapter: Chapter
): Promise<void> {
  const chapterPath = getChapterPath(workspacePath, bookSlug, chapter.slug)
  const chapterJsonPath = getChapterJsonPath(workspacePath, bookSlug, chapter.slug)
  const contentPath = getChapterContentPath(workspacePath, bookSlug, chapter.slug)

  // Ensure chapter directory exists
  await ipcClient.fs.mkdir(chapterPath, true)

  // Save chapter.json (without content field to avoid duplication)
  const { content, ...chapterMeta } = chapter
  const chapterData = JSON.stringify(chapterMeta, null, 2)

  // Save content.md
  await ipcClient.fs.writeFile(chapterJsonPath, chapterData)
  await ipcClient.fs.writeFile(contentPath, content)
}

/**
 * Load a chapter from disk
 */
export async function loadChapter(
  workspacePath: string,
  bookSlug: string,
  chapterSlug: string
): Promise<Chapter> {
  const chapterJsonPath = getChapterJsonPath(workspacePath, bookSlug, chapterSlug)
  const contentPath = getChapterContentPath(workspacePath, bookSlug, chapterSlug)

  const metaData = await ipcClient.fs.readFile(chapterJsonPath)
  const content = await ipcClient.fs.readFile(contentPath)

  const chapterMeta = JSON.parse(metaData)
  return {
    ...chapterMeta,
    content
  } as Chapter
}

/**
 * Delete a chapter from disk
 */
export async function deleteChapter(
  workspacePath: string,
  bookSlug: string,
  chapterSlug: string
): Promise<void> {
  const chapterPath = getChapterPath(workspacePath, bookSlug, chapterSlug)
  await ipcClient.fs.delete(chapterPath)
}

/**
 * Load all books from workspace
 */
export async function loadAllBooks(workspacePath: string): Promise<Record<string, Book>> {
  const booksDir = `${workspacePath}/${BOOKS_DIR}`

  // Check if books directory exists
  const dirExists = await ipcClient.fs.exists(booksDir)

  if (!dirExists) {
    // If directory doesn't exist, create it and return empty object
    await ipcClient.fs.mkdir(booksDir, true)
    return {}
  }

  // Read all directories in books folder
  const bookDirs = await ipcClient.fs.readDir(booksDir, false)

  const books: Record<string, Book> = {}

  // Load each book
  for (const dir of bookDirs) {
    try {
      // Skip files, only process directories
      if (dir.includes('.')) continue

      const book = await loadBook(workspacePath, dir)

      // Load all chapters for this book
      const chapters: Chapter[] = []
      for (const chapterRef of book.chapters) {
        try {
          const chapter = await loadChapter(workspacePath, book.slug, chapterRef.slug)
          chapters.push(chapter)
        } catch (error) {
          console.error(`Failed to load chapter ${chapterRef.slug}:`, error)
        }
      }

      // Update book with loaded chapters
      book.chapters = chapters
      books[book.slug] = book
    } catch (error) {
      console.error(`Failed to load book ${dir}:`, error)
    }
  }

  return books
}

/**
 * Update chapter word and character counts
 */
export function updateChapterCounts(chapter: Chapter): Chapter {
  const wordCount = chapter.content
    .split(/\s+/)
    .filter((w) => w.length > 0).length

  const characterCount = chapter.content.length

  return {
    ...chapter,
    wordCount,
    characterCount,
    modified: new Date().toISOString()
  }
}

/**
 * Update book metadata (word count, chapter count)
 */
export function updateBookMetadata(book: Book): Book {
  const totalWordCount = book.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  const totalChapters = book.chapters.length

  return {
    ...book,
    metadata: {
      totalWordCount,
      totalChapters
    },
    modified: new Date().toISOString()
  }
}

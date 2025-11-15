import ipcClient from '@renderer/lib/ipc'
import { slugify } from '@renderer/lib/slugify'
import type { Book, Chapter, ValidationResult, ValidationError } from '@renderer/types'
import { getBookPath, getChapterPath, getChapterContentPath } from './directory'

// ============================================================================
// Book Creation
// ============================================================================

export interface CreateBookOptions {
  title: string
  subtitle?: string
  author: string
  description?: string
  tags?: string[]
}

export function createBook(options: CreateBookOptions): Book {
  const now = new Date().toISOString()
  const slug = slugify(options.title)

  return {
    slug,
    title: options.title,
    subtitle: options.subtitle,
    author: options.author,
    description: options.description,
    chapters: [],
    created: now,
    modified: now,
    tags: options.tags || []
  }
}

// ============================================================================
// Chapter Creation
// ============================================================================

export interface CreateChapterOptions {
  title: string
  content?: string
  tags?: string[]
}

export function createChapter(options: CreateChapterOptions, order: number): Chapter {
  const now = new Date().toISOString()
  const slug = slugify(options.title)

  return {
    slug,
    title: options.title,
    order,
    content: options.content || '',
    wordCount: options.content ? countWords(options.content) : 0,
    created: now,
    modified: now,
    tags: options.tags || []
  }
}

// ============================================================================
// Validation
// ============================================================================

export function validateBook(book: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!book || typeof book !== 'object') {
    errors.push({
      field: 'root',
      message: 'Book must be an object',
      severity: 'error'
    })
    return { valid: false, errors }
  }

  const b = book as Partial<Book>

  if (!b.slug || typeof b.slug !== 'string') {
    errors.push({
      field: 'slug',
      message: 'Book slug is required and must be a string',
      severity: 'error'
    })
  }

  if (!b.title || typeof b.title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Book title is required and must be a string',
      severity: 'error'
    })
  }

  if (!b.author || typeof b.author !== 'string') {
    errors.push({
      field: 'author',
      message: 'Book author is required and must be a string',
      severity: 'error'
    })
  }

  if (!Array.isArray(b.chapters)) {
    errors.push({
      field: 'chapters',
      message: 'Chapters must be an array',
      severity: 'error'
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateChapter(chapter: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!chapter || typeof chapter !== 'object') {
    errors.push({
      field: 'root',
      message: 'Chapter must be an object',
      severity: 'error'
    })
    return { valid: false, errors }
  }

  const c = chapter as Partial<Chapter>

  if (!c.slug || typeof c.slug !== 'string') {
    errors.push({
      field: 'slug',
      message: 'Chapter slug is required and must be a string',
      severity: 'error'
    })
  }

  if (!c.title || typeof c.title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Chapter title is required and must be a string',
      severity: 'error'
    })
  }

  if (typeof c.order !== 'number') {
    errors.push({
      field: 'order',
      message: 'Chapter order must be a number',
      severity: 'error'
    })
  }

  if (!c.content || typeof c.content !== 'string') {
    errors.push({
      field: 'content',
      message: 'Chapter content is required and must be a string',
      severity: 'error'
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// Slug Utilities
// ============================================================================

export async function isSlugUnique(
  rootPath: string,
  slug: string,
  type: 'book' | 'chapter',
  bookSlug?: string
): Promise<boolean> {
  if (type === 'book') {
    const bookPath = getBookPath(rootPath, slug)
    return !(await ipcClient.fs.exists(bookPath))
  } else {
    if (!bookSlug) {
      throw new Error('bookSlug is required when checking chapter slug uniqueness')
    }
    const chapterPath = getChapterPath(rootPath, bookSlug, slug)
    return !(await ipcClient.fs.exists(chapterPath))
  }
}

export async function generateUniqueSlug(
  rootPath: string,
  baseTitle: string,
  type: 'book' | 'chapter',
  bookSlug?: string
): Promise<string> {
  let slug = slugify(baseTitle)
  let counter = 1

  while (!(await isSlugUnique(rootPath, slug, type, bookSlug))) {
    slug = `${slugify(baseTitle)}-${counter}`
    counter++
  }

  return slug
}

// ============================================================================
// File Operations
// ============================================================================

export async function saveBook(rootPath: string, book: Book): Promise<void> {
  const bookPath = getBookPath(rootPath, book.slug)
  const bookJsonPath = `${bookPath}/book.json`

  // Create book directory
  const exists = await ipcClient.fs.exists(bookPath)
  if (!exists) {
    await ipcClient.fs.mkdir(bookPath, true)
  }

  // Save book.json
  await ipcClient.fs.writeFile(bookJsonPath, JSON.stringify(book, null, 2))
}

export async function loadBook(rootPath: string, bookSlug: string): Promise<Book | null> {
  const bookJsonPath = `${getBookPath(rootPath, bookSlug)}/book.json`

  const exists = await ipcClient.fs.exists(bookJsonPath)
  if (!exists) {
    return null
  }

  const content = await ipcClient.fs.readFile(bookJsonPath)
  const book = JSON.parse(content) as Book

  const validation = validateBook(book)
  if (!validation.valid) {
    throw new Error(`Invalid book data: ${validation.errors.map((e) => e.message).join(', ')}`)
  }

  return book
}

export async function saveChapter(
  rootPath: string,
  bookSlug: string,
  chapter: Chapter
): Promise<void> {
  const chapterPath = getChapterPath(rootPath, bookSlug, chapter.slug)
  const chapterJsonPath = `${chapterPath}/chapter.json`
  const contentPath = getChapterContentPath(rootPath, bookSlug, chapter.slug)

  // Create chapter directory
  const exists = await ipcClient.fs.exists(chapterPath)
  if (!exists) {
    await ipcClient.fs.mkdir(chapterPath, true)
  }

  // Save chapter metadata
  const metadata = { ...chapter }
  delete (metadata as { content?: string }).content // Remove content from JSON

  await ipcClient.fs.writeFile(chapterJsonPath, JSON.stringify(metadata, null, 2))

  // Save chapter content
  await ipcClient.fs.writeFile(contentPath, chapter.content)
}

export async function loadChapter(
  rootPath: string,
  bookSlug: string,
  chapterSlug: string
): Promise<Chapter | null> {
  const chapterJsonPath = `${getChapterPath(rootPath, bookSlug, chapterSlug)}/chapter.json`
  const contentPath = getChapterContentPath(rootPath, bookSlug, chapterSlug)

  const jsonExists = await ipcClient.fs.exists(chapterJsonPath)
  const contentExists = await ipcClient.fs.exists(contentPath)

  if (!jsonExists || !contentExists) {
    return null
  }

  const metadataContent = await ipcClient.fs.readFile(chapterJsonPath)
  const chapter = JSON.parse(metadataContent) as Omit<Chapter, 'content'>

  const content = await ipcClient.fs.readFile(contentPath)

  const fullChapter: Chapter = {
    ...chapter,
    content
  }

  const validation = validateChapter(fullChapter)
  if (!validation.valid) {
    throw new Error(
      `Invalid chapter data: ${validation.errors.map((e) => e.message).join(', ')}`
    )
  }

  return fullChapter
}

export async function deleteBook(rootPath: string, bookSlug: string): Promise<void> {
  const bookPath = getBookPath(rootPath, bookSlug)
  await ipcClient.fs.delete(bookPath)
}

export async function deleteChapter(
  rootPath: string,
  bookSlug: string,
  chapterSlug: string
): Promise<void> {
  const chapterPath = getChapterPath(rootPath, bookSlug, chapterSlug)
  await ipcClient.fs.delete(chapterPath)
}

// ============================================================================
// Slug Renaming with Cascade Updates
// ============================================================================

export async function renameBookSlug(
  rootPath: string,
  oldSlug: string,
  newSlug: string
): Promise<void> {
  const oldPath = getBookPath(rootPath, oldSlug)
  const newPath = getBookPath(rootPath, newSlug)

  // Load book to update its slug
  const book = await loadBook(rootPath, oldSlug)
  if (!book) {
    throw new Error(`Book not found: ${oldSlug}`)
  }

  // Update book slug
  book.slug = newSlug
  book.modified = new Date().toISOString()

  // Move directory
  await ipcClient.fs.move(oldPath, newPath)

  // Save updated book.json
  await saveBook(rootPath, book)
}

export async function renameChapterSlug(
  rootPath: string,
  bookSlug: string,
  oldSlug: string,
  newSlug: string
): Promise<void> {
  const oldPath = getChapterPath(rootPath, bookSlug, oldSlug)
  const newPath = getChapterPath(rootPath, bookSlug, newSlug)

  // Load chapter to update its slug
  const chapter = await loadChapter(rootPath, bookSlug, oldSlug)
  if (!chapter) {
    throw new Error(`Chapter not found: ${oldSlug}`)
  }

  // Update chapter slug
  chapter.slug = newSlug
  chapter.modified = new Date().toISOString()

  // Move directory
  await ipcClient.fs.move(oldPath, newPath)

  // Save updated chapter
  await saveChapter(rootPath, bookSlug, chapter)

  // Update book.json to reference new slug
  const book = await loadBook(rootPath, bookSlug)
  if (book) {
    const index = book.chapters.indexOf(oldSlug)
    if (index !== -1) {
      book.chapters[index] = newSlug
      book.modified = new Date().toISOString()
      await saveBook(rootPath, book)
    }
  }
}

// ============================================================================
// Utilities
// ============================================================================

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

export function updateWordCount(chapter: Chapter): Chapter {
  return {
    ...chapter,
    wordCount: countWords(chapter.content),
    modified: new Date().toISOString()
  }
}

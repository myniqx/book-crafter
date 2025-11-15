import type { Entity } from '@renderer/store/slices/entitySlice'
import type { Book, Chapter } from '@renderer/store/slices/booksSlice'
import type { Note } from './note'

/**
 * Search result type
 */
export type SearchResultType = 'chapter' | 'entity' | 'note'

/**
 * Search result interface
 */
export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  content: string
  matchCount: number
  matches: SearchMatch[]
  // For navigation
  bookSlug?: string
  chapterSlug?: string
  entitySlug?: string
  noteSlug?: string
}

/**
 * Individual match within content
 */
export interface SearchMatch {
  line: number
  text: string
  startIndex: number
  endIndex: number
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string
  caseSensitive: boolean
  useRegex: boolean
  searchInChapters: boolean
  searchInEntities: boolean
  searchInNotes: boolean
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create regex from query
 */
function createSearchRegex(query: string, options: SearchOptions): RegExp {
  const pattern = options.useRegex ? query : escapeRegex(query)
  const flags = options.caseSensitive ? 'g' : 'gi'
  try {
    return new RegExp(pattern, flags)
  } catch {
    // Invalid regex, fallback to literal search
    return new RegExp(escapeRegex(query), flags)
  }
}

/**
 * Find matches in text
 */
function findMatches(text: string, regex: RegExp): SearchMatch[] {
  const matches: SearchMatch[] = []
  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    let match: RegExpExecArray | null
    const lineRegex = new RegExp(regex.source, regex.flags)

    while ((match = lineRegex.exec(line)) !== null) {
      matches.push({
        line: lineIndex + 1,
        text: line.trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }
  })

  return matches
}

/**
 * Search in chapters
 */
export function searchChapters(
  books: Record<string, Book>,
  options: SearchOptions
): SearchResult[] {
  if (!options.searchInChapters || !options.query.trim()) {
    return []
  }

  const results: SearchResult[] = []
  const regex = createSearchRegex(options.query, options)

  Object.values(books).forEach((book) => {
    book.chapters.forEach((chapter) => {
      const matches = findMatches(chapter.content, regex)

      if (matches.length > 0) {
        results.push({
          id: `chapter-${book.slug}-${chapter.slug}`,
          type: 'chapter',
          title: chapter.title,
          subtitle: `${book.title} - Chapter ${chapter.order + 1}`,
          content: chapter.content.substring(0, 200),
          matchCount: matches.length,
          matches,
          bookSlug: book.slug,
          chapterSlug: chapter.slug
        })
      }
    })
  })

  return results
}

/**
 * Search in entities
 */
export function searchEntities(
  entities: Record<string, Entity>,
  options: SearchOptions
): SearchResult[] {
  if (!options.searchInEntities || !options.query.trim()) {
    return []
  }

  const results: SearchResult[] = []
  const regex = createSearchRegex(options.query, options)

  Object.values(entities).forEach((entity) => {
    const searchText = [
      entity.name,
      entity.slug,
      ...entity.fields.map((f) => `${f.name}: ${f.value}`),
      ...entity.notes.map((n) => n.content)
    ].join('\n')

    const matches = findMatches(searchText, regex)

    if (matches.length > 0) {
      results.push({
        id: `entity-${entity.slug}`,
        type: 'entity',
        title: entity.name,
        subtitle: `Entity (${entity.type})`,
        content: entity.fields.map((f) => `${f.name}: ${f.value}`).join(', '),
        matchCount: matches.length,
        matches,
        entitySlug: entity.slug
      })
    }
  })

  return results
}

/**
 * Search in notes
 */
export function searchNotes(
  notes: Record<string, Note>,
  options: SearchOptions
): SearchResult[] {
  if (!options.searchInNotes || !options.query.trim()) {
    return []
  }

  const results: SearchResult[] = []
  const regex = createSearchRegex(options.query, options)

  Object.values(notes).forEach((note) => {
    const searchText = [
      note.title,
      note.content,
      ...note.tags,
      ...note.checklist.map((c) => c.content)
    ].join('\n')

    const matches = findMatches(searchText, regex)

    if (matches.length > 0) {
      results.push({
        id: `note-${note.slug}`,
        type: 'note',
        title: note.title,
        subtitle: `Note (${note.type})`,
        content: note.content.substring(0, 200),
        matchCount: matches.length,
        matches,
        noteSlug: note.slug
      })
    }
  })

  return results
}

/**
 * Perform global search
 */
export function globalSearch(
  books: Record<string, Book>,
  entities: Record<string, Entity>,
  notes: Record<string, Note>,
  options: SearchOptions
): SearchResult[] {
  const results: SearchResult[] = []

  // Search chapters
  results.push(...searchChapters(books, options))

  // Search entities
  results.push(...searchEntities(entities, options))

  // Search notes
  results.push(...searchNotes(notes, options))

  // Sort by match count
  results.sort((a, b) => b.matchCount - a.matchCount)

  return results
}

/**
 * Replace text in content
 */
export function replaceInText(
  text: string,
  searchQuery: string,
  replaceWith: string,
  options: Pick<SearchOptions, 'caseSensitive' | 'useRegex'>
): string {
  const regex = createSearchRegex(searchQuery, {
    query: searchQuery,
    ...options,
    searchInChapters: true,
    searchInEntities: true,
    searchInNotes: true
  })

  return text.replace(regex, replaceWith)
}

/**
 * Find entity usage across all chapters
 */
export function findEntityUsage(
  books: Record<string, Book>,
  entitySlug: string
): Array<{ bookSlug: string; chapterSlug: string; count: number; lines: number[] }> {
  const usage: Array<{ bookSlug: string; chapterSlug: string; count: number; lines: number[] }> =
    []

  // Match @entity-slug or @entity-slug.field
  const regex = new RegExp(`@${entitySlug}(?:\\.\\w+)?`, 'g')

  Object.values(books).forEach((book) => {
    book.chapters.forEach((chapter) => {
      const lines = chapter.content.split('\n')
      const matchLines: number[] = []
      let count = 0

      lines.forEach((line, index) => {
        const lineMatches = line.match(regex)
        if (lineMatches) {
          count += lineMatches.length
          matchLines.push(index + 1)
        }
      })

      if (count > 0) {
        usage.push({
          bookSlug: book.slug,
          chapterSlug: chapter.slug,
          count,
          lines: matchLines
        })
      }
    })
  })

  return usage
}

/**
 * Get total match count
 */
export function getTotalMatches(results: SearchResult[]): number {
  return results.reduce((sum, result) => sum + result.matchCount, 0)
}

/**
 * Group results by type
 */
export function groupResultsByType(
  results: SearchResult[]
): Record<SearchResultType, SearchResult[]> {
  return {
    chapter: results.filter((r) => r.type === 'chapter'),
    entity: results.filter((r) => r.type === 'entity'),
    note: results.filter((r) => r.type === 'note')
  }
}

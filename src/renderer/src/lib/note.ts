import slugify from 'slugify'

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Note types
 */
export type NoteType = 'general' | 'character' | 'plot' | 'worldbuilding' | 'research' | 'todo'

/**
 * Checklist item status
 */
export type ChecklistStatus = 'pending' | 'completed'

/**
 * Checklist item interface
 */
export interface ChecklistItem {
  id: string
  content: string
  status: ChecklistStatus
  created: string
  completed?: string
  // Optional reference to where this was checked off in the story
  checkLocation?: {
    bookSlug: string
    chapterSlug: string
    line?: number
  }
}

/**
 * Linked item (entity, book, chapter, image)
 */
export interface LinkedItem {
  type: 'entity' | 'book' | 'chapter' | 'image'
  slug: string
  name?: string
}

/**
 * Note interface
 */
export interface Note {
  id: string
  slug: string
  title: string
  content: string
  type: NoteType
  tags: string[]
  created: string
  modified: string
  linkedItems: LinkedItem[]
  checklist: ChecklistItem[]
  pinned: boolean
}

/**
 * Generate note slug from title
 */
export function generateNoteSlug(title: string, existingSlugs: string[]): string {
  let slug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  })

  // Ensure uniqueness
  if (!existingSlugs.includes(slug)) {
    return slug
  }

  // Add number suffix
  let counter = 1
  let uniqueSlug = `${slug}-${counter}`
  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${slug}-${counter}`
  }

  return uniqueSlug
}

/**
 * Validate note slug
 */
export function validateNoteSlug(slug: string): boolean {
  if (!slug || slug.length === 0) {
    return false
  }

  const slugRegex = /^[a-z0-9_-]+$/
  return slugRegex.test(slug)
}

/**
 * Check if slug is unique
 */
export function isNoteSlugUnique(slug: string, notes: Record<string, Note>): boolean {
  return !notes[slug]
}

/**
 * Create new note
 */
export function createNote(
  title: string,
  type: NoteType,
  existingSlugs: string[]
): Note {
  const now = new Date().toISOString()
  const slug = generateNoteSlug(title, existingSlugs)

  return {
    id: generateUUID(),
    slug,
    title,
    content: '',
    type,
    tags: [],
    created: now,
    modified: now,
    linkedItems: [],
    checklist: [],
    pinned: false
  }
}

/**
 * Create checklist item
 */
export function createChecklistItem(content: string): ChecklistItem {
  return {
    id: generateUUID(),
    content,
    status: 'pending',
    created: new Date().toISOString()
  }
}

/**
 * Mark checklist item as completed
 */
export function completeChecklistItem(
  item: ChecklistItem,
  location?: { bookSlug: string; chapterSlug: string; line?: number }
): ChecklistItem {
  return {
    ...item,
    status: 'completed',
    completed: new Date().toISOString(),
    checkLocation: location
  }
}

/**
 * Mark checklist item as pending
 */
export function uncompleteChecklistItem(item: ChecklistItem): ChecklistItem {
  return {
    ...item,
    status: 'pending',
    completed: undefined,
    checkLocation: undefined
  }
}

/**
 * Get checklist progress
 */
export function getChecklistProgress(checklist: ChecklistItem[]): {
  total: number
  completed: number
  percentage: number
} {
  const total = checklist.length
  const completed = checklist.filter((item) => item.status === 'completed').length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, percentage }
}

/**
 * Filter notes by type
 */
export function filterNotesByType(notes: Record<string, Note>, type: NoteType): Note[] {
  return Object.values(notes).filter((note) => note.type === type)
}

/**
 * Filter notes by tag
 */
export function filterNotesByTag(notes: Record<string, Note>, tag: string): Note[] {
  return Object.values(notes).filter((note) => note.tags.includes(tag))
}

/**
 * Search notes by title or content
 */
export function searchNotes(notes: Record<string, Note>, query: string): Note[] {
  const lowerQuery = query.toLowerCase()
  return Object.values(notes).filter(
    (note) =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Sort notes
 */
export type NoteSortBy = 'title' | 'date' | 'modified' | 'type'

export function sortNotes(notes: Note[], sortBy: NoteSortBy): Note[] {
  const sorted = [...notes]

  switch (sortBy) {
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'date':
      sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      break
    case 'modified':
      sorted.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      break
    case 'type':
      sorted.sort((a, b) => a.type.localeCompare(b.type))
      break
  }

  return sorted
}

/**
 * Get all unique tags from notes
 */
export function getAllNoteTags(notes: Record<string, Note>): string[] {
  const tagSet = new Set<string>()
  Object.values(notes).forEach((note) => {
    note.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
}

/**
 * Get note type label
 */
export function getNoteTypeLabel(type: NoteType): string {
  const labels: Record<NoteType, string> = {
    general: 'General',
    character: 'Character',
    plot: 'Plot',
    worldbuilding: 'Worldbuilding',
    research: 'Research',
    todo: 'To-Do'
  }
  return labels[type]
}

/**
 * Get note type icon (emoji)
 */
export function getNoteTypeIcon(type: NoteType): string {
  const icons: Record<NoteType, string> = {
    general: '📝',
    character: '👤',
    plot: '📖',
    worldbuilding: '🌍',
    research: '🔍',
    todo: '✅'
  }
  return icons[type]
}

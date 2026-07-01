import type { ToolCall, ToolResult } from '../types'
import { getToolByName } from './definitions'

/**
 * Store access type for tool executor
 * This will be passed from the AI slice
 */
export interface StoreAccess {
  // Books
  getBooks: () => Record<string, unknown>
  getBook: (slug: string) => unknown
  getChapter: (bookSlug: string, chapterSlug: string) => unknown
  addChapter: (bookSlug: string, chapter: unknown) => void
  updateChapter: (bookSlug: string, chapterSlug: string, content: string) => void
  deleteChapter: (bookSlug: string, chapterSlug: string) => void

  // Entities
  getEntities: () => Record<string, unknown>
  getEntity: (slug: string) => unknown
  addEntity: (entity: unknown) => void
  updateEntity: (slug: string, updates: unknown) => void
  deleteEntity: (slug: string) => void

  // Entity notes
  addEntityNote?: (slug: string, note: unknown) => void
  updateEntityNote?: (slug: string, noteId: string, updates: unknown) => void
  deleteEntityNote?: (slug: string, noteId: string) => void
  toggleChecklistItem?: (slug: string, noteId: string, itemId: string) => void

  // App-level actions
  createBackup?: (label?: string) => Promise<string>
  getEditorSettings?: () => Record<string, unknown>
  updateEditorSettings?: (updates: Record<string, unknown>) => void

  // Context - current working state
  getCurrentBookSlug?: () => string | null
  getCurrentChapterSlug?: () => string | null
  getAvailableBookSlugs?: () => string[]
  getEntitySlugs?: () => string[]
}

function generateNoteId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Escape special regex characters in user/entity-provided strings
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build a short, human-friendly summary of a successful tool execution.
 * This is what the user sees in the chat — the AI receives the full `content`.
 */
function buildDisplaySummary(
  name: string,
  args: Record<string, unknown>,
  content: string
): string {
  const a = args as Record<string, string | undefined>

  switch (name) {
    case 'list_books':
      return 'Listed books in the workspace'
    case 'list_chapters':
      return `Listed chapters of "${a.bookSlug}"`
    case 'read_chapter':
      return `Read chapter "${a.chapterSlug}" from "${a.bookSlug}"`
    case 'write_chapter':
      return `Updated chapter "${a.chapterSlug}" in "${a.bookSlug}"`
    case 'edit_chapter':
      return `Edited chapter "${a.chapterSlug}" in "${a.bookSlug}"`
    case 'manage_entity_notes':
      return `Note ${a.action === 'toggle_item' ? 'checklist updated' : `${a.action}ed`} on "${a.entitySlug}"`
    case 'app_command':
      return content.split('\n')[0].slice(0, 120)
    case 'create_chapter':
      return `Created chapter "${a.title}" in "${a.bookSlug}"`
    case 'delete_chapter':
      return `Deleted chapter "${a.chapterSlug}" from "${a.bookSlug}"`
    case 'search_content':
      return `Searched for "${a.query}"`
    case 'get_entity':
      return `Read entity "${a.entitySlug}"`
    case 'list_entities':
      return a.entityType ? `Listed ${a.entityType} entities` : 'Listed all entities'
    case 'create_entity':
      return `Created ${a.type || 'entity'} "${a.name}"`
    case 'update_entity':
      return `Updated entity "${a.entitySlug}"`
    case 'delete_entity':
      return `Deleted entity "${a.entitySlug}"`
    case 'generate_character':
      return `Created character "${a.name}"`
    case 'generate_location':
      return `Created location "${a.name}"`
    case 'analyze_entity_usage':
      return `Collected usage data for "${a.entitySlug}"`
    case 'check_consistency':
      return `Collected chapters of "${a.bookSlug}" for consistency check`
    case 'summarize_chapter':
      return `Collected chapter "${a.chapterSlug}" for summarization`
    case 'summarize_book':
      return `Collected book "${a.bookSlug}" for summarization`
    case 'find_plot_holes':
      return `Collected content of "${a.bookSlug}" for plot analysis`
    case 'analyze_character_arc':
      return `Collected arc data for "${a.entitySlug}"`
    case 'get_word_count':
      return `Calculated word count for "${a.bookSlug}"`
    case 'compare_chapters':
      return `Collected "${a.chapter1Slug}" and "${a.chapter2Slug}" for comparison`
    default:
      // Fallback: first line of the content, trimmed to a reasonable length
      return content.split('\n')[0].slice(0, 120) || `${name} completed`
  }
}

/**
 * Short, human-friendly failure line. The raw error stays in `content` for the AI.
 */
function buildErrorDisplay(name: string): string {
  const labels: Record<string, string> = {
    read_chapter: 'Could not read the chapter',
    write_chapter: 'Could not update the chapter',
    edit_chapter: 'Could not edit the chapter',
    create_chapter: 'Could not create the chapter',
    delete_chapter: 'Could not delete the chapter',
    manage_entity_notes: 'Could not update entity notes',
    app_command: 'App command failed',
    get_entity: 'Could not read the entity',
    create_entity: 'Could not create the entity',
    update_entity: 'Could not update the entity',
    delete_entity: 'Could not delete the entity',
    generate_character: 'Could not create the character',
    generate_location: 'Could not create the location'
  }
  return labels[name] || `${name} failed`
}

/**
 * Execute a tool call and return the result
 */
export async function executeToolCall(
  toolCall: ToolCall,
  storeAccess: StoreAccess
): Promise<ToolResult> {
  const tool = getToolByName(toolCall.name)

  if (!tool) {
    return {
      toolCallId: toolCall.id,
      content: `Error: Unknown tool "${toolCall.name}"`,
      displayContent: `Unknown tool: ${toolCall.name}`,
      isError: true
    }
  }

  try {
    const result = await executeToolByName(toolCall.name, toolCall.arguments, storeAccess)
    const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    return {
      toolCallId: toolCall.id,
      content,
      displayContent: buildDisplaySummary(toolCall.name, toolCall.arguments, content),
      isError: false
    }
  } catch (error) {
    return {
      toolCallId: toolCall.id,
      content: `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      displayContent: buildErrorDisplay(toolCall.name),
      isError: true
    }
  }
}

/**
 * Execute tool by name
 */
async function executeToolByName(
  name: string,
  args: Record<string, unknown>,
  store: StoreAccess
): Promise<unknown> {
  switch (name) {
    // File tools
    case 'list_books':
      return executeListBooks(store)
    case 'read_chapter':
      return executeReadChapter(args, store)
    case 'write_chapter':
      return executeWriteChapter(args, store)
    case 'edit_chapter':
      return executeEditChapter(args, store)
    case 'list_chapters':
      return executeListChapters(args, store)
    case 'create_chapter':
      return executeCreateChapter(args, store)
    case 'delete_chapter':
      return executeDeleteChapter(args, store)
    case 'search_content':
      return executeSearchContent(args, store)
    case 'get_entity':
      return executeGetEntity(args, store)
    case 'list_entities':
      return executeListEntities(args, store)
    case 'create_entity':
      return executeCreateEntity(args, store)
    case 'update_entity':
      return executeUpdateEntity(args, store)
    case 'delete_entity':
      return executeDeleteEntity(args, store)
    case 'manage_entity_notes':
      return executeManageEntityNotes(args, store)

    // Analysis tools
    case 'analyze_entity_usage':
      return executeAnalyzeEntityUsage(args, store)
    case 'check_consistency':
      return executeCheckConsistency(args, store)
    case 'summarize_chapter':
      return executeSummarizeChapter(args, store)
    case 'summarize_book':
      return executeSummarizeBook(args, store)
    case 'find_plot_holes':
      return executeFindPlotHoles(args, store)
    case 'analyze_character_arc':
      return executeAnalyzeCharacterArc(args, store)
    case 'get_word_count':
      return executeGetWordCount(args, store)
    case 'compare_chapters':
      return executeCompareChapters(args, store)

    // Entity generation tools - these create actual entities
    case 'generate_character':
      return executeGenerateCharacter(args, store)
    case 'generate_location':
      return executeGenerateLocation(args, store)

    // App tools
    case 'app_command':
      return executeAppCommand(args, store)
    case 'ask_user':
      // Handled by the agent loop (aiSlice), never dispatched here
      throw new Error('ask_user must be handled by the agent loop, not the executor')

    default:
      throw new Error(`Tool "${name}" is not implemented`)
  }
}

// ============ File Tool Implementations ============

function executeListBooks(store: StoreAccess): string {
  const books = store.getBooks() as Record<string, { title?: string; chapters?: unknown[] }>
  const entries = Object.entries(books)

  if (entries.length === 0) {
    return 'No books found in the workspace.'
  }

  const lines = ['# Available Books', '']
  entries.forEach(([slug, book]) => {
    const chapterCount = book.chapters?.length || 0
    lines.push(`- **${book.title || slug}** (slug: \`${slug}\`) - ${chapterCount} chapters`)
  })

  return lines.join('\n')
}

function executeReadChapter(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapterSlug } = args as { bookSlug: string; chapterSlug: string }
  const chapter = store.getChapter(bookSlug, chapterSlug) as
    | { title?: string; content?: string }
    | undefined

  if (!chapter) {
    throw new Error(`Chapter "${chapterSlug}" not found in book "${bookSlug}"`)
  }

  return `# ${chapter.title || chapterSlug}\n\n${chapter.content || '(empty chapter)'}`
}

function executeWriteChapter(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapterSlug, content } = args as {
    bookSlug: string
    chapterSlug: string
    content: string
  }

  store.updateChapter(bookSlug, chapterSlug, content)
  return `Successfully updated chapter "${chapterSlug}" in book "${bookSlug}"`
}

function executeEditChapter(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapterSlug, oldText, newText } = args as {
    bookSlug: string
    chapterSlug: string
    oldText: string
    newText: string
  }

  const chapter = store.getChapter(bookSlug, chapterSlug) as { content?: string } | undefined
  if (!chapter) {
    throw new Error(`Chapter "${chapterSlug}" not found in book "${bookSlug}"`)
  }

  const content = chapter.content || ''
  const occurrences = content.split(oldText).length - 1

  if (occurrences === 0) {
    throw new Error(
      'oldText was not found in the chapter. Read the chapter again and copy the text exactly, including whitespace and punctuation.'
    )
  }
  if (occurrences > 1) {
    throw new Error(
      `oldText appears ${occurrences} times in the chapter. Include more surrounding context to make it unique.`
    )
  }

  store.updateChapter(bookSlug, chapterSlug, content.replace(oldText, newText))
  return `Successfully edited chapter "${chapterSlug}" in book "${bookSlug}" (replaced ${oldText.length} chars with ${newText.length} chars)`
}

function executeListChapters(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug } = args as { bookSlug: string }
  const book = store.getBook(bookSlug) as
    | { chapters?: Array<{ slug: string; title: string }> }
    | undefined

  if (!book) {
    throw new Error(`Book "${bookSlug}" not found`)
  }

  const chapters = book.chapters || []
  if (chapters.length === 0) {
    return `Book "${bookSlug}" has no chapters`
  }

  return chapters.map((ch, i) => `${i + 1}. ${ch.title} (${ch.slug})`).join('\n')
}

function executeCreateChapter(args: Record<string, unknown>, store: StoreAccess): string {
  const {
    bookSlug,
    title,
    content = ''
  } = args as {
    bookSlug: string
    title: string
    content?: string
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  store.addChapter(bookSlug, {
    slug,
    title,
    content,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  })

  return `Successfully created chapter "${title}" (${slug}) in book "${bookSlug}"`
}

function executeDeleteChapter(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapterSlug } = args as { bookSlug: string; chapterSlug: string }
  store.deleteChapter(bookSlug, chapterSlug)
  return `Successfully deleted chapter "${chapterSlug}" from book "${bookSlug}"`
}

function executeSearchContent(args: Record<string, unknown>, store: StoreAccess): string {
  const {
    query,
    bookSlug,
    caseSensitive = false
  } = args as {
    query: string
    bookSlug?: string
    caseSensitive?: boolean
  }

  const books = store.getBooks() as Record<
    string,
    { title: string; chapters?: Array<{ slug: string; title: string; content?: string }> }
  >
  const results: Array<{ book: string; chapter: string; matches: number }> = []

  const searchQuery = caseSensitive ? query : query.toLowerCase()

  for (const [slug, book] of Object.entries(books)) {
    if (bookSlug && slug !== bookSlug) continue

    for (const chapter of book.chapters || []) {
      const content = caseSensitive ? chapter.content || '' : (chapter.content || '').toLowerCase()

      const matches = (content.match(new RegExp(escapeRegExp(searchQuery), 'g')) || []).length
      if (matches > 0) {
        results.push({
          book: book.title,
          chapter: chapter.title,
          matches
        })
      }
    }
  }

  if (results.length === 0) {
    return `No results found for "${query}"`
  }

  return results.map((r) => `- ${r.book} / ${r.chapter}: ${r.matches} match(es)`).join('\n')
}

interface EntityShape {
  name: string
  type: string
  fields?: Array<{ name: string; value: string }>
  notes?: Array<{
    id: string
    content: string
    type: 'general' | 'checklist'
    checklistItems?: Array<{
      id: string
      text: string
      completed: boolean
      completedIn?: { book: string; chapter: string; line: number }
    }>
  }>
  relations?: Array<{ targetEntitySlug: string; type: string; description?: string }>
  metadata?: {
    usageCount?: number
    usageLocations?: Array<{ book: string; chapter: string; line: number }>
  }
}

function executeGetEntity(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug } = args as { entitySlug: string }
  const entity = store.getEntity(entitySlug) as EntityShape | undefined

  if (!entity) {
    throw new Error(`Entity "${entitySlug}" not found`)
  }

  const lines = [`# ${entity.name} (@${entitySlug})`, `Type: ${entity.type}`, '']

  if (entity.fields) {
    for (const field of entity.fields) {
      if (field.value) {
        lines.push(`**${field.name}:** ${field.value}`)
      }
    }
  }

  if (entity.notes && entity.notes.length > 0) {
    lines.push('', '## Notes')
    for (const note of entity.notes) {
      lines.push(`- [id: ${note.id}] (${note.type}) ${note.content}`)
      if (note.type === 'checklist' && note.checklistItems) {
        for (const item of note.checklistItems) {
          const status = item.completed ? 'x' : ' '
          const where = item.completedIn
            ? ` — done in ${item.completedIn.book}/${item.completedIn.chapter}:${item.completedIn.line}`
            : ''
          lines.push(`  - [${status}] [id: ${item.id}] ${item.text}${where}`)
        }
      }
    }
  }

  if (entity.relations && entity.relations.length > 0) {
    lines.push('', '## Relations')
    for (const rel of entity.relations) {
      lines.push(
        `- ${rel.type} → @${rel.targetEntitySlug}${rel.description ? ` (${rel.description})` : ''}`
      )
    }
  }

  const usage = entity.metadata
  if (usage && (usage.usageCount || usage.usageLocations?.length)) {
    lines.push('', '## Usage')
    lines.push(`Mentioned ${usage.usageCount ?? 0} time(s)`)
    for (const loc of (usage.usageLocations || []).slice(0, 20)) {
      lines.push(`- ${loc.book} / ${loc.chapter} (line ${loc.line})`)
    }
  }

  return lines.join('\n')
}

function executeManageEntityNotes(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug, action, noteId, itemId, content, noteType, checklistItems } = args as {
    entitySlug: string
    action: 'add' | 'update' | 'delete' | 'toggle_item'
    noteId?: string
    itemId?: string
    content?: string
    noteType?: 'general' | 'checklist'
    checklistItems?: string[]
  }

  const entity = store.getEntity(entitySlug)
  if (!entity) {
    throw new Error(`Entity "${entitySlug}" not found`)
  }

  switch (action) {
    case 'add': {
      if (!store.addEntityNote) throw new Error('Note actions are not available')
      if (!content) throw new Error('content is required for the add action')
      const now = new Date().toISOString()
      const type = noteType || (checklistItems?.length ? 'checklist' : 'general')
      const note = {
        id: generateNoteId(),
        content,
        type,
        checklistItems:
          type === 'checklist'
            ? (checklistItems || []).map((text) => ({
                id: generateNoteId(),
                text,
                completed: false
              }))
            : undefined,
        created: now,
        modified: now
      }
      store.addEntityNote(entitySlug, note)
      return `Added ${type} note to "${entitySlug}" (note id: ${note.id})`
    }
    case 'update': {
      if (!store.updateEntityNote) throw new Error('Note actions are not available')
      if (!noteId) throw new Error('noteId is required for the update action')
      if (!content) throw new Error('content is required for the update action')
      store.updateEntityNote(entitySlug, noteId, {
        content,
        modified: new Date().toISOString()
      })
      return `Updated note ${noteId} on "${entitySlug}"`
    }
    case 'delete': {
      if (!store.deleteEntityNote) throw new Error('Note actions are not available')
      if (!noteId) throw new Error('noteId is required for the delete action')
      store.deleteEntityNote(entitySlug, noteId)
      return `Deleted note ${noteId} from "${entitySlug}"`
    }
    case 'toggle_item': {
      if (!store.toggleChecklistItem) throw new Error('Note actions are not available')
      if (!noteId || !itemId) {
        throw new Error('noteId and itemId are required for the toggle_item action')
      }
      store.toggleChecklistItem(entitySlug, noteId, itemId)
      return `Toggled checklist item ${itemId} in note ${noteId} on "${entitySlug}"`
    }
    default:
      throw new Error(`Unknown action "${action}"`)
  }
}

function executeListEntities(args: Record<string, unknown>, store: StoreAccess): string {
  const { entityType } = args as { entityType?: string }
  const entities = store.getEntities() as Record<string, { name: string; type: string }>

  const filtered = Object.entries(entities).filter(
    ([, entity]) => !entityType || entity.type === entityType
  )

  if (filtered.length === 0) {
    return entityType ? `No entities of type "${entityType}" found` : 'No entities found'
  }

  return filtered.map(([slug, entity]) => `- ${entity.name} (${slug}) [${entity.type}]`).join('\n')
}

/**
 * Generate Character - Creates a person entity
 * Template: person (Name, Age, Occupation, Description)
 */
function executeGenerateCharacter(args: Record<string, unknown>, store: StoreAccess): string {
  const { name, age, occupation, description } = args as {
    name: string
    age?: number
    occupation?: string
    description?: string
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  store.addEntity({
    slug,
    name,
    type: 'person',
    fields: [
      { name: 'Name', value: name, type: 'text' },
      { name: 'Age', value: age ? String(age) : '', type: 'number' },
      { name: 'Occupation', value: occupation || '', type: 'text' },
      { name: 'Description', value: description || '', type: 'textarea' }
    ],
    defaultField: 'Name',
    notes: [],
    relations: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      usageCount: 0,
      usageLocations: []
    }
  })

  return `Successfully created character "${name}" (@${slug}). You can now reference this character in chapters using @${slug} or @${slug}.age, @${slug}.occupation, etc.`
}

/**
 * Generate Location - Creates a place entity
 * Template: place (Name, Location, Description)
 */
function executeGenerateLocation(args: Record<string, unknown>, store: StoreAccess): string {
  const { name, location, description } = args as {
    name: string
    location?: string
    description?: string
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  store.addEntity({
    slug,
    name,
    type: 'place',
    fields: [
      { name: 'Name', value: name, type: 'text' },
      { name: 'Location', value: location || '', type: 'text' },
      { name: 'Description', value: description || '', type: 'textarea' }
    ],
    defaultField: 'Name',
    notes: [],
    relations: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      usageCount: 0,
      usageLocations: []
    }
  })

  return `Successfully created location "${name}" (@${slug}). You can now reference this location in chapters using @${slug} or @${slug}.location, @${slug}.description.`
}

function executeCreateEntity(args: Record<string, unknown>, store: StoreAccess): string {
  const {
    name,
    type,
    fields = {}
  } = args as {
    name: string
    type: string
    fields?: Record<string, string>
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const fieldArray = [
    { name: 'Name', value: name, type: 'text' },
    ...Object.entries(fields)
      .filter(([key]) => key.toLowerCase() !== 'name')
      .map(([key, value]) => ({ name: key, value: String(value), type: 'text' }))
  ]

  store.addEntity({
    slug,
    name,
    type,
    fields: fieldArray,
    defaultField: 'Name',
    notes: [],
    relations: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      usageCount: 0,
      usageLocations: []
    }
  })

  return `Successfully created ${type} "${name}" (@${slug})`
}

function executeUpdateEntity(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug, fields } = args as {
    entitySlug: string
    fields: Record<string, string>
  }

  const entity = store.getEntity(entitySlug) as
    | {
        fields: Array<{ name: string; value: string; type: string }>
        metadata: Record<string, unknown>
      }
    | undefined

  if (!entity) {
    throw new Error(`Entity "${entitySlug}" not found`)
  }

  // Entity fields are stored as an array — map the incoming key/value pairs
  // onto existing fields by name (case-insensitive), appending unknown keys.
  const updatedFields = entity.fields.map((f) => ({ ...f }))
  const updatedNames: string[] = []

  for (const [key, value] of Object.entries(fields)) {
    const index = updatedFields.findIndex((f) => f.name.toLowerCase() === key.toLowerCase())
    if (index !== -1) {
      updatedFields[index].value = String(value)
      updatedNames.push(updatedFields[index].name)
    } else {
      updatedFields.push({ name: key, value: String(value), type: 'text' })
      updatedNames.push(key)
    }
  }

  store.updateEntity(entitySlug, {
    fields: updatedFields,
    metadata: { ...entity.metadata, modified: new Date().toISOString() }
  })

  return `Successfully updated entity "${entitySlug}" (fields: ${updatedNames.join(', ')})`
}

function executeDeleteEntity(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug } = args as { entitySlug: string }
  store.deleteEntity(entitySlug)
  return `Successfully deleted entity "${entitySlug}"`
}

// ============ Analysis Tool Implementations ============
// These return data that the AI will then analyze

function executeAnalyzeEntityUsage(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug, bookSlug } = args as { entitySlug: string; bookSlug?: string }
  const entity = store.getEntity(entitySlug) as { name: string } | undefined

  if (!entity) {
    throw new Error(`Entity "${entitySlug}" not found`)
  }

  const books = store.getBooks() as Record<
    string,
    { title: string; chapters?: Array<{ title: string; content?: string }> }
  >
  const usages: Array<{ book: string; chapter: string; count: number; excerpts: string[] }> = []

  const searchTerms = [entity.name, `@${entitySlug}`]

  for (const [slug, book] of Object.entries(books)) {
    if (bookSlug && slug !== bookSlug) continue

    for (const chapter of book.chapters || []) {
      const content = chapter.content || ''
      let totalCount = 0
      const excerpts: string[] = []

      for (const term of searchTerms) {
        const regex = new RegExp(escapeRegExp(term), 'gi')
        const matches = content.match(regex)
        if (matches) {
          totalCount += matches.length
          // Get first excerpt
          const index = content.toLowerCase().indexOf(term.toLowerCase())
          if (index !== -1) {
            const start = Math.max(0, index - 50)
            const end = Math.min(content.length, index + term.length + 50)
            excerpts.push(`...${content.slice(start, end)}...`)
          }
        }
      }

      if (totalCount > 0) {
        usages.push({
          book: book.title,
          chapter: chapter.title,
          count: totalCount,
          excerpts: excerpts.slice(0, 2)
        })
      }
    }
  }

  if (usages.length === 0) {
    return `No usages of "${entity.name}" found`
  }

  return usages
    .map((u) => {
      const lines = [`## ${u.book} / ${u.chapter} (${u.count} mentions)`]
      for (const excerpt of u.excerpts) {
        lines.push(`> ${excerpt}`)
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

function executeCheckConsistency(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug } = args as { bookSlug: string; checkType?: string }
  const book = store.getBook(bookSlug) as
    | { title: string; chapters?: Array<{ title: string; content?: string }> }
    | undefined

  if (!book) {
    throw new Error(`Book "${bookSlug}" not found`)
  }

  // Return all chapter contents for AI to analyze
  const chapters = book.chapters || []
  const content = chapters
    .map((ch) => `## ${ch.title}\n\n${ch.content || '(empty)'}`)
    .join('\n\n---\n\n')

  return `Book: ${book.title}\n\n${content}`
}

function executeSummarizeChapter(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapterSlug } = args as {
    bookSlug: string
    chapterSlug: string
    length?: string
  }
  const chapter = store.getChapter(bookSlug, chapterSlug) as
    | { title?: string; content?: string }
    | undefined

  if (!chapter) {
    throw new Error(`Chapter "${chapterSlug}" not found in book "${bookSlug}"`)
  }

  return `# ${chapter.title || chapterSlug}\n\n${chapter.content || '(empty chapter)'}`
}

function executeSummarizeBook(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug } = args as { bookSlug: string; length?: string }
  const book = store.getBook(bookSlug) as
    | { title: string; chapters?: Array<{ title: string; content?: string }> }
    | undefined

  if (!book) {
    throw new Error(`Book "${bookSlug}" not found`)
  }

  const chapters = book.chapters || []
  const content = chapters
    .map((ch) => `## ${ch.title}\n\n${ch.content || '(empty)'}`)
    .join('\n\n---\n\n')

  return `Book: ${book.title}\n\n${content}`
}

function executeFindPlotHoles(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapterSlug } = args as { bookSlug: string; chapterSlug?: string }
  const book = store.getBook(bookSlug) as
    | { title: string; chapters?: Array<{ slug: string; title: string; content?: string }> }
    | undefined

  if (!book) {
    throw new Error(`Book "${bookSlug}" not found`)
  }

  const chapters = book.chapters || []
  const filtered = chapterSlug ? chapters.filter((ch) => ch.slug === chapterSlug) : chapters

  const content = filtered
    .map((ch) => `## ${ch.title}\n\n${ch.content || '(empty)'}`)
    .join('\n\n---\n\n')

  return `Book: ${book.title}\n\n${content}`
}

function executeAnalyzeCharacterArc(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug, bookSlug } = args as { entitySlug: string; bookSlug: string }

  // Get entity details
  const entityResult = executeGetEntity({ entitySlug }, store)

  // Get usage in book
  const usageResult = executeAnalyzeEntityUsage({ entitySlug, bookSlug }, store)

  return `${entityResult}\n\n---\n\nUsage in story:\n\n${usageResult}`
}

function executeGetWordCount(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapterSlug } = args as { bookSlug: string; chapterSlug?: string }
  const book = store.getBook(bookSlug) as
    | { title: string; chapters?: Array<{ slug: string; title: string; content?: string }> }
    | undefined

  if (!book) {
    throw new Error(`Book "${bookSlug}" not found`)
  }

  const chapters = book.chapters || []
  const stats: Array<{ title: string; words: number; chars: number }> = []

  for (const chapter of chapters) {
    if (chapterSlug && chapter.slug !== chapterSlug) continue

    const content = chapter.content || ''
    const words = content.split(/\s+/).filter(Boolean).length
    const chars = content.length

    stats.push({ title: chapter.title, words, chars })
  }

  const total = stats.reduce(
    (acc, s) => ({ words: acc.words + s.words, chars: acc.chars + s.chars }),
    { words: 0, chars: 0 }
  )

  const lines = stats.map((s) => `- ${s.title}: ${s.words} words, ${s.chars} characters`)
  lines.push('')
  lines.push(`**Total:** ${total.words} words, ${total.chars} characters`)

  return lines.join('\n')
}

function executeCompareChapters(args: Record<string, unknown>, store: StoreAccess): string {
  const { bookSlug, chapter1Slug, chapter2Slug } = args as {
    bookSlug: string
    chapter1Slug: string
    chapter2Slug: string
    compareType?: string
  }

  const chapter1 = store.getChapter(bookSlug, chapter1Slug) as
    | { title?: string; content?: string }
    | undefined
  const chapter2 = store.getChapter(bookSlug, chapter2Slug) as
    | { title?: string; content?: string }
    | undefined

  if (!chapter1) {
    throw new Error(`Chapter "${chapter1Slug}" not found`)
  }
  if (!chapter2) {
    throw new Error(`Chapter "${chapter2Slug}" not found`)
  }

  return `## Chapter 1: ${chapter1.title || chapter1Slug}\n\n${chapter1.content || '(empty)'}\n\n---\n\n## Chapter 2: ${chapter2.title || chapter2Slug}\n\n${chapter2.content || '(empty)'}`
}

// ============ App Tool Implementations ============

// Editor settings the AI is allowed to change, with parsers/validators.
const EDITABLE_EDITOR_SETTINGS: Record<string, (value: string) => unknown> = {
  fontSize: (v) => clampNumber(v, 8, 32),
  fontFamily: (v) => v,
  lineHeight: (v) => clampNumber(v, 1, 3),
  wordWrap: parseBoolean,
  minimap: parseBoolean,
  lineNumbers: parseBoolean,
  tabSize: (v) => clampNumber(v, 1, 8),
  autoSave: parseBoolean,
  autoSaveDelay: (v) => clampNumber(v, 100, 60000)
}

function clampNumber(value: string, min: number, max: number): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`"${value}" is not a valid number`)
  }
  return Math.min(max, Math.max(min, parsed))
}

function parseBoolean(value: string): boolean {
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`"${value}" is not a valid boolean (use "true" or "false")`)
}

async function executeAppCommand(
  args: Record<string, unknown>,
  store: StoreAccess
): Promise<string> {
  const { action, label, setting, value } = args as {
    action: 'create_backup' | 'get_editor_settings' | 'set_editor_setting'
    label?: string
    setting?: string
    value?: string
  }

  switch (action) {
    case 'create_backup': {
      if (!store.createBackup) throw new Error('Backup is not available (no workspace open?)')
      const path = await store.createBackup(label)
      return `Backup created: ${path}`
    }
    case 'get_editor_settings': {
      if (!store.getEditorSettings) throw new Error('Editor settings are not available')
      const settings = store.getEditorSettings()
      const editable = Object.keys(EDITABLE_EDITOR_SETTINGS)
      const lines = editable.map((key) => `- ${key}: ${JSON.stringify(settings[key])}`)
      return `Current editor settings:\n${lines.join('\n')}`
    }
    case 'set_editor_setting': {
      if (!store.updateEditorSettings) throw new Error('Editor settings are not available')
      if (!setting || value === undefined) {
        throw new Error('setting and value are required for set_editor_setting')
      }
      const parse = EDITABLE_EDITOR_SETTINGS[setting]
      if (!parse) {
        throw new Error(
          `Setting "${setting}" cannot be changed. Editable settings: ${Object.keys(EDITABLE_EDITOR_SETTINGS).join(', ')}`
        )
      }
      const parsed = parse(String(value))
      store.updateEditorSettings({ [setting]: parsed })
      return `Editor setting updated: ${setting} = ${JSON.stringify(parsed)}`
    }
    default:
      throw new Error(`Unknown app_command action "${action}"`)
  }
}

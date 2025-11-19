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
      isError: true
    }
  }

  try {
    const result = await executeToolByName(toolCall.name, toolCall.arguments, storeAccess)
    return {
      toolCallId: toolCall.id,
      content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      isError: false
    }
  } catch (error) {
    return {
      toolCallId: toolCall.id,
      content: `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    case 'read_chapter':
      return executeReadChapter(args, store)
    case 'write_chapter':
      return executeWriteChapter(args, store)
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

    // Generation tools - these return prompts for AI to process
    case 'generate_character':
    case 'generate_location':
    case 'write_scene':
    case 'suggest_dialogue':
    case 'generate_outline':
    case 'expand_text':
    case 'brainstorm_ideas':
      return executeGenerationTool(name, args, store)

    // Editing tools - these also return prompts for AI
    case 'proofread':
    case 'adapt_style':
    case 'change_pov':
    case 'change_tense':
    case 'simplify_text':
    case 'intensify_emotion':
    case 'translate':
    case 'add_descriptions':
    case 'remove_filter_words':
      return executeEditingTool(name, args, store)

    default:
      throw new Error(`Tool "${name}" is not implemented`)
  }
}

// ============ File Tool Implementations ============

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

      const matches = (content.match(new RegExp(searchQuery, 'g')) || []).length
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

function executeGetEntity(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug } = args as { entitySlug: string }
  const entity = store.getEntity(entitySlug) as
    | {
        name: string
        type: string
        fields?: Array<{ name: string; value: string }>
      }
    | undefined

  if (!entity) {
    throw new Error(`Entity "${entitySlug}" not found`)
  }

  const lines = [`# ${entity.name}`, `Type: ${entity.type}`, '']

  if (entity.fields) {
    for (const field of entity.fields) {
      if (field.value) {
        lines.push(`**${field.name}:** ${field.value}`)
      }
    }
  }

  return lines.join('\n')
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

  const fieldArray = Object.entries(fields).map(([key, value]) => ({
    name: key,
    value: String(value)
  }))

  store.addEntity({
    slug,
    name,
    type,
    fields: fieldArray,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  })

  return `Successfully created ${type} "${name}" (${slug})`
}

function executeUpdateEntity(args: Record<string, unknown>, store: StoreAccess): string {
  const { entitySlug, fields } = args as {
    entitySlug: string
    fields: Record<string, string>
  }

  store.updateEntity(entitySlug, fields)
  return `Successfully updated entity "${entitySlug}"`
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
        const regex = new RegExp(term, 'gi')
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

// ============ Generation & Editing Tool Implementations ============
// These return context for AI to generate content

function executeGenerationTool(
  name: string,
  args: Record<string, unknown>,
  store: StoreAccess
): string {
  // Get any entity context
  const entityContext: string[] = []

  if (args.characters) {
    const characters = args.characters as string[]
    for (const slug of characters) {
      try {
        const entity = executeGetEntity({ entitySlug: slug }, store)
        entityContext.push(entity)
      } catch {
        entityContext.push(`Character "${slug}" not found`)
      }
    }
  }

  if (args.includeCharacters) {
    const characters = args.includeCharacters as string[]
    for (const slug of characters) {
      try {
        const entity = executeGetEntity({ entitySlug: slug }, store)
        entityContext.push(entity)
      } catch {
        entityContext.push(`Character "${slug}" not found`)
      }
    }
  }

  const context =
    entityContext.length > 0 ? `\n\nEntity context:\n${entityContext.join('\n\n')}` : ''

  return `Tool: ${name}\nParameters: ${JSON.stringify(args, null, 2)}${context}`
}

function executeEditingTool(
  name: string,
  args: Record<string, unknown>,
  store: StoreAccess
): string {
  return `Tool: ${name}\nParameters: ${JSON.stringify(args, null, 2)}`
}

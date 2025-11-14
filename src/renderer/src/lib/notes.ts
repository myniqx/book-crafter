import type { Note } from './note'

/**
 * Get notes directory path
 */
export function getNotesDir(workspacePath: string): string {
  return `${workspacePath}/.notes`
}

/**
 * Get note file path
 */
export function getNotePath(workspacePath: string, slug: string): string {
  return `${getNotesDir(workspacePath)}/${slug}.json`
}

/**
 * Save note to disk
 */
export async function saveNote(workspacePath: string, note: Note): Promise<void> {
  const notePath = getNotePath(workspacePath, note.slug)
  const noteData = JSON.stringify(note, null, 2)

  if (window.api?.fs?.writeFile) {
    await window.api.fs.writeFile(notePath, noteData, 'utf-8')
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Load note from disk
 */
export async function loadNote(workspacePath: string, slug: string): Promise<Note | null> {
  const notePath = getNotePath(workspacePath, slug)

  try {
    if (window.api?.fs?.readFile) {
      const content = await window.api.fs.readFile(notePath, 'utf-8')
      const note = JSON.parse(content) as Note
      return note
    }
  } catch (error) {
    console.error(`Failed to load note ${slug}:`, error)
  }

  return null
}

/**
 * Load all notes from workspace
 */
export async function loadAllNotes(workspacePath: string): Promise<Record<string, Note>> {
  const notesDir = getNotesDir(workspacePath)
  const notes: Record<string, Note> = {}

  try {
    if (!window.api?.fs?.readDir) {
      throw new Error('File system API not available')
    }

    // Read all files in .notes/
    const files = await window.api.fs.readDir(notesDir)

    // Filter JSON files
    const noteFiles = files.filter((file) => file.endsWith('.json'))

    // Load each note
    for (const file of noteFiles) {
      const slug = file.replace('.json', '')
      const note = await loadNote(workspacePath, slug)
      if (note) {
        notes[slug] = note
      }
    }
  } catch (error) {
    console.error('Failed to load notes:', error)
  }

  return notes
}

/**
 * Delete note from disk
 */
export async function deleteNote(workspacePath: string, slug: string): Promise<void> {
  const notePath = getNotePath(workspacePath, slug)

  if (window.api?.fs?.deleteFile) {
    await window.api.fs.deleteFile(notePath)
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Update note on disk
 */
export async function updateNote(
  workspacePath: string,
  slug: string,
  updates: Partial<Note>
): Promise<void> {
  // Load existing note
  const existing = await loadNote(workspacePath, slug)
  if (!existing) {
    throw new Error(`Note not found: ${slug}`)
  }

  // Merge updates
  const updated: Note = {
    ...existing,
    ...updates,
    modified: new Date().toISOString()
  }

  // Save back
  await saveNote(workspacePath, updated)
}

/**
 * Rename note slug
 */
export async function renameNoteSlug(
  workspacePath: string,
  oldSlug: string,
  newSlug: string
): Promise<void> {
  // Load existing note
  const note = await loadNote(workspacePath, oldSlug)
  if (!note) {
    throw new Error(`Note not found: ${oldSlug}`)
  }

  // Create new note with new slug
  const newNote: Note = {
    ...note,
    slug: newSlug,
    modified: new Date().toISOString()
  }

  // Save new note
  await saveNote(workspacePath, newNote)

  // Delete old note
  await deleteNote(workspacePath, oldSlug)
}

/**
 * Export note to external file
 */
export async function exportNote(
  workspacePath: string,
  slug: string,
  targetPath: string,
  format: 'json' | 'md' = 'json'
): Promise<void> {
  const note = await loadNote(workspacePath, slug)
  if (!note) {
    throw new Error(`Note not found: ${slug}`)
  }

  let content: string

  if (format === 'json') {
    content = JSON.stringify(note, null, 2)
  } else {
    // Export as markdown
    content = `# ${note.title}\n\n`
    content += `**Type:** ${note.type}\n`
    content += `**Created:** ${new Date(note.created).toLocaleString()}\n`
    content += `**Modified:** ${new Date(note.modified).toLocaleString()}\n\n`

    if (note.tags.length > 0) {
      content += `**Tags:** ${note.tags.join(', ')}\n\n`
    }

    if (note.checklist.length > 0) {
      content += `## Checklist\n\n`
      note.checklist.forEach((item) => {
        const checkbox = item.status === 'completed' ? '[x]' : '[ ]'
        content += `- ${checkbox} ${item.content}\n`
      })
      content += '\n'
    }

    if (note.linkedItems.length > 0) {
      content += `## Linked Items\n\n`
      note.linkedItems.forEach((item) => {
        content += `- ${item.type}: ${item.slug}\n`
      })
      content += '\n'
    }

    content += `## Content\n\n${note.content}\n`
  }

  if (window.api?.fs?.writeFile) {
    await window.api.fs.writeFile(targetPath, content, 'utf-8')
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Import note from external file
 */
export async function importNote(
  workspacePath: string,
  sourcePath: string
): Promise<Note> {
  if (!window.api?.fs?.readFile) {
    throw new Error('File system API not available')
  }

  const content = await window.api.fs.readFile(sourcePath, 'utf-8')
  const note = JSON.parse(content) as Note

  // Update modified timestamp
  note.modified = new Date().toISOString()

  // Save to workspace
  await saveNote(workspacePath, note)

  return note
}

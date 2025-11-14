import { StateCreator } from 'zustand'
import { AppStore } from '..'
import type { Note, NoteType, ChecklistItem, LinkedItem } from '@renderer/lib/note'
import {
  createNote,
  createChecklistItem,
  completeChecklistItem,
  uncompleteChecklistItem
} from '@renderer/lib/note'
import { loadAllNotes, saveNote, deleteNote as deleteNoteFile } from '@renderer/lib/notes'

export interface NoteSlice {
  notes: Record<string, Note>
  selectedNoteSlug: string | null
  isLoadingNotes: boolean

  // CRUD operations
  addNote: (note: Note) => void
  updateNote: (slug: string, updates: Partial<Note>) => void
  deleteNote: (slug: string) => void
  selectNote: (slug: string | null) => void

  // File operations
  loadAllNotes: (workspacePath: string) => Promise<void>
  saveNoteToDisk: (workspacePath: string, slug: string) => Promise<void>
  deleteNoteFromDisk: (workspacePath: string, slug: string) => Promise<void>

  // Note content
  updateNoteContent: (slug: string, content: string) => void
  updateNoteTitle: (slug: string, title: string) => void

  // Tags
  addNoteTag: (slug: string, tag: string) => void
  removeNoteTag: (slug: string, tag: string) => void
  setNoteTags: (slug: string, tags: string[]) => void

  // Checklist operations
  addChecklistItem: (slug: string, content: string) => void
  updateChecklistItem: (slug: string, itemId: string, content: string) => void
  toggleChecklistItem: (
    slug: string,
    itemId: string,
    location?: { bookSlug: string; chapterSlug: string; line?: number }
  ) => void
  deleteChecklistItem: (slug: string, itemId: string) => void
  reorderChecklistItems: (slug: string, itemIds: string[]) => void

  // Linked items
  addLinkedItem: (slug: string, item: LinkedItem) => void
  removeLinkedItem: (slug: string, itemSlug: string) => void

  // Pin/unpin
  togglePin: (slug: string) => void
}

export const createNoteSlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  NoteSlice
> = (set, get) => ({
  notes: {},
  selectedNoteSlug: null,
  isLoadingNotes: false,

  // CRUD operations
  addNote: (note) =>
    set((state) => {
      state.notes[note.slug] = note
    }),

  updateNote: (slug, updates) =>
    set((state) => {
      if (state.notes[slug]) {
        state.notes[slug] = {
          ...state.notes[slug],
          ...updates,
          modified: new Date().toISOString()
        }
      }
    }),

  deleteNote: (slug) =>
    set((state) => {
      delete state.notes[slug]
      if (state.selectedNoteSlug === slug) {
        state.selectedNoteSlug = null
      }
    }),

  selectNote: (slug) =>
    set((state) => {
      state.selectedNoteSlug = slug
    }),

  // File operations
  loadAllNotes: async (workspacePath) => {
    set((state) => {
      state.isLoadingNotes = true
    })

    try {
      const notes = await loadAllNotes(workspacePath)
      set((state) => {
        state.notes = notes
      })
    } catch (error) {
      console.error('Failed to load notes:', error)
      throw error
    } finally {
      set((state) => {
        state.isLoadingNotes = false
      })
    }
  },

  saveNoteToDisk: async (workspacePath, slug) => {
    const note = get().notes[slug]
    if (!note) {
      throw new Error(`Note not found: ${slug}`)
    }

    try {
      await saveNote(workspacePath, note)
    } catch (error) {
      console.error(`Failed to save note ${slug}:`, error)
      throw error
    }
  },

  deleteNoteFromDisk: async (workspacePath, slug) => {
    const note = get().notes[slug]
    if (!note) {
      throw new Error(`Note not found: ${slug}`)
    }

    try {
      await deleteNoteFile(workspacePath, slug)
      get().deleteNote(slug)
    } catch (error) {
      console.error(`Failed to delete note ${slug}:`, error)
      throw error
    }
  },

  // Note content
  updateNoteContent: (slug, content) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        note.content = content
        note.modified = new Date().toISOString()
      }
    }),

  updateNoteTitle: (slug, title) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        note.title = title
        note.modified = new Date().toISOString()
      }
    }),

  // Tags
  addNoteTag: (slug, tag) =>
    set((state) => {
      const note = state.notes[slug]
      if (note && !note.tags.includes(tag)) {
        note.tags.push(tag)
        note.modified = new Date().toISOString()
      }
    }),

  removeNoteTag: (slug, tag) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        note.tags = note.tags.filter((t) => t !== tag)
        note.modified = new Date().toISOString()
      }
    }),

  setNoteTags: (slug, tags) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        note.tags = tags
        note.modified = new Date().toISOString()
      }
    }),

  // Checklist operations
  addChecklistItem: (slug, content) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        const item = createChecklistItem(content)
        note.checklist.push(item)
        note.modified = new Date().toISOString()
      }
    }),

  updateChecklistItem: (slug, itemId, content) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        const item = note.checklist.find((i) => i.id === itemId)
        if (item) {
          item.content = content
          note.modified = new Date().toISOString()
        }
      }
    }),

  toggleChecklistItem: (slug, itemId, location) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        const index = note.checklist.findIndex((i) => i.id === itemId)
        if (index !== -1) {
          const item = note.checklist[index]
          if (item.status === 'pending') {
            note.checklist[index] = completeChecklistItem(item, location)
          } else {
            note.checklist[index] = uncompleteChecklistItem(item)
          }
          note.modified = new Date().toISOString()
        }
      }
    }),

  deleteChecklistItem: (slug, itemId) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        note.checklist = note.checklist.filter((i) => i.id !== itemId)
        note.modified = new Date().toISOString()
      }
    }),

  reorderChecklistItems: (slug, itemIds) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        // Reorder based on itemIds array
        const reordered: ChecklistItem[] = []
        itemIds.forEach((id) => {
          const item = note.checklist.find((i) => i.id === id)
          if (item) {
            reordered.push(item)
          }
        })
        note.checklist = reordered
        note.modified = new Date().toISOString()
      }
    }),

  // Linked items
  addLinkedItem: (slug, item) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        // Check if already linked
        const exists = note.linkedItems.some(
          (li) => li.type === item.type && li.slug === item.slug
        )
        if (!exists) {
          note.linkedItems.push(item)
          note.modified = new Date().toISOString()
        }
      }
    }),

  removeLinkedItem: (slug, itemSlug) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        note.linkedItems = note.linkedItems.filter((item) => item.slug !== itemSlug)
        note.modified = new Date().toISOString()
      }
    }),

  // Pin/unpin
  togglePin: (slug) =>
    set((state) => {
      const note = state.notes[slug]
      if (note) {
        note.pinned = !note.pinned
        note.modified = new Date().toISOString()
      }
    })
})

import { StateCreator } from 'zustand'
import { AppStore } from '..'

export interface EntityField {
  name: string
  value: string
  type: 'text' | 'number' | 'date' | 'textarea'
}

export interface EntityNote {
  id: string
  content: string
  type: 'general' | 'checklist'
  checklistItems?: ChecklistItem[]
  created: string
  modified: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  completedAt?: string
  completedIn?: {
    book: string
    chapter: string
    line: number
  }
}

export interface EntityRelation {
  id: string
  targetEntitySlug: string
  type: string
  description?: string
}

export interface Entity {
  slug: string
  type: 'person' | 'place' | 'custom'
  name: string
  fields: EntityField[]
  defaultField: string
  notes: EntityNote[]
  relations: EntityRelation[]
  metadata: {
    created: string
    modified: string
    usageCount: number
    usageLocations: Array<{
      book: string
      chapter: string
      line: number
      context: string
    }>
  }
}

export interface EntitySlice {
  entities: Record<string, Entity>
  selectedEntitySlug: string | null
  isLoadingEntities: boolean

  // CRUD operations
  addEntity: (entity: Entity) => void
  updateEntity: (slug: string, updates: Partial<Entity>) => void
  deleteEntity: (slug: string) => void
  getEntity: (slug: string) => Entity | undefined
  selectEntity: (slug: string | null) => void

  // File operations
  loadAllEntities: (workspacePath: string) => Promise<void>
  saveEntityToDisk: (workspacePath: string, slug: string) => Promise<void>
  deleteEntityFromDisk: (workspacePath: string, slug: string) => Promise<void>

  // Field management
  addEntityField: (slug: string, field: EntityField) => void
  updateEntityField: (slug: string, fieldIndex: number, updates: Partial<EntityField>) => void
  removeEntityField: (slug: string, fieldIndex: number) => void
  reorderEntityFields: (slug: string, fromIndex: number, toIndex: number) => void

  // Relations
  addEntityRelation: (slug: string, relation: EntityRelation) => void
  updateEntityRelation: (slug: string, relationId: string, updates: Partial<EntityRelation>) => void
  deleteEntityRelation: (slug: string, relationId: string) => void

  // Notes
  addEntityNote: (slug: string, note: EntityNote) => void
  updateEntityNote: (slug: string, noteId: string, updates: Partial<EntityNote>) => void
  deleteEntityNote: (slug: string, noteId: string) => void

  // Checklist items
  addChecklistItem: (slug: string, noteId: string, item: ChecklistItem) => void
  updateChecklistItem: (slug: string, noteId: string, itemId: string, updates: Partial<ChecklistItem>) => void
  deleteChecklistItem: (slug: string, noteId: string, itemId: string) => void
  toggleChecklistItem: (slug: string, noteId: string, itemId: string) => void

  // Usage tracking
  updateEntityUsage: (slug: string, usageData: { book: string; chapter: string; line: number; context: string }[]) => void
  incrementEntityUsage: (slug: string) => void
}

export const createEntitySlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  EntitySlice
> = (set, get) => ({
  entities: {},
  selectedEntitySlug: null,
  isLoadingEntities: false,

  // CRUD operations
  addEntity: (entity) =>
    set((state) => {
      state.entities[entity.slug] = entity
    }),

  updateEntity: (slug, updates) =>
    set((state) => {
      if (state.entities[slug]) {
        Object.assign(state.entities[slug], updates)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  deleteEntity: (slug) =>
    set((state) => {
      delete state.entities[slug]
      if (state.selectedEntitySlug === slug) {
        state.selectedEntitySlug = null
      }
    }),

  getEntity: (slug) => get().entities[slug],

  selectEntity: (slug) =>
    set((state) => {
      state.selectedEntitySlug = slug
    }),

  // File operations
  loadAllEntities: async (workspacePath) => {
    set((state) => {
      state.isLoadingEntities = true
    })

    try {
      // Import dynamically to avoid circular dependencies
      const { loadAllEntities } = await import('@renderer/lib/entities')
      const entities = await loadAllEntities(workspacePath)

      set((state) => {
        state.entities = entities
        state.isLoadingEntities = false
      })
    } catch (error) {
      console.error('Failed to load entities:', error)
      set((state) => {
        state.isLoadingEntities = false
      })
      throw error
    }
  },

  saveEntityToDisk: async (workspacePath, slug) => {
    const entity = get().entities[slug]
    if (!entity) {
      throw new Error(`Entity ${slug} not found`)
    }

    const { saveEntity } = await import('@renderer/lib/entities')
    await saveEntity(workspacePath, entity)
  },

  deleteEntityFromDisk: async (workspacePath, slug) => {
    const { deleteEntity: deleteEntityFile } = await import('@renderer/lib/entities')
    await deleteEntityFile(workspacePath, slug)

    // Remove from store
    set((state) => {
      delete state.entities[slug]
      if (state.selectedEntitySlug === slug) {
        state.selectedEntitySlug = null
      }
    })
  },

  // Field management
  addEntityField: (slug, field) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].fields.push(field)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  updateEntityField: (slug, fieldIndex, updates) =>
    set((state) => {
      if (state.entities[slug] && state.entities[slug].fields[fieldIndex]) {
        Object.assign(state.entities[slug].fields[fieldIndex], updates)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  removeEntityField: (slug, fieldIndex) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].fields.splice(fieldIndex, 1)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  reorderEntityFields: (slug, fromIndex, toIndex) =>
    set((state) => {
      if (state.entities[slug]) {
        const [field] = state.entities[slug].fields.splice(fromIndex, 1)
        state.entities[slug].fields.splice(toIndex, 0, field)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  // Relations
  addEntityRelation: (slug, relation) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].relations.push(relation)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  updateEntityRelation: (slug, relationId, updates) =>
    set((state) => {
      if (state.entities[slug]) {
        const relationIndex = state.entities[slug].relations.findIndex((r) => r.id === relationId)
        if (relationIndex !== -1) {
          Object.assign(state.entities[slug].relations[relationIndex], updates)
          state.entities[slug].metadata.modified = new Date().toISOString()
        }
      }
    }),

  deleteEntityRelation: (slug, relationId) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].relations = state.entities[slug].relations.filter((r) => r.id !== relationId)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  // Notes
  addEntityNote: (slug, note) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].notes.push(note)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  updateEntityNote: (slug, noteId, updates) =>
    set((state) => {
      if (state.entities[slug]) {
        const noteIndex = state.entities[slug].notes.findIndex((n) => n.id === noteId)
        if (noteIndex !== -1) {
          Object.assign(state.entities[slug].notes[noteIndex], updates)
          state.entities[slug].notes[noteIndex].modified = new Date().toISOString()
          state.entities[slug].metadata.modified = new Date().toISOString()
        }
      }
    }),

  deleteEntityNote: (slug, noteId) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].notes = state.entities[slug].notes.filter((n) => n.id !== noteId)
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  // Checklist items
  addChecklistItem: (slug, noteId, item) =>
    set((state) => {
      if (state.entities[slug]) {
        const note = state.entities[slug].notes.find((n) => n.id === noteId)
        if (note && note.type === 'checklist') {
          if (!note.checklistItems) {
            note.checklistItems = []
          }
          note.checklistItems.push(item)
          note.modified = new Date().toISOString()
          state.entities[slug].metadata.modified = new Date().toISOString()
        }
      }
    }),

  updateChecklistItem: (slug, noteId, itemId, updates) =>
    set((state) => {
      if (state.entities[slug]) {
        const note = state.entities[slug].notes.find((n) => n.id === noteId)
        if (note?.checklistItems) {
          const itemIndex = note.checklistItems.findIndex((i) => i.id === itemId)
          if (itemIndex !== -1) {
            Object.assign(note.checklistItems[itemIndex], updates)
            note.modified = new Date().toISOString()
            state.entities[slug].metadata.modified = new Date().toISOString()
          }
        }
      }
    }),

  deleteChecklistItem: (slug, noteId, itemId) =>
    set((state) => {
      if (state.entities[slug]) {
        const note = state.entities[slug].notes.find((n) => n.id === noteId)
        if (note?.checklistItems) {
          note.checklistItems = note.checklistItems.filter((i) => i.id !== itemId)
          note.modified = new Date().toISOString()
          state.entities[slug].metadata.modified = new Date().toISOString()
        }
      }
    }),

  toggleChecklistItem: (slug, noteId, itemId) =>
    set((state) => {
      if (state.entities[slug]) {
        const note = state.entities[slug].notes.find((n) => n.id === noteId)
        if (note?.checklistItems) {
          const item = note.checklistItems.find((i) => i.id === itemId)
          if (item) {
            item.completed = !item.completed
            item.completedAt = item.completed ? new Date().toISOString() : undefined
            note.modified = new Date().toISOString()
            state.entities[slug].metadata.modified = new Date().toISOString()
          }
        }
      }
    }),

  // Usage tracking
  updateEntityUsage: (slug, usageData) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].metadata.usageLocations = usageData
        state.entities[slug].metadata.usageCount = usageData.length
        state.entities[slug].metadata.modified = new Date().toISOString()
      }
    }),

  incrementEntityUsage: (slug) =>
    set((state) => {
      if (state.entities[slug]) {
        state.entities[slug].metadata.usageCount += 1
      }
    }),
})

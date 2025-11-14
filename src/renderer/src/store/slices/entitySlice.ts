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
  addEntity: (entity: Entity) => void
  updateEntity: (slug: string, updates: Partial<Entity>) => void
  deleteEntity: (slug: string) => void
  getEntity: (slug: string) => Entity | undefined
  selectEntity: (slug: string | null) => void
  addEntityNote: (slug: string, note: EntityNote) => void
  updateEntityNote: (slug: string, noteId: string, updates: Partial<EntityNote>) => void
  deleteEntityNote: (slug: string, noteId: string) => void
}

export const createEntitySlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  EntitySlice
> = (set, get) => ({
  entities: {},
  selectedEntitySlug: null,

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
})

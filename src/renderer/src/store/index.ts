/**
 * App Store - Single Monolithic Zustand Store
 *
 * All slices are combined into one store so cross-slice access via get()
 * (e.g. auto-save reading workspacePath + extendedEditorSettings) works.
 *
 * Persistence is handled outside the store:
 * - App settings → SettingsPersistence component (userData/store/app-settings.json)
 * - Workspace content → explicit *ToDisk actions writing into the workspace folder
 */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createWorkspaceSlice, WorkspaceSlice } from './slices/workspaceSlice'
import { createUISlice, UISlice } from './slices/uiSlice'
import { createBooksSlice, BooksSlice } from './slices/booksSlice'
import { createEntitySlice, EntitySlice } from './slices/entitySlice'
import { createImageSlice, ImageSlice } from './slices/imageSlice'
import { createNoteSlice, NoteSlice } from './slices/noteSlice'
import { createAISlice, AISlice } from './slices/aiSlice'
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice'
import { createProviderConfigSlice, ProviderConfigSlice } from './slices/providerConfigSlice'

export type AppStore = WorkspaceSlice &
  UISlice &
  BooksSlice &
  EntitySlice &
  ImageSlice &
  NoteSlice &
  AISlice &
  SettingsSlice &
  ProviderConfigSlice

export const useStore = create<AppStore>()(
  devtools(
    immer((...a) => ({
      ...createWorkspaceSlice(...a),
      ...createUISlice(...a),
      ...createBooksSlice(...a),
      ...createEntitySlice(...a),
      ...createImageSlice(...a),
      ...createNoteSlice(...a),
      ...createProviderConfigSlice(...a),
      ...createAISlice(...a),
      ...createSettingsSlice(...a)
    })),
    { name: 'BookCrafterStore' }
  )
)

// Re-export slice types for convenience
export type { WorkspaceSlice } from './slices/workspaceSlice'
export type { UISlice } from './slices/uiSlice'
export type { BooksSlice } from './slices/booksSlice'
export type { EntitySlice } from './slices/entitySlice'
export type { ImageSlice } from './slices/imageSlice'
export type { NoteSlice } from './slices/noteSlice'
export type { AISlice } from './slices/aiSlice'
export type { SettingsSlice } from './slices/settingsSlice'
export type { ProviderConfigSlice } from './slices/providerConfigSlice'

// Re-export UI types from uiSlice
export type { PanelId, TabMetadata, TabEditorData, TabPanelData, TabType } from './slices/uiSlice'

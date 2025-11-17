/**
 * Legacy Store Export (Deprecated)
 *
 * This file maintains backward compatibility with the old monolithic store.
 * New code should use the feature-based stores instead:
 * - useCoreStore: Workspace + UI (theme, dialogs)
 * - useContentStore: Books + Entities + Images + Notes
 * - useToolsStore: AI + Settings
 * - useSidebarStore: Sidebar state management
 *
 * @deprecated Use feature-based stores for new code
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { StateCreator } from 'zustand'

// Import slices
import { createWorkspaceSlice, WorkspaceSlice } from './slices/workspaceSlice'
import { createEntitySlice, EntitySlice } from './slices/entitySlice'
import { createBooksSlice, BooksSlice } from './slices/booksSlice'
import { createUISlice, UISlice } from './slices/uiSlice'
import { createImageSlice, ImageSlice } from './slices/imageSlice'
import { createNoteSlice, NoteSlice } from './slices/noteSlice'
import { createAISlice, AISlice } from './slices/aiSlice'
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice'

// Combined store type
export type AppStore = WorkspaceSlice & EntitySlice & BooksSlice & UISlice & ImageSlice & NoteSlice & AISlice & SettingsSlice

// Type-safe StateCreator
type AppStateCreator<T> = StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  T
>

export const useStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get, api) => ({
        ...createWorkspaceSlice(set as AppStateCreator<WorkspaceSlice>, get, api),
        ...createEntitySlice(set as AppStateCreator<EntitySlice>, get, api),
        ...createBooksSlice(set as AppStateCreator<BooksSlice>, get, api),
        ...createUISlice(set as AppStateCreator<UISlice>, get, api),
        ...createImageSlice(set as AppStateCreator<ImageSlice>, get, api),
        ...createNoteSlice(set as AppStateCreator<NoteSlice>, get, api),
        ...createAISlice(set as AppStateCreator<AISlice>, get, api),
        ...createSettingsSlice(set as AppStateCreator<SettingsSlice>, get, api)
      })),
      {
        name: 'book-crafter-storage',
        partialize: (state) => ({
          // Only persist workspace config, UI preferences, AI config, and settings
          workspaceConfig: state.workspaceConfig,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          config: state.config, // AI config (current active)
          ollamaConfig: state.ollamaConfig, // Ollama specific config
          openaiConfig: state.openaiConfig, // OpenAI specific config
          anthropicConfig: state.anthropicConfig, // Anthropic specific config
          customPrompts: state.customPrompts, // Custom AI prompts
          suggestions: state.suggestions, // AI suggestions history
          generalSettings: state.generalSettings, // General settings
          extendedEditorSettings: state.extendedEditorSettings, // Editor settings
          aiPreferences: state.aiPreferences, // AI preferences
          workspacePreferences: state.workspacePreferences, // Workspace preferences
          keyboardShortcuts: state.keyboardShortcuts, // Keyboard shortcuts
          advancedSettings: state.advancedSettings // Advanced settings
        })
      }
    ),
    { name: 'BookCrafter' }
  )
)

// Re-export new feature-based stores
export { useCoreStore, type CoreStore } from './coreStore'
export { useContentStore, type ContentStore } from './contentStore'
export { useToolsStore, type ToolsStore } from './toolsStore'
export { useSidebarStore, type SidebarState } from './sidebarStore'
export type { PanelId } from './sidebarStore'

// Re-export slice types for convenience
export type { WorkspaceSlice } from './slices/workspaceSlice'
export type { EntitySlice } from './slices/entitySlice'
export type { BooksSlice } from './slices/booksSlice'
export type { UISlice } from './slices/uiSlice'
export type { ImageSlice } from './slices/imageSlice'
export type { NoteSlice } from './slices/noteSlice'
export type { AISlice } from './slices/aiSlice'
export type { SettingsSlice } from './slices/settingsSlice'

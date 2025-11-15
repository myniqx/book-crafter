import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

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

export const useStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get, api) => ({
        ...createWorkspaceSlice(set, get, api),
        ...createEntitySlice(set, get, api),
        ...createBooksSlice(set, get, api),
        ...createUISlice(set, get, api),
        ...createImageSlice(set, get, api),
        ...createNoteSlice(set, get, api),
        ...createAISlice(set as any, get, api as any),
        ...createSettingsSlice(set as any, get, api as any),
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
          advancedSettings: state.advancedSettings, // Advanced settings
        }),
      }
    ),
    { name: 'BookCrafter' }
  )
)

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Import slices
import { createAISlice, AISlice } from './slices/aiSlice'
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice'

// Tools store type (AI + Settings)
export type ToolsStore = AISlice & SettingsSlice

export const useToolsStore = create<ToolsStore>()(
  devtools(
    persist(
      immer((set, get, api) => ({
        ...createAISlice(set as never, get as never, api as never),
        ...createSettingsSlice(set as never, get as never, api as never)
      })),
      {
        name: 'tools-storage',
        partialize: (state) => ({
          // Persist AI configs and settings
          config: state.config,
          ollamaConfig: state.ollamaConfig,
          openaiConfig: state.openaiConfig,
          anthropicConfig: state.anthropicConfig,
          customPrompts: state.customPrompts,
          suggestions: state.suggestions,
          generalSettings: state.generalSettings,
          extendedEditorSettings: state.extendedEditorSettings,
          aiPreferences: state.aiPreferences,
          workspacePreferences: state.workspacePreferences,
          keyboardShortcuts: state.keyboardShortcuts,
          advancedSettings: state.advancedSettings
        })
      }
    ),
    { name: 'ToolsStore' }
  )
)

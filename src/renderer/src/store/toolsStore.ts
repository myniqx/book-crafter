import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Import slices
import { createAISlice, AISlice } from './slices/aiSlice'
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice'

// Tools store type (AI + Settings)
export type ToolsStore = AISlice & SettingsSlice

export const useToolsStore = create<ToolsStore>()(
  devtools(
    immer((set, get, api) => ({
      ...createAISlice(set as never, get as never, api as never),
      ...createSettingsSlice(set as never, get as never, api as never)
    })),
    { name: 'ToolsStore' }
  )
)

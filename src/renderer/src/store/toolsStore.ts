import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createAISlice, AISlice } from './slices/aiSlice'
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice'
import { createProviderConfigSlice, ProviderConfigSlice } from './slices/providerConfigSlice'

export type ToolsStore = AISlice & SettingsSlice & ProviderConfigSlice

export const useToolsStore = create<ToolsStore>()(
  devtools(
    immer((set, get, api) => ({
      ...createProviderConfigSlice(set as never, get as never, api as never),
      ...createAISlice(set as never, get as never, api as never),
      ...createSettingsSlice(set as never, get as never, api as never)
    })),
    { name: 'ToolsStore' }
  )
)

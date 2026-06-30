import { StateCreator } from 'zustand'
import { type AIConfig, type AIProvider, DEFAULT_AI_CONFIGS } from '@renderer/lib/ai/types'

export interface ProviderConfigSlice {
  providerConfigs: Record<AIProvider, AIConfig>
  activeProvider: AIProvider

  getActiveConfig: () => AIConfig
  setActiveProvider: (provider: AIProvider) => void
  setProviderConfig: (provider: AIProvider, config: Partial<AIConfig>) => void
  setAllProviderConfigs: (configs: Record<AIProvider, AIConfig>) => void
}

export const createProviderConfigSlice: StateCreator<
  ProviderConfigSlice,
  [['zustand/immer', never]],
  [],
  ProviderConfigSlice
> = (set, get) => ({
  providerConfigs: { ...DEFAULT_AI_CONFIGS },
  activeProvider: 'ollama',

  getActiveConfig: () => {
    const { providerConfigs, activeProvider } = get()
    return providerConfigs[activeProvider]
  },

  setActiveProvider: (provider) => {
    if (!provider) return
    set((state) => {
      state.activeProvider = provider
    })
  },

  setProviderConfig: (provider, config) => {
    set((state) => {
      state.providerConfigs[provider] = { ...state.providerConfigs[provider], ...config }
    })
  },

  setAllProviderConfigs: (configs) => {
    set((state) => {
      state.providerConfigs = { ...DEFAULT_AI_CONFIGS, ...configs }
    })
  }
})

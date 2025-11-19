import { StateCreator } from 'zustand'
import { AppStore } from '..'
import { fs } from '@renderer/lib/ipc'

export interface WorkspaceConfig {
  projectName: string
  version: string
  author: string
  created: string
  modified?: string
  aiConfig: {
    provider: 'ollama' | 'openai' | 'anthropic'
    ollamaEndpoint?: string
    ollamaModel?: string
    openaiApiKey?: string
    openaiModel?: string
    anthropicApiKey?: string
    anthropicModel?: string
    features: {
      grammar: boolean
      expand: boolean
      summarize: boolean
      chat: boolean
    }
  }
  editorSettings: {
    fontSize: number
    lineHeight?: number
    tabSize: number
    wordWrap: boolean
    minimap: boolean
    lineNumbers?: boolean
    autoSave: boolean
    autoSaveDelay: number
  }
}

export interface WorkspaceSlice {
  workspaceConfig: WorkspaceConfig | null
  workspacePath: string | null
  isWorkspaceLoaded: boolean
  hasUnsavedChanges: boolean
  setWorkspaceConfig: (config: WorkspaceConfig) => void
  setWorkspacePath: (path: string) => void
  setHasUnsavedChanges: (value: boolean) => void
  loadWorkspace: (path: string) => Promise<void>
  saveWorkspace: () => Promise<void>
  createNewWorkspace: (name: string, author: string) => WorkspaceConfig
}

const defaultWorkspaceConfig: WorkspaceConfig = {
  projectName: 'Untitled Project',
  version: '1.0.0',
  author: '',
  created: new Date().toISOString(),
  aiConfig: {
    provider: 'ollama',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama2',
    features: {
      grammar: true,
      expand: true,
      summarize: true,
      chat: true,
    },
  },
  editorSettings: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: true,
    autoSave: true,
    autoSaveDelay: 1000,
  },
}

export const createWorkspaceSlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  WorkspaceSlice
> = (set, get) => ({
  workspaceConfig: null,
  workspacePath: null,
  isWorkspaceLoaded: false,
  hasUnsavedChanges: false,

  setWorkspaceConfig: (config) =>
    set((state) => {
      state.workspaceConfig = config
    }),

  setWorkspacePath: (path) =>
    set((state) => {
      state.workspacePath = path
    }),

  setHasUnsavedChanges: (value) =>
    set((state) => {
      state.hasUnsavedChanges = value
    }),

  loadWorkspace: async (path: string) => {
    try {
      // Check if config file exists
      const configPath = `${path}/book-crafter.json`
      const exists = await fs.exists(configPath)

      if (!exists) {
        throw new Error('Not a valid Book Crafter workspace')
      }

      // Read and parse config
      const configContent = await fs.readFile(configPath, 'utf-8')
      const config = JSON.parse(configContent) as WorkspaceConfig

      // Update store
      set((state) => {
        state.workspaceConfig = config
        state.workspacePath = path
        state.isWorkspaceLoaded = true
        state.hasUnsavedChanges = false
      })

      console.log('[WorkspaceSlice] Loaded workspace:', config.projectName)
    } catch (error) {
      console.error('[WorkspaceSlice] Failed to load workspace:', error)
      throw error
    }
  },

  saveWorkspace: async () => {
    // This will be implemented with IPC later
    console.log('Saving workspace...', get().workspaceConfig)
  },

  createNewWorkspace: (name: string, author: string) => {
    const config: WorkspaceConfig = {
      ...defaultWorkspaceConfig,
      projectName: name,
      author,
      created: new Date().toISOString(),
    }
    set((state) => {
      state.workspaceConfig = config
    })
    return config
  },
})

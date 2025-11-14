import { StateCreator } from 'zustand'
import { AppStore } from '..'

export interface WorkspaceConfig {
  projectName: string
  version: string
  author: string
  created: string
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
    tabSize: number
    wordWrap: boolean
    minimap: boolean
    autoSave: boolean
    autoSaveDelay: number
  }
}

export interface WorkspaceSlice {
  workspaceConfig: WorkspaceConfig | null
  workspacePath: string | null
  isWorkspaceLoaded: boolean
  setWorkspaceConfig: (config: WorkspaceConfig) => void
  setWorkspacePath: (path: string) => void
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
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  WorkspaceSlice
> = (set, get) => ({
  workspaceConfig: null,
  workspacePath: null,
  isWorkspaceLoaded: false,

  setWorkspaceConfig: (config) =>
    set((state) => {
      state.workspaceConfig = config
    }),

  setWorkspacePath: (path) =>
    set((state) => {
      state.workspacePath = path
    }),

  loadWorkspace: async (path: string) => {
    // This will be implemented with IPC later
    set((state) => {
      state.workspacePath = path
      state.isWorkspaceLoaded = true
    })
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

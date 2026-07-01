import { StateCreator } from 'zustand'
import type { AppStore } from '..'
import { fs } from '@renderer/lib/ipc'
import { logger } from '@renderer/lib/logger'

export interface WorkspaceConfig {
  projectName: string
  version: string
  author: string
  created: string
  modified?: string
}

export interface WorkspaceSlice {
  workspaceConfig: WorkspaceConfig | null
  workspacePath: string | null
  isWorkspaceLoaded: boolean
  hasUnsavedChanges: boolean
  setWorkspaceConfig: (config: WorkspaceConfig) => void
  setWorkspacePath: (path: string) => void
  setHasUnsavedChanges: (value: boolean) => void
  closeWorkspace: () => void
  loadWorkspace: (path: string) => Promise<void>
  saveWorkspace: () => Promise<void>
  createNewWorkspace: (name: string, author: string) => WorkspaceConfig
}

const defaultWorkspaceConfig: WorkspaceConfig = {
  projectName: 'Untitled Project',
  version: '1.0.0',
  author: '',
  created: new Date().toISOString(),
}

export const createWorkspaceSlice: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
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

  closeWorkspace: () => {
    get()._cleanupTimers()
    set((state) => {
      state.workspaceConfig = null
      state.workspacePath = null
      state.isWorkspaceLoaded = false
      state.hasUnsavedChanges = false
    })
  },

  loadWorkspace: async (path: string) => {
    get()._cleanupTimers()
    try {
      const configPath = `${path}/book-crafter.json`
      const exists = await fs.exists(configPath)

      if (!exists) {
        throw new Error('Not a valid Book Crafter workspace')
      }

      const configContent = await fs.readFile(configPath, 'utf-8')
      const raw = JSON.parse(configContent) as Record<string, unknown>
      const config: WorkspaceConfig = {
        projectName: typeof raw.projectName === 'string' ? raw.projectName : 'Untitled Project',
        version: typeof raw.version === 'string' ? raw.version : '1.0.0',
        author: typeof raw.author === 'string' ? raw.author : '',
        created: typeof raw.created === 'string' ? raw.created : new Date().toISOString(),
        modified: typeof raw.modified === 'string' ? raw.modified : undefined,
      }

      set((state) => {
        state.workspaceConfig = config
        state.workspacePath = path
        state.isWorkspaceLoaded = true
        state.hasUnsavedChanges = false
      })

      logger.info(`Loaded workspace: ${config.projectName}`, 'workspaceSlice')
    } catch (error) {
      logger.error('Failed to load workspace:', 'workspaceSlice', error)
      throw error
    }
  },

  saveWorkspace: async () => {
    const { workspacePath, workspaceConfig } = get()
    if (!workspacePath || !workspaceConfig) return
    const updated: WorkspaceConfig = { ...workspaceConfig, modified: new Date().toISOString() }
    await fs.writeFile(
      `${workspacePath}/book-crafter.json`,
      JSON.stringify(updated, null, 2)
    )
    set((state) => {
      state.workspaceConfig = updated
    })
    logger.info('Workspace saved', 'workspaceSlice')
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

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Import slices
import { createWorkspaceSlice, WorkspaceSlice } from './slices/workspaceSlice'
import { createUISlice, UISlice } from './slices/uiSlice'

// Core store type (Workspace + UI without sidebar state)
export type CoreStore = WorkspaceSlice & UISlice

export const useCoreStore = create<CoreStore>()(
  devtools(
    persist(
      immer((set, get, api) => ({
        ...createWorkspaceSlice(set as never, get as never, api as never),
        ...createUISlice(set as never, get as never, api as never)
      })),
      {
        name: 'core-storage',
        partialize: (state) => ({
          // Persist workspace config and UI preferences (except sidebar)
          workspaceConfig: state.workspaceConfig,
          theme: state.theme
        })
      }
    ),
    { name: 'CoreStore' }
  )
)

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Import slices
import { createWorkspaceSlice, WorkspaceSlice } from './slices/workspaceSlice'
import { createUISlice, UISlice } from './slices/uiSlice'

// Core store type (Workspace + UI without sidebar state)
export type CoreStore = WorkspaceSlice & UISlice

export const useCoreStore = create<CoreStore>()(
  devtools(
    immer((set, get, api) => ({
      ...createWorkspaceSlice(set as never, get as never, api as never),
      ...createUISlice(set as never, get as never, api as never)
    })),
    { name: 'CoreStore' }
  )
)

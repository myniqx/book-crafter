import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Import slices
import { createWorkspaceSlice, WorkspaceSlice } from './slices/workspaceSlice'
import { createEntitySlice, EntitySlice } from './slices/entitySlice'
import { createBooksSlice, BooksSlice } from './slices/booksSlice'
import { createUISlice, UISlice } from './slices/uiSlice'

// Combined store type
export type AppStore = WorkspaceSlice & EntitySlice & BooksSlice & UISlice

export const useStore = create<AppStore>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createWorkspaceSlice(...a),
        ...createEntitySlice(...a),
        ...createBooksSlice(...a),
        ...createUISlice(...a),
      })),
      {
        name: 'book-crafter-storage',
        partialize: (state) => ({
          // Only persist workspace config and UI preferences
          workspaceConfig: state.workspaceConfig,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'BookCrafter' }
  )
)

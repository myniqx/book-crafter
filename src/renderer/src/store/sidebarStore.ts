import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type PanelId =
  | 'file-explorer'
  | 'entity-browser'
  | 'image-gallery'
  | 'notes'
  | 'search'
  | 'ai-chat'
  | 'timeline'
  | 'markdown-preview'

export interface SidebarState {
  // Sidebar state
  activePanel: PanelId | null
  panelVisible: boolean
  sidebarWidth: number
  activityBarCollapsed: boolean

  // Actions
  selectPanel: (panelId: PanelId) => void
  togglePanel: (panelId: PanelId) => void
  closePanel: () => void
  setSidebarWidth: (width: number) => void
  toggleActivityBar: () => void
}

const DEFAULT_WIDTH = 250
const MIN_WIDTH = 200
const MAX_WIDTH = 400

export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        activePanel: 'file-explorer',
        panelVisible: true,
        sidebarWidth: DEFAULT_WIDTH,
        activityBarCollapsed: false,

        // Select and show panel
        selectPanel: (panelId) =>
          set((state) => {
            state.activePanel = panelId
            state.panelVisible = true
          }),

        // Toggle panel (if same panel clicked, close it)
        togglePanel: (panelId) =>
          set((state) => {
            if (state.activePanel === panelId) {
              // Same panel clicked - toggle visibility
              state.panelVisible = !state.panelVisible
            } else {
              // Different panel - switch to it
              state.activePanel = panelId
              state.panelVisible = true
            }
          }),

        // Close panel
        closePanel: () =>
          set((state) => {
            state.panelVisible = false
          }),

        // Set sidebar width (with constraints)
        setSidebarWidth: (width) =>
          set((state) => {
            const constrainedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
            state.sidebarWidth = constrainedWidth
          }),

        // Toggle activity bar collapse (for future use)
        toggleActivityBar: () =>
          set((state) => {
            state.activityBarCollapsed = !state.activityBarCollapsed
          })
      })),
      {
        name: 'sidebar-storage',
        partialize: (state) => ({
          activePanel: state.activePanel,
          panelVisible: state.panelVisible,
          sidebarWidth: state.sidebarWidth,
          activityBarCollapsed: state.activityBarCollapsed
        })
      }
    ),
    { name: 'SidebarStore' }
  )
)

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { PanelId } from './slices/uiSlice'

export type { PanelId }

export interface SidebarState {
  // Sidebar state
  activePanel: PanelId | null
  panelVisible: boolean
  sidebarWidth: number
  activityBarCollapsed: boolean

  // Legacy compatibility
  activePanels: PanelId[]
  sidebarCollapsed: boolean

  // Actions
  selectPanel: (panelId: PanelId) => void
  togglePanel: (panelId: PanelId) => void
  closePanel: () => void
  setSidebarWidth: (width: number) => void
  toggleActivityBar: () => void

  // Legacy actions
  toggleSidebar: () => void
  showPanel: (panelId: PanelId) => void
  hidePanel: (panelId: PanelId) => void
}

const DEFAULT_WIDTH = 250
const MIN_WIDTH = 200
const MAX_WIDTH = 400

export const useSidebarStore = create<SidebarState>()(
  devtools(
    immer((set) => ({
      // Initial state
      activePanel: 'file-explorer',
      panelVisible: true,
      sidebarWidth: DEFAULT_WIDTH,
      activityBarCollapsed: false,

      // Legacy state
      activePanels: ['file-explorer'],
      sidebarCollapsed: false,

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
        }),

      // Legacy actions
      toggleSidebar: () =>
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed
          state.panelVisible = !state.sidebarCollapsed
        }),

      showPanel: (panelId) =>
        set((state) => {
          if (!state.activePanels.includes(panelId)) {
            state.activePanels.push(panelId)
          }
          state.activePanel = panelId
          state.panelVisible = true
        }),

      hidePanel: (panelId) =>
        set((state) => {
          const index = state.activePanels.indexOf(panelId)
          if (index !== -1) {
            state.activePanels.splice(index, 1)
          }
          if (state.activePanel === panelId) {
            state.panelVisible = false
          }
        })
    })),
    { name: 'SidebarStore' }
  )
)

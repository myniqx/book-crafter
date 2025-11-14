import { StateCreator } from 'zustand'
import { AppStore } from '..'

export type Theme = 'light' | 'dark' | 'system'
export type PanelId = 'file-explorer' | 'entity-browser' | 'entity-detail' | 'image-gallery' | 'image-detail' | 'notes' | 'ai-chat' | 'search' | 'timeline' | 'markdown-preview'

export interface UISlice {
  theme: Theme
  sidebarCollapsed: boolean
  activePanels: PanelId[]
  panelSizes: Record<string, number>
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  togglePanel: (panelId: PanelId) => void
  setPanelSize: (panelId: string, size: number) => void
  showPanel: (panelId: PanelId) => void
  hidePanel: (panelId: PanelId) => void
}

export const createUISlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  UISlice
> = (set) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  activePanels: ['file-explorer', 'entity-browser'],
  panelSizes: {
    'file-explorer': 250,
    'entity-browser': 300,
    'markdown-preview': 50, // percentage
  },

  setTheme: (theme) =>
    set((state) => {
      state.theme = theme
    }),

  toggleSidebar: () =>
    set((state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    }),

  setSidebarCollapsed: (collapsed) =>
    set((state) => {
      state.sidebarCollapsed = collapsed
    }),

  togglePanel: (panelId) =>
    set((state) => {
      const index = state.activePanels.indexOf(panelId)
      if (index !== -1) {
        state.activePanels.splice(index, 1)
      } else {
        state.activePanels.push(panelId)
      }
    }),

  setPanelSize: (panelId, size) =>
    set((state) => {
      state.panelSizes[panelId] = size
    }),

  showPanel: (panelId) =>
    set((state) => {
      if (!state.activePanels.includes(panelId)) {
        state.activePanels.push(panelId)
      }
    }),

  hidePanel: (panelId) =>
    set((state) => {
      const index = state.activePanels.indexOf(panelId)
      if (index !== -1) {
        state.activePanels.splice(index, 1)
      }
    }),
})

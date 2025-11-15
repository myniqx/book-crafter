import { StateCreator } from 'zustand'
import { AppStore } from '..'

export type Theme = 'light' | 'dark' | 'system'
export type PanelId =
  | 'file-explorer'
  | 'entity-browser'
  | 'entity-detail'
  | 'image-gallery'
  | 'image-detail'
  | 'notes'
  | 'ai-chat'
  | 'ai-suggestions'
  | 'search'
  | 'timeline'
  | 'markdown-preview'

export interface UISlice {
  theme: Theme
  sidebarCollapsed: boolean
  activePanels: PanelId[]
  panelSizes: Record<string, number>
  // Dialog states
  createBookDialogOpen: boolean
  createEntityDialogOpen: boolean
  createNoteDialogOpen: boolean
  settingsDialogOpen: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  togglePanel: (panelId: PanelId) => void
  setPanelSize: (panelId: string, size: number) => void
  showPanel: (panelId: PanelId) => void
  hidePanel: (panelId: PanelId) => void
  // Dialog controls
  setCreateBookDialogOpen: (open: boolean) => void
  setCreateEntityDialogOpen: (open: boolean) => void
  setCreateNoteDialogOpen: (open: boolean) => void
  setSettingsDialogOpen: (open: boolean) => void
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
    'markdown-preview': 50 // percentage
  },
  // Dialog states
  createBookDialogOpen: false,
  createEntityDialogOpen: false,
  createNoteDialogOpen: false,
  settingsDialogOpen: false,

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

  // Dialog controls
  setCreateBookDialogOpen: (open) =>
    set((state) => {
      state.createBookDialogOpen = open
    }),

  setCreateEntityDialogOpen: (open) =>
    set((state) => {
      state.createEntityDialogOpen = open
    }),

  setCreateNoteDialogOpen: (open) =>
    set((state) => {
      state.createNoteDialogOpen = open
    }),

  setSettingsDialogOpen: (open) =>
    set((state) => {
      state.settingsDialogOpen = open
    })
})

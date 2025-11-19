import { StateCreator } from 'zustand'
import { AppStore } from '..'

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

/**
 * Tab Type System
 * Defines all possible tab types that can be opened in DockLayout
 */
export type TabType = 'editor' | 'panel'

/**
 * Tab Metadata
 * Generic structure for all tabs in DockLayout
 * This is the single source of truth for tab state
 */
export interface TabMetadata {
  /** Unique identifier for the tab (e.g., 'editor-book1-chapter1') */
  id: string

  /** Type of the tab */
  type: TabType

  /** Display title */
  title: string

  /** Whether the tab can be closed */
  closable: boolean

  /** Type-specific data */
  data?: TabEditorData | TabPanelData
}

/**
 * Editor Tab Data
 * For chapter/document editors
 */
export interface TabEditorData {
  bookSlug: string
  chapterSlug: string
}

/**
 * Panel Tab Data
 * For fixed panels (entity-detail, image-detail, etc.)
 */
export interface TabPanelData {
  panelId: PanelId
}

export interface UISlice {
  sidebarCollapsed: boolean
  activePanels: PanelId[]
  panelSizes: Record<string, number>

  /**
   * DockLayout Tab Management
   * SINGLE SOURCE OF TRUTH for all open tabs
   * This array MUST always reflect the actual state of DockLayout
   */
  openTabs: TabMetadata[]

  /**
   * Active tab ID (currently focused tab)
   */
  activeTabId: string | null

  // Dialog states
  createBookDialogOpen: boolean
  createEntityDialogOpen: boolean
  createNoteDialogOpen: boolean
  settingsDialogOpen: boolean

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  togglePanel: (panelId: PanelId) => void
  setPanelSize: (panelId: string, size: number) => void
  showPanel: (panelId: PanelId) => void
  hidePanel: (panelId: PanelId) => void

  /**
   * Tab Management Actions
   * These actions update the store, which then syncs to DockLayout via useEffect
   */

  /**
   * Open a new tab or activate existing one
   * Store → DockLayout sync happens automatically
   */
  openTab: (metadata: TabMetadata) => void

  /**
   * Close a tab by ID
   * Store → DockLayout sync happens automatically
   */
  closeTab: (tabId: string) => void

  /**
   * Set the active (focused) tab
   * Store → DockLayout sync happens automatically
   */
  setActiveTab: (tabId: string | null) => void

  /**
   * INTERNAL: Sync tabs from DockLayout to Store
   * Called by DockLayout when user manually closes/reorders tabs
   * This is the DockLayout → Store sync mechanism
   */
  syncTabsFromDockLayout: (tabs: TabMetadata[], activeTabId: string | null) => void

  /**
   * Helper: Check if a tab is currently open
   */
  isTabOpen: (tabId: string) => boolean

  /**
   * Helper: Get all tabs of a specific type
   */
  getTabsByType: (type: TabMetadata['type']) => TabMetadata[]

  // Dialog controls
  setCreateBookDialogOpen: (open: boolean) => void
  setCreateEntityDialogOpen: (open: boolean) => void
  setCreateNoteDialogOpen: (open: boolean) => void
  setSettingsDialogOpen: (open: boolean) => void
}

export const createUISlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  UISlice
> = (set, get) => ({
  sidebarCollapsed: false,
  activePanels: ['file-explorer', 'entity-browser'],
  panelSizes: {
    'file-explorer': 250,
    'entity-browser': 300,
    'markdown-preview': 50 // percentage
  },

  // Tab management state
  openTabs: [],
  activeTabId: null,

  // Dialog states
  createBookDialogOpen: false,
  createEntityDialogOpen: false,
  createNoteDialogOpen: false,
  settingsDialogOpen: false,

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
    }),

  /**
   * TAB MANAGEMENT ACTIONS
   * =====================
   * These actions modify the store, which triggers DockLayout sync via useEffect
   */

  /**
   * Open a tab (or activate if already open)
   * FLOW: Component calls openTab() → Store updates → DockLayout useEffect detects change → DockLayout adds tab
   */
  openTab: (metadata) =>
    set((state) => {
      // Check if tab already exists
      const existingIndex = state.openTabs.findIndex((t) => t.id === metadata.id)

      if (existingIndex !== -1) {
        // Tab exists, just activate it
        state.activeTabId = metadata.id
        console.log('[Store] Tab already open, activating:', metadata.id)
      } else {
        // Create new array reference to trigger React re-render (immer workaround)
        state.openTabs = [...state.openTabs, metadata]
        state.activeTabId = metadata.id
        console.log('[Store] Opening new tab:', metadata.id)
      }
    }),

  /**
   * Close a tab by ID
   * FLOW: Component calls closeTab() → Store updates → DockLayout useEffect detects change → DockLayout removes tab
   */
  closeTab: (tabId) =>
    set((state) => {
      console.log('[Store] Closing tab:', tabId)

      // Create new array reference (immer workaround)
      state.openTabs = state.openTabs.filter((t) => t.id !== tabId)

      // If active tab was closed, set active to last tab or null
      if (state.activeTabId === tabId) {
        state.activeTabId = state.openTabs.length > 0 ? state.openTabs[state.openTabs.length - 1].id : null
        console.log('[Store] Active tab closed, new active:', state.activeTabId)
      }
    }),

  /**
   * Set active tab
   * FLOW: Component calls setActiveTab() → Store updates → DockLayout useEffect detects change → DockLayout activates tab
   */
  setActiveTab: (tabId) =>
    set((state) => {
      if (tabId && state.openTabs.some((t) => t.id === tabId)) {
        state.activeTabId = tabId
        console.log('[Store] Setting active tab:', tabId)
      } else if (tabId === null) {
        state.activeTabId = null
        console.log('[Store] Clearing active tab')
      }
    }),

  /**
   * CRITICAL: Sync tabs FROM DockLayout TO Store
   * This is called when user manually interacts with DockLayout (closes tab, reorders, etc.)
   * FLOW: User closes tab in DockLayout → DockLayout onLayoutChange → syncTabsFromDockLayout() → Store updates
   *
   * @param tabs - Current tabs extracted from DockLayout
   * @param activeTabId - Currently active tab ID from DockLayout
   */
  syncTabsFromDockLayout: (tabs, activeTabId) =>
    set((state) => {
      console.log('[Store] Syncing from DockLayout:', tabs.length, 'tabs, active:', activeTabId)

      // Create new array reference (immer workaround)
      state.openTabs = [...tabs]
      state.activeTabId = activeTabId

      // NOTE: This update will trigger DockLayout useEffect, but it should be a no-op
      // because the data is already the same (coming from DockLayout itself)
    }),

  /**
   * Helper: Check if tab is open
   */
  isTabOpen: (tabId) => {
    return get().openTabs.some((t) => t.id === tabId)
  },

  /**
   * Helper: Get tabs by type
   */
  getTabsByType: (type) => {
    return get().openTabs.filter((t) => t.type === type)
  }
})

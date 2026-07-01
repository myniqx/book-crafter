import { StateCreator } from 'zustand'
import type { AppStore } from '..'
import { logger } from '@renderer/lib/logger'

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
  // Sidebar state
  activePanel: PanelId | null
  panelVisible: boolean
  sidebarWidth: number

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
  createChapterDialogOpen: boolean
  settingsDialogOpen: boolean

  // Sidebar actions
  toggleSidebar: () => void
  togglePanel: (panelId: PanelId) => void
  closePanel: () => void
  setSidebarWidth: (width: number) => void

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
  setCreateChapterDialogOpen: (open: boolean) => void
  setSettingsDialogOpen: (open: boolean) => void
}

const DEFAULT_SIDEBAR_WIDTH = 250
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 400

export const createUISlice: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  UISlice
> = (set, get) => ({
  // Sidebar state
  activePanel: 'file-explorer',
  panelVisible: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  // Tab management state
  openTabs: [],
  activeTabId: null,

  // Dialog states
  createBookDialogOpen: false,
  createEntityDialogOpen: false,
  createNoteDialogOpen: false,
  createChapterDialogOpen: false,
  settingsDialogOpen: false,

  toggleSidebar: () =>
    set((state) => {
      state.panelVisible = !state.panelVisible
    }),

  // If the active panel is clicked again, toggle visibility; otherwise switch to it
  togglePanel: (panelId) =>
    set((state) => {
      if (state.activePanel === panelId) {
        state.panelVisible = !state.panelVisible
      } else {
        state.activePanel = panelId
        state.panelVisible = true
      }
    }),

  closePanel: () =>
    set((state) => {
      state.panelVisible = false
    }),

  setSidebarWidth: (width) =>
    set((state) => {
      state.sidebarWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width))
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

  setCreateChapterDialogOpen: (open) =>
    set((state) => {
      state.createChapterDialogOpen = open
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
        logger.debug(`Tab already open, activating: ${metadata.id}`, 'Store')
      } else {
        // Create new array reference to trigger React re-render (immer workaround)
        state.openTabs = [...state.openTabs, metadata]
        state.activeTabId = metadata.id
        logger.debug(`Opening new tab: ${metadata.id}`, 'Store')
      }
    }),

  /**
   * Close a tab by ID
   * FLOW: Component calls closeTab() → Store updates → DockLayout useEffect detects change → DockLayout removes tab
   */
  closeTab: (tabId) =>
    set((state) => {
      logger.debug(`Closing tab: ${tabId}`, 'Store')

      // Create new array reference (immer workaround)
      state.openTabs = state.openTabs.filter((t) => t.id !== tabId)

      // If active tab was closed, set active to last tab or null
      if (state.activeTabId === tabId) {
        state.activeTabId = state.openTabs.length > 0 ? state.openTabs[state.openTabs.length - 1].id : null
        logger.debug(`Active tab closed, new active: ${state.activeTabId}`, 'Store')
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
        logger.debug(`Setting active tab: ${tabId}`, 'Store')
      } else if (tabId === null) {
        state.activeTabId = null
        logger.debug('Clearing active tab', 'Store')
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
      logger.debug(`Syncing from DockLayout: ${tabs.length} tabs, active: ${activeTabId}`, 'Store')

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

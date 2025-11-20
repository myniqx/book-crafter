import React, { useRef, useEffect, useCallback } from 'react'
import { DockLayout as RcDockLayout } from 'rc-dock'
import 'rc-dock/dist/rc-dock.css'
import type { LayoutData, TabData, DropDirection } from 'rc-dock'
import { cn } from '@renderer/lib/utils'
import type { DockLayoutProps } from './types'
import { createDefaultLayout, createTabDataFromMetadata, extractTabsFromLayout } from './utils'
import { useCoreStore, type TabMetadata } from '@renderer/store'

/**
 * DockLayout Component
 * ====================
 * Manages the main dockable layout with TWO-WAY SYNC to Store
 *
 * SYNC FLOW:
 * 1. Store → DockLayout: useEffect watches openTabs, syncs changes to rc-dock
 * 2. DockLayout → Store: onLayoutChange extracts tabs, syncs back to store
 *
 * IMPORTANT:
 * - Store is the SINGLE SOURCE OF TRUTH for tab state
 * - DockLayout mirrors the store state in rc-dock
 * - User interactions in DockLayout sync back to store via syncTabsFromDockLayout()
 */
export const DockLayout: React.FC<DockLayoutProps> = ({ children }) => {
  const dockRef = useRef<RcDockLayout>(null)

  // Store tab state (SINGLE SOURCE OF TRUTH)
  const openTabs = useCoreStore((state) => state.openTabs)
  const activeTabId = useCoreStore((state) => state.activeTabId)
  const syncTabsFromDockLayout = useCoreStore((state) => state.syncTabsFromDockLayout)

  // Initialize with default layout
  const defaultLayout = createDefaultLayout()

  /**
   * Helper Functions for Dock Operations
   * =====================================
   * These wrap rc-dock's dockMove API for common operations
   * IMPORTANT: These are the CORE operations for tab management
   */

  // Remove a tab by ID
  const removeTab = useCallback((tabId: string): void => {
    if (!dockRef.current) return
    const tab = dockRef.current.find(tabId)
    if (tab) {
      dockRef.current.dockMove(tab as TabData, null, 'remove')
    }
  }, [])

  // Add a tab to a panel (or to active tab's panel if no panelId specified)
  const addTab = useCallback((tabData: TabData, panelId?: string): void => {
    if (!dockRef.current) return
    const dock = dockRef.current

    if (panelId) {
      // Specific panel provided, add there
      const panel = dock.find(panelId)
      if (panel) {
        dock.dockMove(tabData, panel, 'middle')
      }
    } else {
      // No panel specified: add to active tab's panel (or dockbox if no active tab)
      const currentActiveTabId = useCoreStore.getState().activeTabId

      if (currentActiveTabId) {
        // Find the active tab's panel
        const activeTab = dock.find(currentActiveTabId)
        if (activeTab) {
          // Add to the same panel as active tab
          dock.dockMove(tabData, activeTab, 'middle')
          return
        }
      }

      // Fallback: add to main dockbox
      const layout = dock.getLayout()
      dock.dockMove(tabData, layout.dockbox, 'middle')
    }
  }, [])

  // Move a tab to a target with specified direction
  const moveTab = useCallback((tabId: string, targetId: string, direction: DropDirection): void => {
    if (!dockRef.current) return
    const tab = dockRef.current.find(tabId)
    const target = dockRef.current.find(targetId)
    if (tab && target) {
      dockRef.current.dockMove(tab as TabData, target, direction)
    }
  }, [])

  // Maximize a tab
  const maximizeTab = useCallback((tabId: string): void => {
    if (!dockRef.current) return
    const tab = dockRef.current.find(tabId)
    if (tab) {
      dockRef.current.dockMove(tab as TabData, null, 'maximize')
    }
  }, [])

  // Float a tab
  const floatTab = useCallback((tabId: string): void => {
    if (!dockRef.current) return
    const tab = dockRef.current.find(tabId)
    if (tab) {
      dockRef.current.dockMove(tab as TabData, null, 'float')
    }
  }, [])

  /**
   * SYNC 1: Store → DockLayout
   * ===========================
   * When store.openTabs changes, update DockLayout to match
   *
   * This handles:
   * - Opening new tabs (via openTab() action)
   * - Closing tabs (via closeTab() action)
   * - Activating tabs (via setActiveTab() action)
   */
  useEffect(() => {
    if (!dockRef.current) {
      console.log('❌ [DockLayout] Ref not ready, skipping sync')
      return
    }

    const dock = dockRef.current
    const currentLayout = dock.getLayout()

    // Extract current tab IDs from DockLayout
    const currentTabs = extractTabsFromLayout(currentLayout)
    const currentTabIds = new Set(currentTabs.map((t: TabMetadata) => t.id))

    // Find tabs to ADD (in store but not in DockLayout)
    const storeTabIds = new Set(openTabs.map((t: TabMetadata) => t.id))
    const tabsToAdd = openTabs.filter((tab: TabMetadata) => !currentTabIds.has(tab.id))

    // Find tabs to REMOVE (in DockLayout but not in store)
    const tabsToRemove = currentTabs.filter((tab: TabMetadata) => !storeTabIds.has(tab.id))

    // ADD new tabs (using helper function)
    tabsToAdd.forEach((metadata: TabMetadata) => {
      const tabData = createTabDataFromMetadata(metadata)
      addTab(tabData) // Uses the helper function
    })

    // Remove welcome tab when any real tab is added
    if (openTabs.length > 0) {
      removeTab('editor-welcome')
    }

    // REMOVE closed tabs (using helper function)
    tabsToRemove.forEach((metadata: TabMetadata) => {
      removeTab(metadata.id) // Uses the helper function
    })
  }, [openTabs, activeTabId, addTab, removeTab])

  /**
   * SYNC 2: DockLayout → Store
   * ===========================
   * When user interacts with DockLayout (closes tab, reorders, etc.),
   * extract the new state and sync it back to store
   *
   * CRITICAL: This completes the two-way sync loop
   */
  const handleLayoutChange = (newLayout: LayoutData): void => {
    // Extract current tabs from new layout
    const currentTabs = extractTabsFromLayout(newLayout)

    // Determine active tab (rc-dock doesn't provide this directly, so we keep store's activeTabId)
    // If the active tab was closed, it will be handled by store's closeTab logic
    const currentActiveTabId = useCoreStore.getState().activeTabId
    const activeTabStillExists = currentTabs.some((t: TabMetadata) => t.id === currentActiveTabId)

    const newActiveTabId = activeTabStillExists
      ? currentActiveTabId
      : currentTabs.length > 0
        ? currentTabs[0].id
        : null

    // Sync back to store
    syncTabsFromDockLayout(currentTabs, newActiveTabId)
  }

  return (
    <div className={cn('h-full w-full', 'dock-layout-container')}>
      <RcDockLayout
        ref={dockRef}
        defaultLayout={defaultLayout}
        onLayoutChange={handleLayoutChange}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }}
      />
      {children}
    </div>
  )
}

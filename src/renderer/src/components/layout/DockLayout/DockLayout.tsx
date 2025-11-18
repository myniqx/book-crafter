import React, { useRef, useEffect } from 'react'
import { DockLayout as RcDockLayout } from 'rc-dock'
import 'rc-dock/dist/rc-dock.css'
import type { LayoutData, TabData } from 'rc-dock'
import { cn } from '@renderer/lib/utils'
import type { DockLayoutProps } from './types'
import {
  createDefaultLayout,
  getPanel,
  createTabDataFromMetadata,
  extractTabsFromLayout
} from './panels'
import { useCoreStore, useSidebarStore } from '@renderer/store'

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
  const activePanels = useSidebarStore((state) => state.activePanels)

  // Store tab state (SINGLE SOURCE OF TRUTH)
  const openTabs = useCoreStore((state) => state.openTabs)
  const activeTabId = useCoreStore((state) => state.activeTabId)
  const syncTabsFromDockLayout = useCoreStore((state) => state.syncTabsFromDockLayout)

  // Initialize with default layout
  const defaultLayout = createDefaultLayout()

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

    console.log('┌─────────────────────────────────────────────────────')
    console.log('│ [DockLayout] 🔄 STORE → DOCKLAYOUT SYNC')
    console.log('├─────────────────────────────────────────────────────')
    console.log('│ [DockLayout] 📦 Store has', openTabs.length, 'tabs')
    openTabs.forEach((tab, idx) => {
      console.log(`│   ${idx + 1}. ${tab.id} - "${tab.title}"`)
    })

    // Extract current tab IDs from DockLayout
    const currentTabs = extractTabsFromLayout(currentLayout)
    const currentTabIds = new Set(currentTabs.map(t => t.id))

    console.log('│ [DockLayout] 🖼️  DockLayout has', currentTabs.length, 'tabs')
    currentTabs.forEach((tab, idx) => {
      console.log(`│   ${idx + 1}. ${tab.id} - "${tab.title}"`)
    })

    // Find tabs to ADD (in store but not in DockLayout)
    const storeTabIds = new Set(openTabs.map(t => t.id))
    const tabsToAdd = openTabs.filter(tab => !currentTabIds.has(tab.id))

    // Find tabs to REMOVE (in DockLayout but not in store)
    const tabsToRemove = currentTabs.filter(tab => !storeTabIds.has(tab.id))

    console.log('│ [DockLayout] ➕ Tabs to ADD:', tabsToAdd.length)
    console.log('│ [DockLayout] ➖ Tabs to REMOVE:', tabsToRemove.length)

    // ADD new tabs
    tabsToAdd.forEach((metadata) => {
      console.log('│ [DockLayout] ➕ Adding tab:', metadata.id)
      const tabData = createTabDataFromMetadata(metadata)

      // Find the welcome tab's panel to add new tabs there
      const welcomeTabPanel = currentLayout.dockbox

      // Add to the same panel as welcome tab
      const result = dock.dockMove(tabData, welcomeTabPanel, 'middle')
      console.log('│ [DockLayout] ✅ dockMove completed, result:', result ? 'success' : 'null')

      // Remove welcome tab when first real tab is added
      if (openTabs.length === 1) {
        console.log('│ [DockLayout] 🗑️  Removing welcome tab (first real tab opened)')
        dock.dockMove({ id: 'editor-welcome' } as TabData, null, 'remove')
      }
    })

    // REMOVE closed tabs
    tabsToRemove.forEach((metadata) => {
      console.log('│ [DockLayout] ➖ Removing tab:', metadata.id)
      dock.dockMove({ id: metadata.id } as TabData, null, 'remove')
    })

    console.log('│ [DockLayout] 🎯 Active tab ID:', activeTabId)
    console.log('└─────────────────────────────────────────────────────')

  }, [openTabs, activeTabId])

  /**
   * SYNC 2: Sidebar Panels → DockLayout
   * ====================================
   * When sidebar panels are toggled, update DockLayout
   * (This is existing functionality, keep it)
   */
  useEffect(() => {
    if (!dockRef.current) return

    const dock = dockRef.current
    const currentLayout = dock.getLayout()
    const currentPanelIds = new Set<string>()

    // Collect all currently open panel IDs from layout
    const collectPanelIds = (data: LayoutData | any): void => {
      if (!data) return

      if (data.tabs && Array.isArray(data.tabs)) {
        data.tabs.forEach((tab: any) => {
          if (tab.id && tab.id !== 'editor-welcome') {
            currentPanelIds.add(tab.id)
          }
        })
      }

      if (data.children && Array.isArray(data.children)) {
        data.children.forEach((child: any) => collectPanelIds(child))
      }

      if (data.dockbox) {
        collectPanelIds(data.dockbox)
      }
    }

    collectPanelIds(currentLayout)

    // Add panels that should be active but aren't
    activePanels.forEach((panelId) => {
      if (!currentPanelIds.has(panelId)) {
        const panelConfig = getPanel(panelId)
        if (panelConfig) {
          console.log('[DockLayout] Adding panel from sidebar:', panelId)
          dock.dockMove({
            id: panelId,
            title: panelConfig.title,
            content: panelConfig.content,
            closable: panelConfig.closable
          } as TabData, null, 'right')
        }
      }
    })

    // Remove panels that shouldn't be active
    currentPanelIds.forEach((panelId) => {
      if (!activePanels.includes(panelId as any) && panelId !== 'editor-welcome' && !panelId.startsWith('editor-')) {
        console.log('[DockLayout] Removing panel (closed in sidebar):', panelId)
        dock.dockMove({ id: panelId } as TabData, null, 'remove')
      }
    })
  }, [activePanels])


  /**
   * SYNC 3: DockLayout → Store
   * ===========================
   * When user interacts with DockLayout (closes tab, reorders, etc.),
   * extract the new state and sync it back to store
   *
   * CRITICAL: This completes the two-way sync loop
   */
  const handleLayoutChange = (newLayout: LayoutData): void => {
    console.log('┌─────────────────────────────────────────────────────')
    console.log('│ [DockLayout] ⚡ LAYOUT CHANGE EVENT')
    console.log('├─────────────────────────────────────────────────────')

    // Extract current tabs from new layout
    const currentTabs = extractTabsFromLayout(newLayout)
    console.log('│ [DockLayout] 📊 Extracted tabs:', currentTabs.length)
    currentTabs.forEach((tab, idx) => {
      console.log(`│   ${idx + 1}. ${tab.id} - "${tab.title}" (${tab.type})`)
    })

    // Determine active tab (rc-dock doesn't provide this directly, so we keep store's activeTabId)
    // If the active tab was closed, it will be handled by store's closeTab logic
    const currentActiveTabId = useCoreStore.getState().activeTabId
    const activeTabStillExists = currentTabs.some(t => t.id === currentActiveTabId)

    console.log('│ [DockLayout] 🎯 Active tab:', currentActiveTabId)
    console.log('│ [DockLayout] ✅ Active tab still exists?', activeTabStillExists)

    const newActiveTabId = activeTabStillExists
      ? currentActiveTabId
      : (currentTabs.length > 0 ? currentTabs[0].id : null)

    console.log('│ [DockLayout] 🔄 Syncing to store with activeTabId:', newActiveTabId)

    // Sync back to store
    syncTabsFromDockLayout(currentTabs, newActiveTabId)

    // Sync closed panels back to sidebar store
    const hidePanel = useSidebarStore.getState().hidePanel
    const currentPanelIds = new Set(currentTabs.map(t => t.id))

    activePanels.forEach((panelId) => {
      if (!currentPanelIds.has(panelId)) {
        console.log('│ [DockLayout] 🗑️  Panel closed in layout, removing from sidebar store:', panelId)
        hidePanel(panelId)
      }
    })

    console.log('└─────────────────────────────────────────────────────')
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

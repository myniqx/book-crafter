import React, { useRef, useEffect } from 'react'
import { DockLayout as RcDockLayout } from 'rc-dock'
import 'rc-dock/dist/rc-dock.css'
import type { LayoutData, TabData } from 'rc-dock'
import { cn } from '@renderer/lib/utils'
import type { DockLayoutProps } from './types'
import { createDefaultLayout, getPanel, createEditorTabsFromStore } from './panels'
import { useStore, useContentStore } from '@renderer/store'

export const DockLayout: React.FC<DockLayoutProps> = ({ children }) => {
  const dockRef = useRef<RcDockLayout>(null)
  const activePanels = useStore((state) => state.activePanels)
  const openEditorTabs = useContentStore((state) => state.openEditorTabs)
  const books = useContentStore((state) => state.books)

  // Initialize with default layout
  const defaultLayout = createDefaultLayout()

  // Sync editor tabs with DockLayout
  useEffect(() => {
    if (!dockRef.current) return

    const dock = dockRef.current
    const currentLayout = dock.getLayout()

    // Get currently open editor tab IDs
    const currentEditorTabIds = new Set<string>()
    const collectEditorTabIds = (data: LayoutData | any): void => {
      if (!data) return

      if (data.tabs && Array.isArray(data.tabs)) {
        data.tabs.forEach((tab: any) => {
          if (tab.id && tab.id.startsWith('editor-') && tab.id !== 'editor-welcome') {
            currentEditorTabIds.add(tab.id)
          }
        })
      }

      if (data.children && Array.isArray(data.children)) {
        data.children.forEach((child: any) => collectEditorTabIds(child))
      }

      if (data.dockbox) {
        collectEditorTabIds(data.dockbox)
      }
    }

    collectEditorTabIds(currentLayout)

    // Create editor tabs from store
    const editorTabs = createEditorTabsFromStore(openEditorTabs, books)

    // Add new editor tabs
    editorTabs.forEach((editorTab) => {
      if (!currentEditorTabIds.has(editorTab.id)) {
        console.log('DockLayout: Adding editor tab', editorTab.id)
        dock.dockMove(editorTab, null, 'middle')
      }
    })

    // Remove closed editor tabs
    const expectedEditorTabIds = new Set(editorTabs.map((tab) => tab.id))
    currentEditorTabIds.forEach((tabId) => {
      if (!expectedEditorTabIds.has(tabId)) {
        console.log('DockLayout: Removing editor tab', tabId)
        dock.dockMove({ id: tabId } as TabData, null, 'remove')
      }
    })
  }, [openEditorTabs, books])

  // Sync activePanels with DockLayout
  useEffect(() => {
    if (!dockRef.current) return

    const dock = dockRef.current

    // Get current layout to see which panels are open
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
          console.log('DockLayout: Adding panel', panelId)
          // Add to right side as new tab
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
    // NOTE: editor-welcome is always kept
    currentPanelIds.forEach((panelId) => {
      if (!activePanels.includes(panelId as any) && panelId !== 'editor-welcome') {
        console.log('DockLayout: Removing panel', panelId)
        dock.dockMove({ id: panelId } as TabData, null, 'remove')
      }
    })
  }, [activePanels])

  // Load layout from localStorage
  const loadLayout = (): LayoutData | undefined => {
    try {
      const saved = localStorage.getItem('book-crafter-layout')
      if (saved) {
        const layout = JSON.parse(saved) as LayoutData

        // IMPORTANT: Clear floating panels (they cause UI blocking issues)
        if (layout.floatbox) {
          layout.floatbox.children = []
        }

        return layout
      }
    } catch (error) {
      console.error('Failed to load layout:', error)
    }
    return undefined
  }

  // Save layout to localStorage
  const saveLayout = (layout: LayoutData): void => {
    try {
      localStorage.setItem('book-crafter-layout', JSON.stringify(layout))
    } catch (error) {
      console.error('Failed to save layout:', error)
    }
  }

  const handleLayoutChange = (newLayout: LayoutData): void => {
    saveLayout(newLayout)

    // Sync closed panels back to store
    const hidePanel = useStore.getState().hidePanel
    const currentPanelIds = new Set<string>()

    // Collect all currently open panel IDs from new layout
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

    collectPanelIds(newLayout)

    // Remove from activePanels if closed in DockLayout
    activePanels.forEach((panelId) => {
      if (!currentPanelIds.has(panelId)) {
        console.log('DockLayout: Panel closed, removing from store:', panelId)
        hidePanel(panelId)
      }
    })
  }

  return (
    <div className={cn('h-full w-full', 'dock-layout-container')}>
      <RcDockLayout
        ref={dockRef}
        defaultLayout={loadLayout() || defaultLayout}
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
